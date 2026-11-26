import React, { useState } from 'react';
import { Brain, CheckSquare, Mic, Wallet } from 'lucide-react';
import { PersonalFinanceStudio } from '@/features/finance/PersonalFinanceStudio';
import { SubagentHandoffBoard } from '@/features/handoff-qa/SubagentHandoffBoard';
import { StyleMemoryVault } from '@/features/memory/StyleMemoryVault';
import { VoiceBlueprintStation } from '@/features/voice-blueprint/VoiceBlueprintStation';
import { useHarnessStore } from '@/stores/harnessStore';

type ActiveTab = 'voice_confirm' | 'subagent_qa' | 'personal_finance' | 'style_memory';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('voice_confirm');
  const { stage, styleDna, currentBlueprint } = useHarnessStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-warm)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span
                  className="px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: 'var(--accent-yuzu-soft)',
                    color: 'var(--accent-yuzu)',
                  }}
                >
                  CapyHub v1.0 · Google AI Ultra Personal Harness
                </span>
                <span
                  className="px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: 'var(--accent-matcha-soft)',
                    color: 'var(--accent-matcha)',
                  }}
                >
                  Chủ nhân: {styleDna.ownerName} · Bản Confirm #{currentBlueprint.revision}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                CapyHub — Trạm Điều Phối AI Cá Nhân Hóa &amp; Quản Lý Tài Chính
              </h1>
              <p className="text-sm max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                Nói vào Mic để Boss Capy lập Bản Hình Dung Kết Quả Cuối cho tác vụ Văn bản WPS, Phân tích số liệu, Edit Video CapCut và Phần mềm Tài chính cá nhân trước khi giao đàn Subagent thực thi và nghiệm thu QA liên tục.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: 'var(--border-warm)', backgroundColor: 'var(--bg-card)' }}
              >
                <img
                  src="/assets/capy-hero-banner.jpg"
                  alt="Đàn Capybara điều phối Mic, tài liệu WPS, bàn tính số liệu, bảng clapperboard CapCut và con dấu QA PASS"
                  className="w-full h-40 object-cover"
                />
              </div>
            </div>
          </div>

          <nav aria-label="Điều hướng trạm làm việc CapyHub" className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('voice_confirm')}
              data-testid="tab-voice-confirm"
              className="py-2.5 px-4 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 border"
              style={{
                backgroundColor:
                  activeTab === 'voice_confirm' ? 'var(--accent-yuzu)' : 'var(--bg-card)',
                color: activeTab === 'voice_confirm' ? '#FFFFFF' : 'var(--text-ink)',
                borderColor:
                  activeTab === 'voice_confirm' ? 'var(--accent-yuzu)' : 'var(--border-warm)',
              }}
            >
              <Mic className="w-4 h-4" />
              1. Mic &amp; Vòng Lặp Confirm Kết Quả Cuối
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subagent_qa')}
              data-testid="tab-subagent-qa"
              className="py-2.5 px-4 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 border"
              style={{
                backgroundColor:
                  activeTab === 'subagent_qa' ? 'var(--accent-yuzu)' : 'var(--bg-card)',
                color: activeTab === 'subagent_qa' ? '#FFFFFF' : 'var(--text-ink)',
                borderColor:
                  activeTab === 'subagent_qa' ? 'var(--accent-yuzu)' : 'var(--border-warm)',
              }}
            >
              <CheckSquare className="w-4 h-4" />
              2. Bàn Giao Subagents (`HANDOFF.md`) &amp; QA Liên Tục
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personal_finance')}
              data-testid="tab-personal-finance"
              className="py-2.5 px-4 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 border"
              style={{
                backgroundColor:
                  activeTab === 'personal_finance' ? 'var(--accent-yuzu)' : 'var(--bg-card)',
                color: activeTab === 'personal_finance' ? '#FFFFFF' : 'var(--text-ink)',
                borderColor:
                  activeTab === 'personal_finance' ? 'var(--accent-yuzu)' : 'var(--border-warm)',
              }}
            >
              <Wallet className="w-4 h-4" />
              3. App Quản Lý Tài Chính Cá Nhân (`CapyFinance`)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style_memory')}
              data-testid="tab-style-memory"
              className="py-2.5 px-4 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 border"
              style={{
                backgroundColor:
                  activeTab === 'style_memory' ? 'var(--accent-yuzu)' : 'var(--bg-card)',
                color: activeTab === 'style_memory' ? '#FFFFFF' : 'var(--text-ink)',
                borderColor:
                  activeTab === 'style_memory' ? 'var(--accent-yuzu)' : 'var(--border-warm)',
              }}
            >
              <Brain className="w-4 h-4" />
              4. Trí Nhớ Dài Hạn (`USER-STYLE-DNA.md`)
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'voice_confirm' && (
          <VoiceBlueprintStation onGoToHandoff={() => setActiveTab('subagent_qa')} />
        )}
        {activeTab === 'subagent_qa' && <SubagentHandoffBoard />}
        {activeTab === 'personal_finance' && (
          <PersonalFinanceStudio onSendToConfirmGate={() => setActiveTab('voice_confirm')} />
        )}
        {activeTab === 'style_memory' && <StyleMemoryVault />}
      </main>

      <footer
        className="border-t py-4 text-xs"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-warm)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>CapyHub</strong> · Trạng thái máy XState: <code>{stage}</code> · Kéo từ GitHub về dùng ngay với Google AI Ultra
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            6 Capybara Subagents · 7 Max Skills · Maker != Checker Continuous QA
          </span>
        </div>
      </footer>
    </div>
  );
};
