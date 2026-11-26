import React from 'react';
import { CheckCircle, FileCheck2, ShieldAlert, Stamp } from 'lucide-react';
import { formatHandoffMarkdown } from '@/lib/voiceBlueprintEngine';
import { useHarnessStore } from '@/stores/harnessStore';
import type { CapyAgentId } from '@/types/harness';

const CAPY_ROSTER: Array<{
  id: CapyAgentId;
  displayName: string;
  roleTitle: string;
  frontmatterTag: string;
}> = [
  {
    id: 'boss-capy-coordinator',
    displayName: 'Boss Capy (Điều Phối Chính)',
    roleTitle: 'Khử nhiễu Mic, Lặp Confirm Kết Quả Cuối & Chia Task',
    frontmatterTag: 'role_domain: orchestration_and_confirm_gate',
  },
  {
    id: 'scribe-capy-wps-doc',
    displayName: 'Scribe Capy (Văn Bản WPS)',
    roleTitle: 'Đọc sâu tài liệu nhiều bên & Chế bản .docx/.pptx WPS an toàn',
    frontmatterTag: 'role_domain: wps_office_and_multi_doc_research',
  },
  {
    id: 'abacus-capy-data-analyst',
    displayName: 'Abacus Capy (Phân Tích Data)',
    roleTitle: 'Thống kê Excel/CSV bằng Python (0 tính nhẩm, 0 ảo giác)',
    frontmatterTag: 'role_domain: data_analytics_and_spreadsheet_audit',
  },
  {
    id: 'director-capy-capcut-editor',
    displayName: 'Director Capy (Đạo Diễn CapCut)',
    roleTitle: 'Điều khiển capcut-mcp cắt timeline, phụ đề & validate project',
    frontmatterTag: 'role_domain: capcut_video_editing',
  },
  {
    id: 'treasurer-capy-finance-coder',
    displayName: 'Treasurer Capy (Code App Tài Chính)',
    roleTitle: 'Xây dựng & cá nhân hóa phần mềm Quản lý tài chính riêng',
    frontmatterTag: 'role_domain: personal_finance_software_engineering',
  },
  {
    id: 'inspector-capy-continuous-qa',
    displayName: 'Inspector Capy (QA Độc Lập)',
    roleTitle: 'Maker != Checker: Nghiệm thu từng file bàn giao trước khi mở task mới',
    frontmatterTag: 'role_domain: continuous_independent_qa_verification',
  },
];

export const SubagentHandoffBoard: React.FC = () => {
  const { currentBlueprint, handoffTasks, stage, runContinuousQaForTask } = useHarnessStore();

  return (
    <div className="space-y-6">
      <section
        aria-label="Đội hình 6 Capybara Subagents chuẩn Frontmatter"
        className="rounded-2xl p-6 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/capy-inspector-qa.jpg"
              alt="Inspector Capy cầm kính lúp kiểm định QA"
              className="w-14 h-14 rounded-xl object-cover border"
              style={{ borderColor: 'var(--border-warm)' }}
            />
            <div>
              <h2 className="text-xl font-bold">
                Đội Hình 6 Capybara Subagents &amp; Chuẩn YAML Frontmatter
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Mỗi Subagent có cấu hình Frontmatter riêng tại <code>.harness-plugin/agents/*.md</code> và bàn giao bằng file vật lý.
              </p>
            </div>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg self-start"
            style={{
              backgroundColor: 'var(--accent-matcha-soft)',
              color: 'var(--accent-matcha)',
            }}
          >
            Trạng thái luồng: {stage}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAPY_ROSTER.map((agent) => {
            const isAssigned = currentBlueprint.assignedAgents.includes(agent.id);
            return (
              <div
                key={agent.id}
                className="p-3.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: isAssigned ? 'var(--bg-surface)' : 'var(--bg-paper)',
                  borderColor: isAssigned ? 'var(--accent-yuzu)' : 'var(--border-warm)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm">{agent.displayName}</span>
                  {isAssigned && (
                    <span
                      className="px-2 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: 'var(--accent-yuzu-soft)',
                        color: 'var(--accent-yuzu)',
                      }}
                    >
                      Đang kích hoạt
                    </span>
                  )}
                </div>
                <p className="mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {agent.roleTitle}
                </p>
                <code className="block text-[11px] opacity-85">{agent.frontmatterTag}</code>
              </div>
            );
          })}
        </div>
      </section>

      <section
        aria-label="Luồng bàn giao file HANDOFF.md và QA liên tục giữa các task"
        className="rounded-2xl p-6 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <h2 className="text-xl font-bold mb-1">
          Chuỗi File Bàn Giao (`04_BanGiao_SubAgents/TASK-XX_HANDOFF.md`) &amp; QA Liên Tục
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Inspector Capy chạy nghiệm thu ngay sau từng task hoàn thành. Chỉ khi task trước đạt{' '}
          <strong>QA PASS</strong> thì Boss Capy mới mở khóa cho nhận task kế tiếp.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {handoffTasks.map((task) => {
            const isPassed = task.qaVerdict === 'PASS';
            const isRejected = task.qaVerdict === 'REJECT';
            return (
              <article
                key={task.taskId}
                className="rounded-xl p-5 border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-paper)',
                  borderColor: isPassed
                    ? 'var(--accent-matcha)'
                    : isRejected
                      ? 'var(--accent-terracotta)'
                      : 'var(--border-warm)',
                }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-base flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4" />
                      {task.taskId}: {task.title}
                    </span>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-md"
                      style={{
                        backgroundColor: isPassed
                          ? 'var(--accent-matcha-soft)'
                          : isRejected
                            ? 'var(--accent-terracotta-soft)'
                            : 'var(--accent-yuzu-soft)',
                        color: isPassed
                          ? 'var(--accent-matcha)'
                          : isRejected
                            ? 'var(--accent-terracotta)'
                            : 'var(--accent-yuzu)',
                      }}
                    >
                      {task.status} · QA: {task.qaVerdict}
                    </span>
                  </div>

                  <pre
                    className="p-3 rounded-lg text-xs overflow-x-auto border mb-3"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                    }}
                  >
                    {formatHandoffMarkdown(task)}
                  </pre>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => runContinuousQaForTask(task.taskId, 'PASS')}
                    data-testid={`qa-pass-${task.taskId}`}
                    className="py-2 px-3.5 rounded-lg text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--accent-matcha)' }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Inspector Capy: Nghiệm Thu Đạt (PASS &amp; Mở Task Tiếp)
                  </button>
                  <button
                    type="button"
                    onClick={() => runContinuousQaForTask(task.taskId, 'REJECT')}
                    data-testid={`qa-reject-${task.taskId}`}
                    className="py-2 px-3.5 rounded-lg text-xs font-bold border cursor-pointer flex items-center gap-1.5"
                    style={{
                      backgroundColor: 'var(--accent-terracotta-soft)',
                      color: 'var(--accent-terracotta)',
                      borderColor: 'var(--accent-terracotta)',
                    }}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Yêu Cầu Worker Sửa Lại (REJECT)
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {stage === 'COMPLETED_AND_LEARNED' && (
          <div
            className="mt-5 p-4 rounded-xl border flex items-center gap-3"
            style={{
              backgroundColor: 'var(--accent-matcha-soft)',
              borderColor: 'var(--accent-matcha)',
              color: 'var(--accent-matcha)',
            }}
          >
            <Stamp className="w-6 h-6 shrink-0" />
            <div className="text-sm font-semibold">
              Toàn bộ các Sub-tasks đã được Inspector Capy nghiệm thu đạt 100%! Kết quả đã lưu vào{' '}
              <code>02_KetQua_NghiemThu/</code> và cập nhật trí nhớ dài hạn{' '}
              <code>USER-STYLE-DNA.md</code>.
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
