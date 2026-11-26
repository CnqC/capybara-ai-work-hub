import type {
  FinanceBucket,
  FinanceLedgerSummary,
  FinanceTransaction,
  SavingsGoal,
} from '@/types/finance';

export const BUCKET_LABELS: Record<FinanceBucket, { label: string; targetPercent: number }> = {
  essential_living: { label: 'Sinh hoạt thiết yếu', targetPercent: 50 },
  work_tools_wps_capcut: { label: 'Công cụ WPS & CapCut', targetPercent: 10 },
  investment_freedom: { label: 'Đầu tư & Tự do tài chính', targetPercent: 20 },
  emergency_onsen: { label: 'Quỹ dự phòng Onsen', targetPercent: 10 },
  lifestyle_yuzu: { label: 'Thưởng bản thân Yuzu', targetPercent: 10 },
};

export function formatVnd(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${formatted} VNĐ`;
}

export function calculateFinanceSummary(
  transactions: FinanceTransaction[]
): FinanceLedgerSummary {
  let totalIncomeVnd = 0;
  let totalExpenseVnd = 0;

  const bucketBreakdown: Record<
    FinanceBucket,
    { expenseVnd: number; percentOfIncome: number }
  > = {
    essential_living: { expenseVnd: 0, percentOfIncome: 0 },
    work_tools_wps_capcut: { expenseVnd: 0, percentOfIncome: 0 },
    investment_freedom: { expenseVnd: 0, percentOfIncome: 0 },
    emergency_onsen: { expenseVnd: 0, percentOfIncome: 0 },
    lifestyle_yuzu: { expenseVnd: 0, percentOfIncome: 0 },
  };

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncomeVnd += tx.amountVnd;
    } else {
      totalExpenseVnd += tx.amountVnd;
      bucketBreakdown[tx.bucket].expenseVnd += tx.amountVnd;
    }
  }

  const netBalanceVnd = totalIncomeVnd - totalExpenseVnd;
  const savingsRatePercent =
    totalIncomeVnd > 0 ? Math.round((netBalanceVnd / totalIncomeVnd) * 1000) / 10 : 0;

  for (const key of Object.keys(bucketBreakdown) as FinanceBucket[]) {
    bucketBreakdown[key].percentOfIncome =
      totalIncomeVnd > 0
        ? Math.round((bucketBreakdown[key].expenseVnd / totalIncomeVnd) * 1000) / 10
        : 0;
  }

  const sumBucketExpenses = Object.values(bucketBreakdown).reduce(
    (acc, b) => acc + b.expenseVnd,
    0
  );
  const isZeroSumBalanced =
    netBalanceVnd === totalIncomeVnd - totalExpenseVnd &&
    sumBucketExpenses === totalExpenseVnd;

  return {
    totalIncomeVnd,
    totalExpenseVnd,
    netBalanceVnd,
    savingsRatePercent,
    isZeroSumBalanced,
    bucketBreakdown,
  };
}

export function exportTransactionsToCsv(transactions: FinanceTransaction[]): string {
  const header = 'ID,Ngay,TieuDe,Loai,SoTienVND,HuNganSach,GhiChu,AbacusCapyVerified';
  const rows = transactions.map(
    (t) =>
      `${t.id},${t.date},"${t.title.replace(/"/g, '""')}",${t.type},${t.amountVnd},${t.bucket},"${t.note.replace(/"/g, '""')}",${t.verifiedByAbacusCapy}`
  );
  return [header, ...rows].join('\n');
}

export function buildTreasurerSelfUpgradePrompt(
  userWish: string,
  summary: FinanceLedgerSummary,
  goals: SavingsGoal[]
): string {
  return [
    '---',
    'target_agent: treasurer-capy-finance-coder',
    'qa_reviewer: inspector-capy-continuous-qa',
    'workflow_gate: ITERATIVE_BLUEPRINT_CONFIRM_FIRST',
    '---',
    `Tôi muốn nâng cấp phần mềm Quản lý tài chính cá nhân (CapyFinance) trong CapyHub của tôi với yêu cầu: "${userWish}".`,
    `Ngữ cảnh sổ cái hiện tại: Tổng thu ${formatVnd(summary.totalIncomeVnd)}, Tổng chi ${formatVnd(summary.totalExpenseVnd)}, Số dư ròng ${formatVnd(summary.netBalanceVnd)} (${goals.length} quỹ mục tiêu).`,
    'Hãy lập Bản Hình Dung Kết Quả Cuối (CURRENT-BLUEPRINT.md) mô tả giao diện & công thức sẽ thay đổi để tôi Confirm trước khi code!',
  ].join('\n');
}
