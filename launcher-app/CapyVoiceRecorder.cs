using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;

namespace CapybaraHub
{
    public class CapyVoiceRecorder : IDisposable
    {
        private const int CALLBACK_FUNCTION = 0x00030000;
        private const int WAVE_FORMAT_PCM = 1;
        private const int MM_WIM_DATA = 0x3C0;
        private const int SAMPLE_RATE = 16000;
        private const int CHANNELS = 1;
        private const int BITS_PER_SAMPLE = 16;
        private const int BUFFER_COUNT = 6;
        private const int BUFFER_SIZE = 3200; // 100ms at 16kHz 16-bit mono

        [StructLayout(LayoutKind.Sequential)]
        private struct WAVEFORMATEX
        {
            public short wFormatTag;
            public short nChannels;
            public int nSamplesPerSec;
            public int nAvgBytesPerSec;
            public short nBlockAlign;
            public short wBitsPerSample;
            public short cbSize;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct WAVEHDR
        {
            public IntPtr lpData;
            public int dwBufferLength;
            public int dwBytesRecorded;
            public IntPtr dwUser;
            public int dwFlags;
            public int dwLoops;
            public IntPtr lpNext;
            public IntPtr reserved;
        }

        private delegate void WaveInProc(IntPtr hwi, int uMsg, IntPtr dwInstance, IntPtr dwParam1, IntPtr dwParam2);

        [DllImport("winmm.dll")]
        private static extern int waveInGetNumDevs();

        [DllImport("winmm.dll")]
        private static extern int waveInOpen(out IntPtr phwi, int uDeviceID, ref WAVEFORMATEX pwfx, WaveInProc dwCallback, IntPtr dwInstance, int fdwOpen);

        [DllImport("winmm.dll")]
        private static extern int waveInPrepareHeader(IntPtr hwi, IntPtr pwh, int cbwh);

        [DllImport("winmm.dll")]
        private static extern int waveInUnprepareHeader(IntPtr hwi, IntPtr pwh, int cbwh);

        [DllImport("winmm.dll")]
        private static extern int waveInAddBuffer(IntPtr hwi, IntPtr pwh, int cbwh);

        [DllImport("winmm.dll")]
        private static extern int waveInStart(IntPtr hwi);

        [DllImport("winmm.dll")]
        private static extern int waveInStop(IntPtr hwi);

        [DllImport("winmm.dll")]
        private static extern int waveInReset(IntPtr hwi);

        [DllImport("winmm.dll")]
        private static extern int waveInClose(IntPtr hwi);

        private IntPtr _hWaveIn = IntPtr.Zero;
        private WaveInProc _callbackDelegate;
        private readonly List<IntPtr> _headerPtrs = new List<IntPtr>();
        private readonly List<IntPtr> _bufferPtrs = new List<IntPtr>();
        private MemoryStream _activePhraseStream;
        private MemoryStream _fullSessionStream;
        private readonly object _lock = new object();

        // Real-time C# High-Pass IIR Filter state (cuts low-frequency fan & room rumble < 140Hz)
        private double _hpPrevX = 0.0;
        private double _hpPrevY = 0.0;
        private double _noiseFloor = 380.0;

        // Persistent Warm Python Streaming Daemon
        private Process _daemonProc;
        private readonly object _daemonLock = new object();
        private int _reqCounter = 0;

        public bool IsRecording { get; private set; }
        public double CurrentLevel { get; private set; }
        public DateTime StartedAt { get; private set; }
        public DateTime PhraseStartedAt { get; private set; }
        public bool HasDetectedSpeechInSession { get; private set; }
        public bool HasDetectedSpeechInPhrase { get; private set; }
        public DateTime LastSpeechAt { get; private set; }

        public static bool HasMicrophoneDevice()
        {
            try { return waveInGetNumDevs() > 0; }
            catch { return false; }
        }

        public void EnsureStreamingDaemonWarm(string hubRoot)
        {
            lock (_daemonLock)
            {
                if (_daemonProc != null && !_daemonProc.HasExited) return;

                string scriptPath = Path.Combine(hubRoot, "tools", "voice-transcribe-vi.py");
                if (!File.Exists(scriptPath)) return;

                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c python \"" + scriptPath + "\" --daemon",
                        WorkingDirectory = hubRoot,
                        UseShellExecute = false,
                        RedirectStandardInput = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        CreateNoWindow = true,
                        StandardOutputEncoding = Encoding.UTF8,
                        StandardErrorEncoding = Encoding.UTF8
                    };
                    _daemonProc = Process.Start(psi);
                    if (_daemonProc != null)
                    {
                        // Read initial {"daemon": "ready"} line
                        _daemonProc.StandardOutput.ReadLine();
                    }
                }
                catch
                {
                    _daemonProc = null;
                }
            }
        }

        public bool StartRecording(string hubRoot, out string errorMessage)
        {
            errorMessage = "";
            if (IsRecording) return true;

            if (!HasMicrophoneDevice())
            {
                errorMessage = "Máy chưa cắm Micro hoặc chưa bật quyền Micro trong Windows Settings.";
                return false;
            }

            EnsureStreamingDaemonWarm(hubRoot);

            lock (_lock)
            {
                _activePhraseStream = new MemoryStream();
                _fullSessionStream = new MemoryStream();
                CurrentLevel = 0.0;
                HasDetectedSpeechInSession = false;
                HasDetectedSpeechInPhrase = false;
                StartedAt = DateTime.Now;
                PhraseStartedAt = DateTime.Now;
                LastSpeechAt = DateTime.Now;
                _hpPrevX = 0.0;
                _hpPrevY = 0.0;
                _noiseFloor = 380.0;

                WAVEFORMATEX fmt = new WAVEFORMATEX
                {
                    wFormatTag = WAVE_FORMAT_PCM,
                    nChannels = CHANNELS,
                    nSamplesPerSec = SAMPLE_RATE,
                    wBitsPerSample = BITS_PER_SAMPLE,
                    nBlockAlign = (short)(CHANNELS * (BITS_PER_SAMPLE / 8)),
                    nAvgBytesPerSec = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8),
                    cbSize = 0
                };

                _callbackDelegate = OnWaveInCallback;
                int res = waveInOpen(out _hWaveIn, -1, ref fmt, _callbackDelegate, IntPtr.Zero, CALLBACK_FUNCTION);
                if (res != 0 || _hWaveIn == IntPtr.Zero)
                {
                    errorMessage = "Không thể mở Micro (Mã lỗi WinMM: " + res + "). Hãy kiểm tra quyền Micro.";
                    return false;
                }

                IsRecording = true;

                int hdrSize = Marshal.SizeOf(typeof(WAVEHDR));
                for (int i = 0; i < BUFFER_COUNT; i++)
                {
                    IntPtr bufPtr = Marshal.AllocHGlobal(BUFFER_SIZE);
                    IntPtr hdrPtr = Marshal.AllocHGlobal(hdrSize);

                    WAVEHDR hdr = new WAVEHDR
                    {
                        lpData = bufPtr,
                        dwBufferLength = BUFFER_SIZE,
                        dwBytesRecorded = 0,
                        dwFlags = 0
                    };
                    Marshal.StructureToPtr(hdr, hdrPtr, false);

                    waveInPrepareHeader(_hWaveIn, hdrPtr, hdrSize);
                    waveInAddBuffer(_hWaveIn, hdrPtr, hdrSize);

                    _bufferPtrs.Add(bufPtr);
                    _headerPtrs.Add(hdrPtr);
                }

                waveInStart(_hWaveIn);
                return true;
            }
        }

        private void OnWaveInCallback(IntPtr hwi, int uMsg, IntPtr dwInstance, IntPtr dwParam1, IntPtr dwParam2)
        {
            if (uMsg != MM_WIM_DATA || !IsRecording) return;

            try
            {
                WAVEHDR hdr = (WAVEHDR)Marshal.PtrToStructure(dwParam1, typeof(WAVEHDR));
                if (hdr.dwBytesRecorded > 0)
                {
                    byte[] chunk = new byte[hdr.dwBytesRecorded];
                    Marshal.Copy(hdr.lpData, chunk, 0, hdr.dwBytesRecorded);

                    int maxSample = 1;
                    long sumAbs = 0;
                    int sampleCount = 0;

                    // Real-time C# High-Pass Filter (alpha = 0.94 cuts fan rumble < 140Hz immediately)
                    for (int i = 0; i + 1 < chunk.Length; i += 2)
                    {
                        short rawSample = BitConverter.ToInt16(chunk, i);
                        double x = (double)rawSample;
                        double y = 0.94 * (_hpPrevY + x - _hpPrevX);
                        _hpPrevX = x;
                        _hpPrevY = y;

                        if (y > 32767.0) y = 32767.0;
                        else if (y < -32768.0) y = -32768.0;
                        short cleanSample = (short)y;

                        // Write filtered clean sample back to chunk
                        chunk[i] = (byte)(cleanSample & 0xFF);
                        chunk[i + 1] = (byte)((cleanSample >> 8) & 0xFF);

                        int abs = cleanSample == short.MinValue ? 32767 : Math.Abs((int)cleanSample);
                        if (abs > maxSample) maxSample = abs;
                        sumAbs += abs;
                        sampleCount++;
                    }

                    double avgAmp = sampleCount > 0 ? (double)sumAbs / sampleCount : 0.0;
                    CurrentLevel = Math.Min(1.0, maxSample / 7500.0);

                    double elapsedSec = (DateTime.Now - StartedAt).TotalSeconds;
                    if (elapsedSec < 0.22)
                    {
                        _noiseFloor = Math.Max(200.0, Math.Min(1500.0, (_noiseFloor * 0.7) + (avgAmp * 0.3)));
                    }
                    else
                    {
                        double voiceTrigger = Math.Max(450.0, _noiseFloor * 1.95);
                        if (avgAmp > voiceTrigger || maxSample > voiceTrigger * 2.4)
                        {
                            HasDetectedSpeechInSession = true;
                            HasDetectedSpeechInPhrase = true;
                            LastSpeechAt = DateTime.Now;
                        }
                    }

                    lock (_lock)
                    {
                        if (_activePhraseStream != null)
                        {
                            _activePhraseStream.Write(chunk, 0, chunk.Length);
                        }
                        if (_fullSessionStream != null)
                        {
                            _fullSessionStream.Write(chunk, 0, chunk.Length);
                        }
                    }
                }

                if (IsRecording && _hWaveIn != IntPtr.Zero)
                {
                    waveInAddBuffer(_hWaveIn, dwParam1, Marshal.SizeOf(typeof(WAVEHDR)));
                }
            }
            catch { }
        }

        public int GetActivePhraseByteLength()
        {
            lock (_lock)
            {
                return _activePhraseStream != null ? (int)_activePhraseStream.Length : 0;
            }
        }

        /// <summary>
        /// Chụp nhanh cụm âm thanh đang nói hiện tại ra file .wav tạm mà KHÔNG làm ngắt quá trình thu âm,
        /// giúp dịch streaming từng chữ lên màn hình ngay lúc người dùng đang nói!
        /// </summary>
        public bool TrySnapshotActivePhraseToWav(string tempWavPath, bool resetPhraseForNextClause)
        {
            byte[] pcmBytes;
            lock (_lock)
            {
                if (_activePhraseStream == null || _activePhraseStream.Length < 14000) // < 0.44s
                    return false;
                pcmBytes = _activePhraseStream.ToArray();
                if (resetPhraseForNextClause)
                {
                    _activePhraseStream.SetLength(0);
                    HasDetectedSpeechInPhrase = false;
                    PhraseStartedAt = DateTime.Now;
                }
            }

            string dir = Path.GetDirectoryName(tempWavPath);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
            WriteWavFile(tempWavPath, pcmBytes, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);
            return true;
        }

        public bool ShouldCommitCurrentClause()
        {
            if (!IsRecording || !HasDetectedSpeechInPhrase) return false;
            double pauseSec = (DateTime.Now - LastSpeechAt).TotalSeconds;
            double phraseSec = (DateTime.Now - PhraseStartedAt).TotalSeconds;
            // Khi người dùng ngắt hơi nhẹ ~0.55s giữa 2 vế câu (hoặc nói liên tục > 4.5s), chốt vế đó lên màn hình và cuốn chiếu vế mới!
            return (phraseSec >= 1.2 && pauseSec >= 0.55) || (phraseSec >= 4.5 && pauseSec >= 0.25);
        }

        public bool ShouldAutoStopSessionOnSilence()
        {
            if (!IsRecording || !HasDetectedSpeechInSession) return false;
            double silenceSec = (DateTime.Now - LastSpeechAt).TotalSeconds;
            double totalSec = (DateTime.Now - StartedAt).TotalSeconds;
            return totalSec >= 1.5 && silenceSec >= 1.8;
        }

        public string StopAndSaveWav(string outputWavPath, out string finalPhraseWavPath)
        {
            finalPhraseWavPath = "";
            if (!IsRecording) return outputWavPath;
            IsRecording = false;
            CurrentLevel = 0.0;

            try
            {
                if (_hWaveIn != IntPtr.Zero)
                {
                    waveInStop(_hWaveIn);
                    waveInReset(_hWaveIn);

                    int hdrSize = Marshal.SizeOf(typeof(WAVEHDR));
                    foreach (IntPtr hdrPtr in _headerPtrs)
                    {
                        try { waveInUnprepareHeader(_hWaveIn, hdrPtr, hdrSize); } catch { }
                        Marshal.FreeHGlobal(hdrPtr);
                    }
                    foreach (IntPtr bufPtr in _bufferPtrs)
                    {
                        Marshal.FreeHGlobal(bufPtr);
                    }
                    _headerPtrs.Clear();
                    _bufferPtrs.Clear();

                    waveInClose(_hWaveIn);
                    _hWaveIn = IntPtr.Zero;
                }
            }
            catch { }

            lock (_lock)
            {
                byte[] phraseBytes = _activePhraseStream != null ? _activePhraseStream.ToArray() : new byte[0];
                byte[] fullBytes = _fullSessionStream != null ? _fullSessionStream.ToArray() : new byte[0];

                if (_activePhraseStream != null) { _activePhraseStream.Dispose(); _activePhraseStream = null; }
                if (_fullSessionStream != null) { _fullSessionStream.Dispose(); _fullSessionStream = null; }

                string dir = Path.GetDirectoryName(outputWavPath);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                WriteWavFile(outputWavPath, fullBytes, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);

                if (phraseBytes.Length >= 8000)
                {
                    finalPhraseWavPath = Path.Combine(dir, "voice-phrase-tail.wav");
                    WriteWavFile(finalPhraseWavPath, phraseBytes, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);
                }
            }
            return outputWavPath;
        }

        private static void WriteWavFile(string filePath, byte[] pcmData, int sampleRate, short channels, short bitsPerSample)
        {
            int byteRate = sampleRate * channels * (bitsPerSample / 8);
            short blockAlign = (short)(channels * (bitsPerSample / 8));

            using (FileStream fs = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            using (BinaryWriter bw = new BinaryWriter(fs))
            {
                bw.Write(Encoding.ASCII.GetBytes("RIFF"));
                bw.Write(36 + pcmData.Length);
                bw.Write(Encoding.ASCII.GetBytes("WAVE"));
                bw.Write(Encoding.ASCII.GetBytes("fmt "));
                bw.Write(16);
                bw.Write((short)1);
                bw.Write(channels);
                bw.Write(sampleRate);
                bw.Write(byteRate);
                bw.Write(blockAlign);
                bw.Write(bitsPerSample);
                bw.Write(Encoding.ASCII.GetBytes("data"));
                bw.Write(pcmData.Length);
                bw.Write(pcmData);
            }
        }

        public string TranscribeViaWarmDaemon(string hubRoot, string wavPath, out string errorMsg)
        {
            errorMsg = "";
            if (!File.Exists(wavPath)) return "";

            EnsureStreamingDaemonWarm(hubRoot);

            lock (_daemonLock)
            {
                if (_daemonProc != null && !_daemonProc.HasExited)
                {
                    try
                    {
                        _reqCounter++;
                        JavaScriptSerializer ser = new JavaScriptSerializer();
                        string payload = ser.Serialize(new Dictionary<string, object>
                        {
                            { "id", _reqCounter },
                            { "wav_path", wavPath }
                        });
                        _daemonProc.StandardInput.WriteLine(payload);
                        _daemonProc.StandardInput.Flush();

                        string line = _daemonProc.StandardOutput.ReadLine();
                        if (!string.IsNullOrWhiteSpace(line))
                        {
                            IDictionary<string, object> dict = ser.DeserializeObject(line) as IDictionary<string, object>;
                            if (dict != null)
                            {
                                bool ok = dict.ContainsKey("ok") && dict["ok"] is bool && (bool)dict["ok"];
                                if (ok && dict.ContainsKey("transcript") && dict["transcript"] != null)
                                {
                                    return dict["transcript"].ToString().Trim();
                                }
                                if (dict.ContainsKey("error") && dict["error"] != null)
                                {
                                    errorMsg = dict["error"].ToString();
                                }
                            }
                        }
                        return "";
                    }
                    catch (Exception ex)
                    {
                        errorMsg = ex.Message;
                        try { _daemonProc.Kill(); } catch { }
                        _daemonProc = null;
                    }
                }
            }

            return TranscribeWavFileToVietnameseFallback(hubRoot, wavPath, out errorMsg);
        }

        public static string TranscribeWavFileToVietnameseFallback(string hubRoot, string wavPath, out string errorMsg)
        {
            errorMsg = "";
            string scriptPath = Path.Combine(hubRoot, "tools", "voice-transcribe-vi.py");
            if (!File.Exists(scriptPath)) return "";

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c python \"" + scriptPath + "\" \"" + wavPath + "\"",
                    WorkingDirectory = hubRoot,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.UTF8
                };

                using (Process proc = Process.Start(psi))
                {
                    string stdout = proc.StandardOutput.ReadToEnd().Trim();
                    proc.WaitForExit(10000);
                    if (!string.IsNullOrWhiteSpace(stdout))
                    {
                        JavaScriptSerializer ser = new JavaScriptSerializer();
                        IDictionary<string, object> dict = ser.DeserializeObject(stdout) as IDictionary<string, object>;
                        if (dict != null && dict.ContainsKey("ok") && dict["ok"] is bool && (bool)dict["ok"])
                        {
                            return dict.ContainsKey("transcript") && dict["transcript"] != null
                                ? dict["transcript"].ToString().Trim()
                                : "";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                errorMsg = ex.Message;
            }
            return "";
        }

        public void Dispose()
        {
            if (IsRecording)
            {
                string dummy;
                StopAndSaveWav(Path.Combine(Path.GetTempPath(), "capy-dispose.wav"), out dummy);
            }
            lock (_daemonLock)
            {
                if (_daemonProc != null && !_daemonProc.HasExited)
                {
                    try
                    {
                        _daemonProc.StandardInput.WriteLine("EXIT");
                        _daemonProc.StandardInput.Flush();
                        if (!_daemonProc.WaitForExit(400)) _daemonProc.Kill();
                    }
                    catch { }
                    _daemonProc = null;
                }
            }
        }
    }
}
