---
name: capcut-automated-editing
description: >-
  Quy trình tự động hóa dựng và edit video trên CapCut thông qua capcut-mcp:
  lập bảng kịch bản Timeline trong bước Confirm, sao lưu bản nháp an toàn, cắt ghép theo nhịp,
  chèn phụ đề tự động và bắt buộc chạy capcut_validate trước khi bàn giao.
---

# Tự Động Hóa Edit Video Trên CapCut (`capcut-automated-editing`)

## 1. Chuỗi Gọi Tool `capcut-mcp` Chuẩn An Toàn
1. **Khảo sát**: `capcut_list_drafts` $\rightarrow$ `capcut_read_timeline` để đọc thời lượng, số lượng track video/audio/text hiện có.
2. **Bảo vệ bản gốc**: Luôn gọi `capcut_clone_draft` trước khi cắt ghép lớn để người dùng có thể quay lại bản cũ bất cứ lúc nào.
3. **Thực thi theo Bản Confirm**:
   - Đặt khung hình (`capcut_set_canvas`: `9:16` cho TikTok/Reels/Shorts hoặc `16:9` cho YouTube/Thuyết trình).
   - Cắt bỏ đoạn thừa (`capcut_split_segment`, `capcut_trim_segment`, `capcut_delete_segment`).
   - Thêm chữ phụ đề & tiêu đề (`capcut_add_text`) theo đúng gu font/màu trong `USER-STYLE-DNA.md`.
4. **Nghiệm thu kỹ thuật**: Gọi `capcut_validate` kiểm tra 0 lỗi đè track hoặc hở frame đen, sau đó gọi `capcut_save` và ghi log vào `TASK-XX_HANDOFF.md`.
