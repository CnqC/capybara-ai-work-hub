import React, { useState } from 'react';
import { FileText, Film, Mic, MicOff, Sparkles, Table2, Wallet } from 'lucide-react';
import { BlueprintConfirmCard } from './BlueprintConfirmCard';
import { useHarnessStore } from '@/stores/harnessStore';
import type { WorkDomain } from '@/types/harness';

const VOICE_PRESETS: Array<{ label: string; domain: WorkDomain; sampleVoice: string }> = [
  {
    label: 'Văn bản WPS & Đa tài liệu',
    domain: 'wps_document',
    sampleVoice:
      'À ừm đọc sâu giúp tôi 3 bản hợp đồng đối tác trong thư mục đầu vào rồi đối chiếu các điều khoản phạt hợp đồng và xuất báo cáo trên w b s theo đúng văn phong của tôi nhé',
  },
  {
    label: 'Phân tích số liệu Data',
    domain: 'data_analytics',
    sampleVoice:
      'Phân tích bảng số liệu doanh thu và chi phí tháng 10 tháng 11 từ file Excel có sẵn, kiểm tra xem khoản nào vượt định mức và lập bảng đối soát 4 cột chuẩn',
  },
  {
    label: 'Edit Video CapCut',
    domain: 'capcut_video',
    sampleVoice:
      'Dựng cho tôi video cáp cắt 45 giây tổng kết dự án quý 4, cắt bỏ khoảng lặng, chèn phụ đề nhấn màu cam Yuzu và khớp nhạc nền sôi động',
  },
  {
    label: 'Code App Tài Chính Cá Nhân',
    domain: 'personal_finance',
    sampleVoice:
      'Cập nhật phần mềm quản lý tài chính cá nhân của tôi: thêm bộ lọc theo 5 hũ ngân sách Capybara và kiểm tra cân bằng sổ thu chi cuối tháng',
  },
];

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const VoiceBlueprintStation: React.FC<{ onGoToHandoff: () => void }> = ({
  onGoToHandoff,
}) => {
  const {
    stage,
    voiceDraft,
    refinementDraft,
    currentBlueprint,
    setVoiceDraft,
    setRefinementDraft,
    startMicListening,
    analyzeVoiceInput,
    submitRefinementFeedback,
    approveBlueprintAndDispatch,
  } = useHarnessStore();

  const [isRecording, setIsRecording] = useState(false);
  const [micNotice, setMicNotice] = useState(
    'Bấm nút Mic (hoặc phím Win + H) để nói trực tiếp bằng tiếng Việt.'
  );

  const handleToggleMic = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechCtor) {
      setMicNotice(
        'Trình duyệt hiện tại chưa bật Web Speech API — bạn có thể ấn Win + H để đọc giọng nói vào ô bên dưới.'
      );
      startMicListening();
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      analyzeVoiceInput();
      return;
    }

    const recognition = new SpeechCtor();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsRecording(true);
    startMicListening();
    setMicNotice('Đang lắng nghe giọng nói của bạn qua Micro... Hãy nói yêu cầu công việc!');

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setVoiceDraft(transcript);
        analyzeVoiceInput(transcript);
      }
      setIsRecording(false);
      setMicNotice('Đã thu âm xong và tạo Bản Hình Dung Kết Quả Cuối bên dưới!');
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setMicNotice('Không nhận được tín hiệu Micro. Bạn có thể gõ hoặc dùng Win + H.');
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section
        aria-label="Trạm thu âm Micro và nhập yêu cầu"
        className="lg:col-span-5 rounded-2xl p-6 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/assets/capy-boss-mic.jpg"
            alt="Boss Capy lắng nghe qua Micro"
            className="w-14 h-14 rounded-xl object-cover border"
            style={{ borderColor: 'var(--border-warm)' }}
          />
          <div>
            <h2 className="text-lg font-bold">1. Giao Tiếp Qua Mic (Push-to-Talk)</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Boss Capy lắng nghe, khử nhiễu &amp; không bao giờ tự ý làm ẩu trước khi bạn Confirm.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleMic}
          data-testid="ptt-mic-button"
          className="w-full py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2.5 text-white cursor-pointer mb-2"
          style={{
            backgroundColor: isRecording ? 'var(--accent-terracotta)' : 'var(--accent-yuzu)',
          }}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isRecording
            ? 'Đang thu âm tiếng Việt... (Bấm để dừng & Phân tích)'
            : 'Ấn Để Nói Vào Mic (Push-to-Talk)'}
        </button>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {micNotice}
        </p>

        <div className="mb-4">
          <label htmlFor="voice-prompt-input" className="block text-sm font-semibold mb-1.5">
            Nội dung âm thanh / Prompt đầu vào:
          </label>
          <textarea
            id="voice-prompt-input"
            rows={4}
            value={voiceDraft}
            onChange={(e) => setVoiceDraft(e.target.value)}
            className="w-full rounded-xl p-3 text-sm border"
            style={{
              backgroundColor: 'var(--bg-paper)',
              borderColor: 'var(--border-warm)',
            }}
            placeholder="Nói vào Mic hoặc nhập yêu cầu xử lý văn bản WPS, số liệu, CapCut, tài chính..."
          />
          <button
            type="button"
            onClick={() => analyzeVoiceInput()}
            data-testid="analyze-voice-button"
            className="mt-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold border cursor-pointer flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Phân Tích &amp; Lập Bản Hình Dung Kết Quả Cuối
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            Thử nhanh 4 mẫu giọng nói theo công việc của bạn:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VOICE_PRESETS.map((p) => (
              <button
                key={p.domain}
                type="button"
                onClick={() => analyzeVoiceInput(p.sampleVoice)}
                className="text-left p-2.5 rounded-xl text-xs font-medium border cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--bg-paper)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                {p.domain === 'wps_document' && <FileText className="w-3.5 h-3.5 shrink-0" />}
                {p.domain === 'data_analytics' && <Table2 className="w-3.5 h-3.5 shrink-0" />}
                {p.domain === 'capcut_video' && <Film className="w-3.5 h-3.5 shrink-0" />}
                {p.domain === 'personal_finance' && <Wallet className="w-3.5 h-3.5 shrink-0" />}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <BlueprintConfirmCard
        stage={stage}
        currentBlueprint={currentBlueprint}
        refinementDraft={refinementDraft}
        onChangeRefinement={setRefinementDraft}
        onSubmitRefinement={() => submitRefinementFeedback()}
        onApproveAndDispatch={() => {
          approveBlueprintAndDispatch();
          onGoToHandoff();
        }}
      />
    </div>
  );
};
