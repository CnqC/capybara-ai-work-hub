import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import type { BlueprintPreview, HarnessStage } from '@/types/harness';

interface BlueprintConfirmCardProps {
  stage: HarnessStage;
  currentBlueprint: BlueprintPreview;
  refinementDraft: string;
  onChangeRefinement: (val: string) => void;
  onSubmitRefinement: () => void;
  onApproveAndDispatch: () => void;
}

export const BlueprintConfirmCard: React.FC<BlueprintConfirmCardProps> = ({
  stage,
  currentBlueprint,
  refinementDraft,
  onChangeRefinement,
  onSubmitRefinement,
  onApproveAndDispatch,
}) => {
  return (
    <section
      aria-label="Bản Hình Dung Kết Quả Cuối chờ người dùng Confirm"
      className="lg:col-span-7 rounded-2xl p-6 border"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b"
        style={{ borderColor: 'var(--border-warm)' }}
      >
        <div>
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md mb-1"
            style={{
              backgroundColor: 'var(--accent-yuzu-soft)',
              color: 'var(--accent-yuzu)',
            }}
          >
            Vòng lặp Confirm · Phiên bản hình dung #{currentBlueprint.revision} · Trạng thái: {stage}
          </span>
          <h2 className="text-xl font-bold">{currentBlueprint.expectedDeliverableTitle}</h2>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        <div
          className="p-3.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
        >
          <p className="font-semibold mb-1">Ý định đã chuẩn hóa qua VOICE-GLOSSARY.md:</p>
          <p style={{ color: 'var(--text-muted)' }}>{currentBlueprint.normalizedIntent}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-2">
            Hình dung chi tiết kết quả cuối bạn sẽ nhận được nếu chạy:
          </h3>
          <ul className="space-y-2">
            {currentBlueprint.concreteOutputMockup.map((line, i) => (
              <li
                key={i}
                className="p-3 rounded-xl text-sm border font-mono"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold mb-2">
            Kế hoạch chia nhỏ đầu việc &amp; Bàn giao Subagent (`HANDOFF.md`):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentBlueprint.subTasksPlan.map((task) => (
              <div
                key={task.taskId}
                className="p-3 rounded-xl border text-xs"
                style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
              >
                <div className="font-bold mb-1">
                  {task.taskId} · Phụ trách: <code>{task.ownerAgent}</code>
                </div>
                <p className="mb-1">{task.title}</p>
                <p style={{ color: 'var(--text-muted)' }}>File đầu ra: {task.expectedArtifact}</p>
                <p className="mt-1 font-medium" style={{ color: 'var(--accent-matcha)' }}>
                  Chốt QA: {task.qaCheckRule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="p-4 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-warm)' }}
      >
        <label htmlFor="refinement-feedback-input" className="block text-sm font-bold">
          2. Bạn đọc lại bản Confirm trên: Nếu chưa tới, hãy nói Mic / gõ bổ sung để Boss Capy chỉnh lại:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="refinement-feedback-input"
            type="text"
            value={refinementDraft}
            onChange={(e) => onChangeRefinement(e.target.value)}
            placeholder="Ví dụ: Chưa tới, thêm cho tôi cột so sánh % cùng kỳ năm ngoái và xuất thêm slide..."
            className="flex-1 rounded-xl px-3.5 py-2.5 text-sm border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
          />
          <button
            type="button"
            onClick={onSubmitRefinement}
            data-testid="refine-blueprint-button"
            className="py-2.5 px-4 rounded-xl text-sm font-semibold border cursor-pointer flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Phân Tích Lại Chi Tiết Hơn
          </button>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Hệ thống sẽ lặp lại bước này cho tới khi bạn hoàn toàn đồng ý.
          </span>
          <button
            type="button"
            onClick={onApproveAndDispatch}
            data-testid="approve-blueprint-button"
            className="w-full sm:w-auto py-3 px-5 rounded-xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent-matcha)' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Đồng Ý — Giao Việc Cho Subagents &amp; Chạy QA Liên Tục
          </button>
        </div>
      </div>
    </section>
  );
};
