import React, { useState } from 'react';
import { Copy, Download, Sparkles, Trash2 } from 'lucide-react';
import { BUCKET_LABELS, formatVnd } from '@/lib/financeMath';
import type { FinanceBucket, FinanceTransaction } from '@/types/finance';

interface FinanceLedgerListProps {
  filteredTxs: FinanceTransaction[];
  activeBucketFilter: FinanceBucket | 'all';
  onChangeBucketFilter: (val: FinanceBucket | 'all') => void;
  onDownloadCsv: () => void;
  onDeleteTx: (id: string) => void;
  customUpgradeWish: string;
  onChangeUpgradeWish: (val: string) => void;
  onTriggerUpgradeBlueprint: () => void;
  upgradePrompt: string;
}

export const FinanceLedgerList: React.FC<FinanceLedgerListProps> = ({
  filteredTxs,
  activeBucketFilter,
  onChangeBucketFilter,
  onDownloadCsv,
  onDeleteTx,
  customUpgradeWish,
  onChangeUpgradeWish,
  onTriggerUpgradeBlueprint,
  upgradePrompt,
}) => {
  const [copiedNotice, setCopiedNotice] = useState('');

  return (
    <section
      aria-label="Danh sách giao dịch và Trình tự code nâng cấp App Tài Chính"
      className="lg:col-span-7 space-y-5"
    >
      <div
        className="p-5 rounded-2xl border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold">Sổ Thu Chi Đã Đối Soát ({filteredTxs.length} dòng)</h2>
          <div className="flex items-center gap-2">
            <select
              aria-label="Lọc theo hũ ngân sách"
              value={activeBucketFilter}
              onChange={(e) => onChangeBucketFilter(e.target.value as FinanceBucket | 'all')}
              className="rounded-lg px-2.5 py-1.5 text-xs border"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            >
              <option value="all">Tất cả 5 hũ ngân sách</option>
              {(Object.keys(BUCKET_LABELS) as FinanceBucket[]).map((k) => (
                <option key={k} value={k}>
                  {BUCKET_LABELS[k].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onDownloadCsv}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer flex items-center gap-1"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-warm)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Xuất CSV cho Abacus Capy
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredTxs.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
              style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
            >
              <div>
                <div className="font-bold text-sm">{tx.title}</div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {tx.date} · {BUCKET_LABELS[tx.bucket].label}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="font-bold text-sm tabular-nums"
                  style={{
                    color:
                      tx.type === 'income'
                        ? 'var(--accent-matcha)'
                        : 'var(--accent-terracotta)',
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatVnd(tx.amountVnd)}
                </span>
                <button
                  type="button"
                  aria-label={`Xóa giao dịch ${tx.title}`}
                  onClick={() => onDeleteTx(tx.id)}
                  className="p-1.5 rounded-lg border cursor-pointer"
                  style={{ borderColor: 'var(--border-warm)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-warm)' }}
      >
        <h3 className="text-base font-bold">
          Giao Việc Cho Treasurer Capy Tự Code Nâng Cấp App Tài Chính Này
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Bạn muốn sửa giao diện hay thêm công thức tài chính mới cho riêng mình? Nhập ý muốn bên dưới để gửi qua Cổng Confirm của Boss Capy:
        </p>
        <textarea
          rows={2}
          value={customUpgradeWish}
          onChange={(e) => onChangeUpgradeWish(e.target.value)}
          className="w-full rounded-xl p-3 text-xs border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTriggerUpgradeBlueprint}
            className="py-2 px-3.5 rounded-xl text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-yuzu)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Đưa Vào Vòng Lặp Confirm Hình Dung Kết Quả Cuối
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(upgradePrompt);
              setCopiedNotice('Đã copy Prompt chuẩn Frontmatter cho Treasurer Capy!');
            }}
            className="py-2 px-3.5 rounded-xl text-xs font-semibold border cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Prompt Chuẩn Frontmatter
          </button>
          {copiedNotice && <span className="text-xs font-semibold self-center">{copiedNotice}</span>}
        </div>
      </div>
    </section>
  );
};
