---
name: personal-finance-customizer
description: >-
  Quy trình phát triển, mở rộng và cá nhân hóa Phần mềm Quản lý Tài chính Cá nhân (CapyFinance)
  ngay trong CapyHub: kiến trúc Local-First (React + TypeScript + Zustand + Zod),
  kiểm toán cân bằng sổ cái Zero-Sum Ledger và viết Vitest unit test trước khi bàn giao.
---

# Cá Nhân Hóa Phần Mềm Quản Lý Tài Chính (`personal-finance-customizer`)

## 1. Kiến Trúc Hộp Kín Dễ Tùy Biến Cho Từng Người Dùng
Phần mềm Quản lý tài chính cá nhân nằm ngay tại `src/features/finance/` và `src/stores/financeStore.ts`:
- `src/types/finance.ts`: Hợp đồng dữ liệu `Zod` cho giao dịch Thu/Chi, Hũ ngân sách (`FinanceBucket`), và Mục tiêu tiết kiệm (`SavingsGoal`).
- `src/lib/financeMath.ts`: Hàm tính toán thuần túy (`Pure Domain`) kiểm tra cân bằng sổ cái `Zero-Sum` (`netBalanceVnd === totalIncomeVnd - totalExpenseVnd`) và phân bổ tỷ lệ ngân sách.

## 2. Quy Trình Khi Người Dùng Muốn Nâng Cấp Phần Mềm Tài Chính Qua Mic
1. **Boss Capy** mô phỏng giao diện/tính năng tài chính mới trong `CURRENT-BLUEPRINT.md` để người dùng duyệt.
2. **Treasurer Capy** cập nhật schema trong `src/types/finance.ts`, viết thêm bài test trong `tests/unit/finance.test.ts`, rồi cập nhật UI trong `src/features/finance/` (giữ mỗi file `< 250 dòng`).
3. **Inspector Capy** chạy `npm run doctor` + `npm test` + `npm run build` xanh 100% trước khi đóng dấu `PASS`.
