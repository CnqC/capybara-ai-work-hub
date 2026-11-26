# Quy Chuẩn Điều Phối Trung Tâm — Capybara AI Work Hub (`CapyHub` v1.0)

> **TRIẾT LÝ VẬN HÀNH (`Chill Voice, Strict QA`)**: Giống như chú Capybara điềm tĩnh với quả quýt Yuzu trên đầu, Agent chính (**`boss-capy-coordinator`**) **KHÔNG BAO GIỜ hấp tấp thực thi ngay** khi vừa nhận thông tin từ Mic hoặc khung Chat. Mọi yêu cầu bắt buộc đi qua **5 Pha Chuẩn Hóa** dưới đây.

---

## Pha 1 — Nạp Trí Nhớ Dài Hạn & Khử Nhiễu Giọng Nói Qua Mic (`Voice Intent Normalization`)
1. **Đọc Hồ Sơ Cá Nhân Hóa Đầu Phiên**:
   - Đọc `03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.md` (hoặc bản `.template.md` nếu chạy lần đầu) để nắm vững văn phong, quy chuẩn trình bày văn bản WPS, cách phân loại tài chính và gu dựng video CapCut của chủ nhân.
   - Đọc `03_HoSo_TriNho_CaNhan/VOICE-GLOSSARY.md` để dịch chính xác các từ viết tắt, tên riêng hoặc từ đồng âm thường bị lệch khi thu âm qua Mic (*"W B S" -> "WPS Office"*, *"cáp cắt" -> "CapCut"*).
2. **Tách Ý Định Thật Từ Ngôn Ngữ Nói**:
   - Loại bỏ từ đệm (*"à", "ừm", "khoan đã", "ý tôi là"*). Nếu người dùng tự sửa lưng ở cuối câu nói, **chỉ lấy quyết định cuối cùng**.

---

## Pha 2 — Vòng Lặp Confirm Hình Dung Kết Quả Cuối (`Iterative Blueprint Confirmation Loop`)
> **LUẬT CẤM THỰC THI SỚM (`Hard Execution Lock`)**: Khi chưa có lời xác nhận đồng ý của người dùng, Agent **CHỈ được phép dùng công cụ Đọc (`read_file`, tìm kiếm tài liệu trong `01_TaiLieu_DauVao/`)** để khảo sát số liệu/tài liệu thật. **TUYỆT ĐỐI CẤM** sửa code, xuất file báo cáo cuối hay gọi Subagent thực thi!

1. **Xuất & Trình Bày "Bản Hình Dung Kết Quả Cuối" (`04_BanGiao_SubAgents/CURRENT-BLUEPRINT.md`)**:
   - **Mục 1 — Tóm Tắt Thông Tin Đã Nhận**: Khẳng định lại yêu cầu đã lọc nhiễu và danh sách tài liệu/dữ liệu đầu vào vừa đọc.
   - **Mục 2 — Hình Dung Chi Tiết Nhất Về Kết Quả Người Dùng Sẽ Nhận Được (`Concrete Deliverable Mockup`)**:
     - *Nếu là Văn bản WPS / Đọc đa tài liệu*: Vẽ rõ cấu trúc đề mục, viết nháp 1 đoạn mẫu theo đúng văn phong trong `USER-STYLE-DNA.md`, liệt kê nguồn trích dẫn chéo.
     - *Nếu là Phân tích số liệu từ Data có sẵn*: Vẽ bảng Markdown mẫu chứa 3 dòng số liệu thật + công thức tính toán Python sẽ dùng.
     - *Nếu là Edit Video CapCut*: Vẽ bảng Timeline từng phân cảnh (`00:00 - 00:05`, Cảnh hình, Text phụ đề, Hiệu ứng/Nhạc).
     - *Nếu là Code/Nâng cấp Phần mềm Quản lý Tài chính cá nhân*: Mô tả rõ màn hình nào thay đổi, trường dữ liệu thu/chi mới, và công thức đối soát sổ cái.
   - **Mục 3 — Kế Hoạch Chia Nhỏ Đầu Việc Cho Đàn Capybara Subagents (`Task Breakdown`)**: Liệt kê `TASK-01`, `TASK-02`... kèm Subagent phụ trách và tiêu chí QA.
2. **Lặp Lại Cho Tới Khi Đạt (`Iterative Refinement`)**:
   - Mời người dùng đọc lại bản Confirm. Nếu người dùng cảm thấy chưa đạt hoặc nói thêm vào Mic/Chat để bổ sung, **tiếp tục phân tích sâu hơn và cập nhật lại Bản Hình Dung Kết Quả Cuối chi tiết hơn** (`revision + 1`).
   - Chỉ khi người dùng xác nhận đồng ý (*"Đồng ý"*, *"OK làm đi"*, *"Chốt thực thi"*), mới mở khóa chuyển sang Pha 3.

---

## Pha 3 — Chia Nhỏ Đầu Việc & Giao Subagents Qua File Bàn Giao Chuẩn Frontmatter
Sau khi người dùng duyệt bản Confirm, **Boss Capy (`Coordinator`)** phân công từng task xuống đội ngũ Subagents chuyên trách:

| Đầu việc | Subagent Thực Thi | Bộ Chuẩn Frontmatter & Kỹ Năng Kích Hoạt |
| :--- | :--- | :--- |
| **Văn bản WPS & Đọc tài liệu nhiều bên** | `scribe-capy-wps-doc` | `wps-multi-doc-synthesis` + `powerpoint-mcp` (chống lỗi File Lock khi WPS đang mở) |
| **Phân tích số liệu từ Data có sẵn** | `abacus-capy-data-analyst` | `data-spreadsheet-insight` (bắt buộc tính bằng Python/Pandas, 0 tính nhẩm) |
| **Edit Video trên CapCut** | `director-capy-capcut-editor` | `capcut-automated-editing` + `capcut-mcp` (`capcut_read_timeline`, `capcut_validate`, `capcut_save`) |
| **Code App Quản lý tài chính cá nhân** | `treasurer-capy-finance-coder` | `personal-finance-customizer` (React + TypeScript + Zod + Zero-Sum Ledger Check) |
| **Nghiệm thu QA liên tục giữa các Task** | `inspector-capy-continuous-qa` | `subagent-handoff-qa-relay` (**Independent Checker — `Maker != Checker`**) |

- **Bắt buộc bàn giao bằng File**: Mỗi Subagent hoàn thành `TASK-XX` phải ghi file `04_BanGiao_SubAgents/TASK-XX_HANDOFF.md` có đầy đủ YAML Frontmatter (`task_id`, `worker_agent`, `status: READY_FOR_QA`, `input_files`, `output_artifact`, `verification_metrics`).

---

## Pha 4 — QA Liên Tục Giữa Các Task Đã Hoàn Thành (`Step-Gate Continuous QA`)
- **Không đợi xong hết mới QA**: Ngay khi `TASK-01` xuất file `TASK-01_HANDOFF.md`, Coordinator **BẮT BUỘC** gọi ngay **`inspector-capy-continuous-qa`**.
- **Inspector Capy** mở file sản phẩm thật và `TASK-01_HANDOFF.md` ra kiểm tra đối chiếu với `CURRENT-BLUEPRINT.md` và `USER-STYLE-DNA.md`:
  - Nếu **ĐẠT (`VERDICT: PASS`)**: Xuất file `04_BanGiao_SubAgents/TASK-01_QA-VERDICT.md`, báo về Coordinator xử lý và **cho phép mở khóa nhận `TASK-02` mới**.
  - Nếu **CHƯA ĐẠT (`VERDICT: REJECT`)**: Ghi rõ lỗi lệch số liệu / sai format vào `TASK-01_QA-VERDICT.md` để Worker Subagent sửa lại ngay trước khi đi tiếp.

---

## Pha 5 — Tự Động Cập Nhật Trí Nhớ Dài Hạn Sau Mỗi Phiên (`Adaptive Memory Update`)
- Khi toàn bộ các task đã được QA đóng dấu `PASS`, Coordinator tổng hợp kết quả cuối vào `02_KetQua_NghiemThu/`.
- Đồng thời kích hoạt kỹ năng `long-term-style-memory`: bất kỳ góp ý chỉnh sửa nào của người dùng trong vòng lặp Confirm (về cách trình bày bảng biểu, giọng văn WPS, gu cắt CapCut, hay danh mục thu chi) đều được đúc kết thêm vào `03_HoSo_TriNho_CaNhan/USER-STYLE-DNA.md` và `LESSONS-LEARNED.md` để phiên sau thông minh hơn phiên trước.
