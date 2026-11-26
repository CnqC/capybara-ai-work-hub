---
name: wps-multi-doc-synthesis
description: >-
  Quy trình xử lý văn bản trên WPS Office (.docx, .pptx, .pdf) và đọc hiểu sâu tài liệu nhiều bên:
  trích xuất chéo đa văn bản không bịa đặt, trình bày theo USER-STYLE-DNA.md và cơ chế Copy-Read / Version-Write
  chống lỗi khóa file khi người dùng đang mở WPS Office.
---

# Xử Lý Văn Bản WPS & Phân Tích Sâu Đa Tài Liệu (`wps-multi-doc-synthesis`)

## 1. Quy Tắc Đọc Hiểu Sâu Tài Liệu Nhiều Bên (`Multi-Party Document Cross-Examine`)
- Khi người dùng yêu cầu đọc hợp đồng, biên bản hoặc tài liệu từ nhiều bên trong `01_TaiLieu_DauVao/`:
  1. Lập **Bảng Ma Trận Đối Chiếu Các Bên** (Điểm giống nhau, Điểm mâu thuẫn về số liệu/điều khoản, Rủi ro cần lưu ý).
  2. Mọi con số hoặc nhận định bắt buộc ghi rõ nguồn `[TênFile - Mục/Trang]`.

## 2. Quy Tắc An Toàn Khi Làm Việc Với WPS Office (`Zero File-Lock Crash`)
- WPS Office khóa quyền ghi trực tiếp (`PermissionError`) trên file `.docx`/`.xlsx`/`.pptx` đang mở trên màn hình người dùng.
- Sử dụng công cụ `tools/wps-office-engine.py` để:
  1. Tự động đọc qua bản sao tạm trong bộ nhớ nếu file gốc đang mở.
  2. Khi ghi kết quả vào `02_KetQua_NghiemThu/`, nếu file đích đang bị WPS khóa, tự động lưu sang `<TenFile>_v<Timestamp>.docx` và thông báo đường dẫn click được cho người dùng.
