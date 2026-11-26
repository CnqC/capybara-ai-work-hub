---
name: voice-confirm-blueprint-loop
description: >-
  Quy trình chuẩn hóa âm thanh thu từ Mic (Voice-to-Prompt), lọc nhiễu qua VOICE-GLOSSARY.md,
  phân tích dữ liệu/tài liệu ở chế độ Read-Only và tạo Bản Hình Dung Kết Quả Cuối (CURRENT-BLUEPRINT.md)
  lặp lại xác nhận với người dùng cho tới khi người dùng đồng ý mới cho phép thực thi.
---

# Vòng Lặp Confirm Hình Dung Kết Quả Cuối (`voice-confirm-blueprint-loop`)

## 1. Khi Nào Kích Hoạt
Kích hoạt trên **100% prompt đầu vào** (dù từ Mic hay từ Chat) trước khi thực hiện bất kỳ thao tác ghi file hoặc giao việc cho Subagent.

## 2. Quy Trình 4 Bước Bắt Buộc
1. **Bước 1 — Khử Nhiễu Giọng Nói (`Voice De-noising`)**:
   - Đọc `03_HoSo_TriNho_CaNhan/VOICE-GLOSSARY.md`.
   - Thay thế các cụm từ phát âm lệch thành thuật ngữ chuẩn và loại bỏ các mệnh đề mà người nói tự hủy bỏ ở cuối câu.
2. **Bước 2 — Khảo Sát Dữ Liệu Thật (`Read-Only Recon`)**:
   - Đọc danh sách file trong `01_TaiLieu_DauVao/`, bảng số liệu hoặc cấu trúc dự án CapCut / App tài chính hiện tại để có con số thật.
3. **Bước 3 — Vẽ Bản Hình Dung Kết Quả Cuối (`04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md`)**:
   - Xuất file YAML Frontmatter + Mockup chi tiết kết quả cuối cùng mà người dùng sẽ nhận được (bảng mẫu 3 dòng đầu, dàn ý văn bản WPS, timeline CapCut theo giây, hoặc sơ đồ màn hình App tài chính).
4. **Bước 4 — Lặp Lại Phân Tích Theo Phản Hồi Mic/Chat**:
   - Nếu người dùng phản hồi *"Chưa đạt"*, *"Chi tiết hơn ở mục X"*, tăng `revision: N + 1` và vẽ lại Bản Hình Dung chi tiết hơn.
   - Chỉ khi người dùng nói/gõ từ khóa đồng ý (*"Đồng ý"*, *"OK làm đi"*, *"Chốt thực thi"*), mới chuyển trạng thái `status: APPROVED_FOR_EXECUTION`.
