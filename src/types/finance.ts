import { z } from 'zod';

export const FinanceBucketSchema = z.enum([
  'essential_living',
  'work_tools_wps_capcut',
  'investment_freedom',
  'emergency_onsen',
  'lifestyle_yuzu',
]);
export type FinanceBucket = z.infer<typeof FinanceBucketSchema>;

export const FinanceTransactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(2),
  type: z.enum(['income', 'expense']),
  amountVnd: z.number().int().positive(),
  bucket: FinanceBucketSchema,
  note: z.string(),
  verifiedByAbacusCapy: z.boolean(),
});
export type FinanceTransaction = z.infer<typeof FinanceTransactionSchema>;

export const SavingsGoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  targetVnd: z.number().int().positive(),
  currentVnd: z.number().int().min(0),
  deadline: z.string(),
  priorityTag: z.string(),
});
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

export interface FinanceLedgerSummary {
  totalIncomeVnd: number;
  totalExpenseVnd: number;
  netBalanceVnd: number;
  savingsRatePercent: number;
  isZeroSumBalanced: boolean;
  bucketBreakdown: Record<FinanceBucket, { expenseVnd: number; percentOfIncome: number }>;
}
