using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

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
        private const int BUFFER_COUNT = 4;
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
        private MemoryStream _pcmStream;
        private readonly object _lock = new object();

        public bool IsRecording { get; private set; }
        public double CurrentLevel { get; private set; }
        public DateTime StartedAt { get; private set; }

        public static bool HasMicrophoneDevice()
        {
            try { return waveInGetNumDevs() > 0; }
            catch { return false; }
        }

        public bool StartRecording(out string errorMessage)
        {
            errorMessage = "";
            if (IsRecording) return true;

            if (!HasMicrophoneDevice())
            {
                errorMessage = "Máy chưa cắm Micro hoặc chưa bật quyền Micro trong Windows Settings.";
                return false;
            }

            lock (_lock)
            {
                _pcmStream = new MemoryStream();
                CurrentLevel = 0.0;

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
                    errorMessage = "Không thể mở Micro (Mã lỗi WinMM: " + res + "). Hãy kiểm tra quyền truy cập Micro trong Windows Privacy Settings.";
                    return false;
                }

                IsRecording = true;
                StartedAt = DateTime.Now;

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

                    // Calculate real-time voice peak level for visual VU meter bar
                    int maxSample = 1;
                    for (int i = 0; i + 1 < chunk.Length; i += 2)
                    {
                        short sample = BitConverter.ToInt16(chunk, i);
                        int abs = sample == short.MinValue ? 32767 : Math.Abs((int)sample);
                        if (abs > maxSample) maxSample = abs;
                    }
                    CurrentLevel = Math.Min(1.0, maxSample / 14000.0);

                    lock (_lock)
                    {
                        if (_pcmStream != null)
                        {
                            _pcmStream.Write(chunk, 0, chunk.Length);
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

        public string StopAndSaveWav(string outputWavPath)
        {
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
                byte[] pcmBytes = _pcmStream != null ? _pcmStream.ToArray() : new byte[0];
                if (_pcmStream != null)
                {
                    _pcmStream.Dispose();
                    _pcmStream = null;
                }

                string dir = Path.GetDirectoryName(outputWavPath);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                WriteWavFile(outputWavPath, pcmBytes, SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);
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

        public static string TranscribeWavFileToVietnamese(string hubRoot, string wavPath, out string errorMsg)
        {
            errorMsg = "";
            string scriptPath = Path.Combine(hubRoot, "tools", "voice-transcribe-vi.py");
            if (!File.Exists(scriptPath))
            {
                errorMsg = "Không tìm thấy script tools/voice-transcribe-vi.py";
                return "";
            }

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = "\"" + scriptPath + "\" \"" + wavPath + "\"",
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
                    proc.WaitForExit(12000);

                    if (stdout.Contains("\"ok\": true") || stdout.Contains("\"ok\":true"))
                    {
                        int idx = stdout.IndexOf("\"transcript\":");
                        if (idx >= 0)
                        {
                            int firstQuote = stdout.IndexOf('"', idx + 13);
                            int endQuote = stdout.IndexOf("\", \"wav_path\"", firstQuote + 1);
                            if (endQuote < 0) endQuote = stdout.LastIndexOf('"');
                            if (firstQuote >= 0 && endQuote > firstQuote)
                            {
                                return stdout.Substring(firstQuote + 1, endQuote - firstQuote - 1);
                            }
                        }
                    }
                    else if (stdout.Contains("\"error\":"))
                    {
                        errorMsg = stdout;
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
                StopAndSaveWav(Path.Combine(Path.GetTempPath(), "capy-dispose.wav"));
            }
        }
    }
}
