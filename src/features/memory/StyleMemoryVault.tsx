import React, { useState } from 'react';
import { BookMarked, Brain, Mic, Plus } from 'lucide-react';
import { useHarnessStore } from '@/stores/harnessStore';
import type { VoiceGlossaryEntry } from '@/types/harness';

export const StyleMemoryVault: React.FC = () => {
  const { styleDna, glossary, updateStyleDnaField, addVoiceGlossaryEntry } = useHarnessStore();

  const [spokenPhrase, setSpokenPhrase] = useState('');
  const [normalizedTerm, setNormalizedTerm] = useState('');
  const [category, setCategory] = useState<VoiceGlossaryEntry['category']>('wps_office');

  const handleAddGlossary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spokenPhrase.trim() || !normalizedTerm.trim()) return;
    addVoiceGlossaryEntry(spokenPhrase, normalizedTerm, category);
    setSpokenPhrase('');
    setNormalizedTerm('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section
        aria-label="Hồ sơ phong cách cá nhân dài hạn USER-STYLE-DNA.md"
        className="lg:col-span-7 rounded-2xl p-6 border space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5" style={{ color: 'var(--accent-yuzu)' }} />
          <div>
            <h2 className="text-xl font-bold">
              Trí Nhớ Dài Hạn &amp; Cá Nhân Hóa (`03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.md`)
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Đàn Capybara tự động đọc hồ sơ này đầu mỗi phiên để hiểu đúng cách trình bày văn bản WPS, số liệu và gu làm việc của riêng bạn.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label htmlFor="dna-owner" className="block text-xs font-bold mb-1">
              Tên Chủ Nhân Hub:
            </label>
            <input
              id="dna-owner"
              type="text"
              value={styleDna.ownerName}
              onChange={(e) => updateStyleDnaField('ownerName', e.target.value)}
              className="w-full rounded-xl px-3 py-2 border"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            />
          </div>

          <div>
            <label htmlFor="dna-wps" className="block text-xs font-bold mb-1">
              Chuẩn trình bày Văn bản WPS &amp; Báo cáo đa tài liệu (`Scribe Capy`):
            </label>
            <textarea
              id="dna-wps"
              rows={2}
              value={styleDna.wpsDocumentFormat}
              onChange={(e) => updateStyleDnaField('wpsDocumentFormat', e.target.value)}
              className="w-full rounded-xl p-2.5 border text-xs"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            />
          </div>

          <div>
            <label htmlFor="dna-data" className="block text-xs font-bold mb-1">
              Quy ước Phân tích Số liệu &amp; Bảng tính (`Abacus Capy`):
            </label>
            <textarea
              id="dna-data"
              rows={2}
              value={styleDna.dataPresentationRule}
              onChange={(e) => updateStyleDnaField('dataPresentationRule', e.target.value)}
              className="w-full rounded-xl p-2.5 border text-xs"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            />
          </div>

          <div>
            <label htmlFor="dna-capcut" className="block text-xs font-bold mb-1">
              Gu Edit Video trên CapCut (`Director Capy`):
            </label>
            <textarea
              id="dna-capcut"
              rows={2}
              value={styleDna.capcutEditingStyle}
              onChange={(e) => updateStyleDnaField('capcutEditingStyle', e.target.value)}
              className="w-full rounded-xl p-2.5 border text-xs"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            />
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <BookMarked className="w-4 h-4" />
            Nhật Ký AI Tự Học Sau Các Lần Bạn Tinh Chỉnh Ở Bước Confirm ({styleDna.autoLearnedRules.length})
          </h3>
          <div className="space-y-2">
            {styleDna.autoLearnedRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-xl border text-xs"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-warm)' }}
              >
                <div className="font-bold">[{rule.sessionDate}] Góp ý từ người dùng: &ldquo;{rule.learnedFromFeedback}&rdquo;</div>
                <div className="mt-1" style={{ color: 'var(--accent-matcha)' }}>
                  Quy tắc đã nạp vào trí nhớ dài hạn: {rule.appliedRule}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-label="Từ điển khử nhiễu giọng nói qua Mic VOICE-GLOSSARY.md"
        className="lg:col-span-5 rounded-2xl p-6 border space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <div className="flex items-center gap-2.5">
          <Mic className="w-5 h-5" style={{ color: 'var(--accent-matcha)' }} />
          <div>
            <h2 className="text-xl font-bold">Từ Điển Giọng Nói (`VOICE-GLOSSARY.md`)</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Sửa tự động các từ viết tắt hoặc thuật ngữ tiếng Anh hay bị Mic nghe nhầm khi bạn nói nhanh.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddGlossary} className="space-y-2.5 p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={spokenPhrase}
              onChange={(e) => setSpokenPhrase(e.target.value)}
              placeholder="Âm Mic nghe nhầm (vd: đắp lưu)"
              className="rounded-lg px-2.5 py-2 text-xs border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
            />
            <input
              type="text"
              required
              value={normalizedTerm}
              onChange={(e) => setNormalizedTerm(e.target.value)}
              placeholder="Từ chuẩn (vd: WPS Office)"
              className="rounded-lg px-2.5 py-2 text-xs border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VoiceGlossaryEntry['category'])}
              className="rounded-lg px-2.5 py-1.5 text-xs border flex-1"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
            >
              <option value="wps_office">Văn bản WPS Office</option>
              <option value="data_finance">Số liệu &amp; Tài chính</option>
              <option value="capcut">Edit Video CapCut</option>
              <option value="custom">Thuật ngữ cá nhân</option>
            </select>
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-white cursor-pointer flex items-center gap-1"
              style={{ backgroundColor: 'var(--accent-matcha)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Từ Điển
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {glossary.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border text-xs flex items-center justify-between"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            >
              <div>
                <span className="font-mono font-semibold">&ldquo;{item.spokenPhrase}&rdquo;</span>
                <span className="mx-2">→</span>
                <span className="font-bold" style={{ color: 'var(--accent-yuzu)' }}>
                  {item.normalizedTerm}
                </span>
              </div>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
