# Sổ Cái Trạng Thái Dự Án (`STATE.md`) — Capybara AI Work Hub (`CapyHub`)

## High PrioritySlices
- [x] **Slice 1 — Khung Xương Capybara Harness Plugin (`.harness-plugin/`)**: `plugin.json`, `mcp_config.json`, `hooks.json`, `rules/AGENTS.md`, 6 Capybara Subagents chuẩn Frontmatter và 7 Max Skills.
- [x] **Slice 2 — Máy Trạng Thái Vòng Lặp Confirm Hình Dung Kết Quả Cuối (`Voice -> Blueprint Gate`)**: XState / Domain engine xử lý âm thanh Mic, lọc nhiễu qua `VOICE-GLOSSARY`, tạo bản mô phỏng kết quả cuối cho 4 đầu việc (WPS, Data, CapCut, Finance) và lặp lại tới khi người dùng đồng ý.
- [x] **Slice 3 — Luồng Bàn Giao File (`HANDOFF.md`) & QA Liên Tục (`Step-Gate Relay`)**: Chia nhỏ task, xuất file bàn giao chuẩn YAML Frontmatter và chạy `inspector-capy-continuous-qa` nghiệm thu từng task trước khi mở khóa task mới.
- [x] **Slice 4 — Phần Mềm Quản Lý Tài Chính Cá Nhân (`CapyFinance Local-First`)**: Sổ cái thu chi, kiểm tra cân bằng `Zero-Sum Ledger`, phân bổ hũ ngân sách, mục tiêu tiết kiệm, xuất CSV và tạo lệnh cho `Treasurer Capy` tự code nâng cấp.
- [x] **Slice 5 — Trí Nhớ Dài Hạn (`USER-STYLE-DNA` & `VOICE-GLOSSARY`) + Scripts 1-Click & GitHub Actions CI/CD**: Tự học phong cách trình bày sau mỗi phiên, đóng gói script `mklink /J` và pipeline GitHub Actions xanh 100%.

## Run Log
- `2026-11-26`: Khởi tạo `Capybara-AI-Work-Hub` v1.0.0 theo kiến trúc 3 vòng đồng tâm và chủ đề Capybara Onsen & Yuzu.
