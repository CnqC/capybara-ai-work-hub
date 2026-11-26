import React, { useState } from 'react';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import { FinanceLedgerList } from './FinanceLedgerList';
import {
  BUCKET_LABELS,
  buildTreasurerSelfUpgradePrompt,
  calculateFinanceSummary,
  exportTransactionsToCsv,
  formatVnd,
} from '@/lib/financeMath';
import { useFinanceStore } from '@/stores/financeStore';
import { useHarnessStore } from '@/stores/harnessStore';
import type { FinanceBucket } from '@/types/finance';

export const PersonalFinanceStudio: React.FC<{ onSendToConfirmGate: () => void }> = ({
  onSendToConfirmGate,
}) => {
  const {
    transactions,
    goals,
    activeBucketFilter,
    customUpgradeWish,
    setActiveBucketFilter,
    setCustomUpgradeWish,
    addTransaction,
    deleteTransaction,
    contributeToGoal,
  } = useFinanceStore();
  const { analyzeVoiceInput } = useHarnessStore();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [bucket, setBucket] = useState<FinanceBucket>('essential_living');

  const summary = calculateFinanceSummary(transactions);
  const filteredTxs =
    activeBucketFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.bucket === activeBucketFilter);

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amountStr.replace(/[^0-9]/g, ''));
    if (!title.trim() || !numeric || numeric <= 0) return;
    addTransaction({ title, type: txType, amountVnd: numeric, bucket, note: '' });
    setTitle('');
    setAmountStr('');
  };

  const handleDownloadCsv = () => {
    const csv = exportTransactionsToCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CapyFinance_SoThuChi_CaNhan.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const upgradePrompt = buildTreasurerSelfUpgradePrompt(customUpgradeWish, summary, goals);
  const statCards = [
    { label: 'Tổng Thu Nhập', value: formatVnd(summary.totalIncomeVnd), color: 'var(--accent-matcha)' },
    { label: 'Tổng Chi Tiêu', value: formatVnd(summary.totalExpenseVnd), color: 'var(--accent-terracotta)' },
    { label: 'Số Dư Ròng Hiện Tại', value: formatVnd(summary.netBalanceVnd), color: 'var(--text-ink)' },
  ];

  return (
    <div className="space-y-6">
      <section
        aria-label="Tổng quan sổ cái tài chính cá nhân Zero-Sum"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((c) => (
          <div
            key={c.label}
            className="p-5 rounded-2xl border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {c.label}
            </p>
            <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: c.color }}>
              {c.value}
            </p>
          </div>
        ))}
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Tỷ Lệ Tích Lũy &amp; Kiểm Toán
            </p>
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-matcha)' }} />
          </div>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.savingsRatePercent}%</p>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--accent-matcha)' }}>
            {summary.isZeroSumBalanced ? 'Zero-Sum Ledger: Cân bằng 100%' : 'Cần kiểm tra lại sổ'}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-label="Ghi chép thu chi và 5 Hũ Ngân Sách Capybara"
          className="lg:col-span-5 space-y-5"
        >
          <form
            onSubmit={handleAddTx}
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
          >
            <h2 className="text-lg font-bold">Ghi Bút Toán Thu / Chi Mới</h2>
            <div>
              <label htmlFor="tx-title" className="block text-xs font-semibold mb-1">
                Tên khoản thu / chi:
              </label>
              <input
                id="tx-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Mua gói âm thanh CapCut / Thu dự án báo cáo..."
                className="w-full rounded-xl px-3 py-2 text-sm border"
                style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tx-amount" className="block text-xs font-semibold mb-1">
                  Số tiền (VNĐ):
                </label>
                <input
                  id="tx-amount"
                  type="number"
                  required
                  min={1000}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="500000"
                  className="w-full rounded-xl px-3 py-2 text-sm border tabular-nums"
                  style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
                />
              </div>
              <div>
                <label htmlFor="tx-type" className="block text-xs font-semibold mb-1">
                  Loại giao dịch:
                </label>
                <select
                  id="tx-type"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                  className="w-full rounded-xl px-3 py-2 text-sm border"
                  style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
                >
                  <option value="expense">Khoản Chi (-)</option>
                  <option value="income">Khoản Thu (+)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tx-bucket" className="block text-xs font-semibold mb-1">
                Hũ ngân sách Capybara:
              </label>
              <select
                id="tx-bucket"
                value={bucket}
                onChange={(e) => setBucket(e.target.value as FinanceBucket)}
                className="w-full rounded-xl px-3 py-2 text-sm border"
                style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
              >
                {(Object.keys(BUCKET_LABELS) as FinanceBucket[]).map((k) => (
                  <option key={k} value={k}>
                    {BUCKET_LABELS[k].label} (Định mức {BUCKET_LABELS[k].targetPercent}%)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              data-testid="add-finance-tx-btn"
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent-yuzu)' }}
            >
              <PlusCircle className="w-4 h-4" />
              Ghi Vào Sổ Cái Cá Nhân
            </button>
          </form>

          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
          >
            <h3 className="text-base font-bold">Quỹ Mục Tiêu Cá Nhân</h3>
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentVnd / g.targetVnd) * 100));
              return (
                <div
                  key={g.id}
                  className="p-3.5 rounded-xl border text-xs space-y-1.5"
                  style={{ backgroundColor: 'var(--bg-paper)', borderColor: 'var(--border-warm)' }}
                >
                  <div className="flex justify-between font-bold">
                    <span>{g.title}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="flex justify-between tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    <span>Đã gom: {formatVnd(g.currentVnd)}</span>
                    <span>Đích: {formatVnd(g.targetVnd)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => contributeToGoal(g.id, 500000)}
                    className="mt-1 py-1 px-2.5 rounded-lg font-semibold border cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
                  >
                    + Trích thêm 500.000 VNĐ
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <FinanceLedgerList
          filteredTxs={filteredTxs}
          activeBucketFilter={activeBucketFilter}
          onChangeBucketFilter={setActiveBucketFilter}
          onDownloadCsv={handleDownloadCsv}
          onDeleteTx={deleteTransaction}
          customUpgradeWish={customUpgradeWish}
          onChangeUpgradeWish={setCustomUpgradeWish}
          onTriggerUpgradeBlueprint={() => {
            analyzeVoiceInput(customUpgradeWish);
            onSendToConfirmGate();
          }}
          upgradePrompt={upgradePrompt}
        />
      </div>
    </div>
  );
};
