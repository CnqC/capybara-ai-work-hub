import { create } from 'zustand';
import type {
  FinanceBucket,
  FinanceTransaction,
  SavingsGoal,
} from '@/types/finance';

const INITIAL_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: 'tx-101',
    date: '2026-11-01',
    title: 'Lương chính & Thưởng hiệu suất phân tích dữ liệu',
    type: 'income',
    amountVnd: 32000000,
    bucket: 'essential_living',
    note: 'Chuyển khoản ngân hàng đầu tháng',
    verifiedByAbacusCapy: true,
  },
  {
    id: 'tx-102',
    date: '2026-11-05',
    title: 'Thu nhập dự án Edit Video CapCut & Báo cáo WPS',
    type: 'income',
    amountVnd: 8500000,
    bucket: 'work_tools_wps_capcut',
    note: 'Job freelance tuần 1',
    verifiedByAbacusCapy: true,
  },
  {
    id: 'tx-103',
    date: '2026-11-08',
    title: 'Tiền thuê nhà, điện nước & thực phẩm tháng 11',
    type: 'expense',
    amountVnd: 12500000,
    bucket: 'essential_living',
    note: 'Chi phí cố định hàng tháng',
    verifiedByAbacusCapy: true,
  },
  {
    id: 'tx-104',
    date: '2026-11-12',
    title: 'Gia hạn Google AI Ultra, WPS Pro & Tài nguyên CapCut',
    type: 'expense',
    amountVnd: 1850000,
    bucket: 'work_tools_wps_capcut',
    note: 'Đầu tư công cụ năng suất',
    verifiedByAbacusCapy: true,
  },
  {
    id: 'tx-105',
    date: '2026-11-18',
    title: 'Trích quỹ ETF & Tiết kiệm tích lũy tự do tài chính',
    type: 'expense',
    amountVnd: 6500000,
    bucket: 'investment_freedom',
    note: 'Tự động trích định kỳ',
    verifiedByAbacusCapy: true,
  },
  {
    id: 'tx-106',
    date: '2026-11-22',
    title: 'Cà phê cuối tuần & Mua mô hình Capybara bàn làm việc',
    type: 'expense',
    amountVnd: 950000,
    bucket: 'lifestyle_yuzu',
    note: 'Thưởng bản thân sau khi chốt dự án',
    verifiedByAbacusCapy: true,
  },
];

const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Quỹ nâng cấp Mic thu âm Shure & Màn hình dựng CapCut 4K',
    targetVnd: 18000000,
    currentVnd: 13500000,
    deadline: '2026-12-30',
    priorityTag: 'Công cụ làm việc',
  },
  {
    id: 'goal-2',
    title: 'Quỹ dự phòng an tâm Onsen 6 tháng sinh hoạt phí',
    targetVnd: 90000000,
    currentVnd: 64000000,
    deadline: '2027-06-01',
    priorityTag: 'An toàn tài chính',
  },
];

interface FinanceState {
  transactions: FinanceTransaction[];
  goals: SavingsGoal[];
  activeBucketFilter: FinanceBucket | 'all';
  customUpgradeWish: string;
  setActiveBucketFilter: (filter: FinanceBucket | 'all') => void;
  setCustomUpgradeWish: (wish: string) => void;
  addTransaction: (input: {
    title: string;
    type: 'income' | 'expense';
    amountVnd: number;
    bucket: FinanceBucket;
    note: string;
  }) => void;
  deleteTransaction: (id: string) => void;
  contributeToGoal: (goalId: string, addVnd: number) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  transactions: INITIAL_TRANSACTIONS,
  goals: INITIAL_GOALS,
  activeBucketFilter: 'all',
  customUpgradeWish:
    'Thêm tính năng cảnh báo bằng giọng nói khi hũ Thưởng bản thân Yuzu vượt quá 15% tổng thu nhập tháng và tự xuất file Excel WPS cuối tháng.',

  setActiveBucketFilter: (filter) => set({ activeBucketFilter: filter }),
  setCustomUpgradeWish: (wish) => set({ customUpgradeWish: wish }),

  addTransaction: (input) =>
    set((state) => ({
      transactions: [
        {
          id: `tx-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          title: input.title.trim(),
          type: input.type,
          amountVnd: Math.round(Math.abs(input.amountVnd)),
          bucket: input.bucket,
          note: input.note.trim() || 'Ghi nhận qua CapyFinance',
          verifiedByAbacusCapy: true,
        },
        ...state.transactions,
      ],
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  contributeToGoal: (goalId, addVnd) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? { ...g, currentVnd: Math.min(g.targetVnd, g.currentVnd + Math.round(addVnd)) }
          : g
      ),
    })),
}));
