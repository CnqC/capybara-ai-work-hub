---
name: data-spreadsheet-insight
description: >-
  Quy trình phân tích số liệu tất định từ Data có sẵn (Excel, CSV, SQLite, JSON):
  bắt buộc chạy script Python/Pandas/DuckDB để tính toán thống kê, kiểm tra tổng chéo (cross-footing),
  tuyệt đối cấm LLM tính nhẩm và xuất báo cáo chuẩn định dạng số của chủ nhân.
---

# Phân Tích Số Liệu Tất Định Từ Data Có Sẵn (`data-spreadsheet-insight`)

## 1. Kỷ Luật "0 Tính Nhẩm Bằng LLM"
- Tuyệt đối không dùng khả năng sinh ngôn ngữ của LLM để tự cộng nhẩm cột tiền hoặc tính % tăng trưởng.
- Mọi phép tính bắt buộc chạy qua script thực thi (Python `csv` / `pandas` hoặc Node script) và lấy output chuẩn từ stdout.

## 2. Đối Soát Chéo Bắt Buộc (`Cross-Footing Audit`)
- Kiểm tra tổng theo hàng ngang phải khớp 100% với tổng theo cột dọc.
- Phát hiện và liệt kê riêng các dòng dữ liệu trùng lặp (`duplicate rows`), giá trị rỗng (`null/NaN`) hoặc ngoại lai (`outliers`) trước khi đưa vào báo cáo WPS.
