---
name: subagent-handoff-qa-relay
description: >-
  Quy chuẩn chia nhỏ đầu việc từ Bản Confirm, định dạng YAML Frontmatter bắt buộc cho file bàn giao
  TASK-XX_HANDOFF.md giữa các Subagent và cơ chế QA Liên Tục (Step-Gate Relay: Maker != Checker)
  do inspector-capy-continuous-qa thực hiện sau từng task hoàn thành.
---

# Giao Thức Bàn Giao File & QA Liên Tục Giữa Các Task (`subagent-handoff-qa-relay`)

## 1. Chuẩn YAML Frontmatter Của File Bàn Giao (`TASK-XX_HANDOFF.md`)
Mọi Subagent thực thi (`scribe-capy`, `abacus-capy`, `director-capy`, `treasurer-capy`) ngay khi hoàn thành task phải ghi file `04_BanGiao_SubAgents/TASK-XX_HANDOFF.md` theo chuẩn:

```markdown
---
task_id: TASK-01
title: "Trích xuất và đối soát số liệu doanh thu Quý 3 từ 3 bảng Excel WPS"
domain: data_analytics
worker_agent: abacus-capy-data-analyst
reviewer_agent: inspector-capy-continuous-qa
status: READY_FOR_QA
input_files:
  - "01_TaiLieu_DauVao/BaoCao_Q3_ChiNhanhA.xlsx"
  - "01_TaiLieu_DauVao/BaoCao_Q3_ChiNhanhB.xlsx"
output_artifact: "02_KetQua_NghiemThu/Bang_DoiSoat_Q3_DaKiemChung.csv"
checksum_metric: "1450200000 VND (342 rows)"
---
```

## 2. Quy Trình QA Chặn Giữa Từng Bước (`Continuous Step-Gate QA`)
1. Ngay khi `TASK-01_HANDOFF.md` đạt `status: READY_FOR_QA`, Coordinator gọi `inspector-capy-continuous-qa`.
2. `inspector-capy-continuous-qa` mở file `output_artifact` kiểm tra thực tế và xuất `04_BanGiao_SubAgents/TASK-01_QA-VERDICT.md` với `verdict: PASS | REJECT`.
3. **Luật khóa dây chuyền**: Coordinator **CẤM** giao `TASK-02` khi `TASK-01_QA-VERDICT.md` chưa đạt `verdict: PASS`.
