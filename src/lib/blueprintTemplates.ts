import type { BlueprintPreview, UserStyleDna, WorkDomain } from '@/types/harness';

export function getDomainBlueprintTemplate(
  domain: WorkDomain,
  styleDna: UserStyleDna,
  revision: number
): {
  title: string;
  mockup: string[];
  criteria: string[];
  subTasks: BlueprintPreview['subTasksPlan'];
} {
  const templates: Record<
    WorkDomain,
    {
      title: string;
      mockup: string[];
      criteria: string[];
      subTasks: BlueprintPreview['subTasksPlan'];
    }
  > = {
    wps_document: {
      title: 'Báo Cáo Văn Bản WPS & Đối Chiếu Đa Tài Liệu Chuẩn Cá Nhân',
      mockup: [
        `[Đầu trang WPS] Tóm Tắt Điều Hành 3 Ý Chính (Chuẩn ${styleDna.ownerName})`,
        '[Bảng Đối Chiếu Đa Bên] Cột 1: Điều khoản/Mục | Cột 2: Tài liệu Bên A | Cột 3: Tài liệu Bên B | Cột 4: Nhận định & Trích dẫn nguồn',
        `[Phụ lục] Xuất file an toàn vào 02_KetQua_NghiemThu/BaoCao_TongHop_WPS_v${revision}.docx (Không đè file đang mở trên WPS)`,
      ],
      criteria: [
        '100% nhận định có trích dẫn [Nguồn: TênFile - Trang/Mục]',
        `Áp dụng quy chuẩn trình bày: ${styleDna.wpsDocumentFormat}`,
        'Chống lỗi PermissionError khi WPS Office đang mở file gốc',
      ],
      subTasks: [
        {
          taskId: 'TASK-01',
          title: 'Đọc sâu & lập ma trận đối chiếu các tài liệu trong 01_TaiLieu_DauVao/',
          ownerAgent: 'scribe-capy-wps-doc',
          inputSource: '01_TaiLieu_DauVao/*.docx, *.pdf',
          expectedArtifact: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          qaCheckRule: 'Kiểm tra 100% trích dẫn nguồn có thật, 0 thông tin suy diễn',
        },
        {
          taskId: 'TASK-02',
          title: 'Chế bản file WPS .docx/.pptx theo đúng USER-STYLE-DNA.md',
          ownerAgent: 'scribe-capy-wps-doc',
          inputSource: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          expectedArtifact: `02_KetQua_NghiemThu/BaoCao_WPS_HoanChinh_v${revision}.docx`,
          qaCheckRule: 'Đối chiếu bố cục 3 ý chính đầu trang và bảng so sánh nhiều cột',
        },
      ],
    },
    data_analytics: {
      title: 'Bảng Phân Tích Số Liệu Tất Định & Báo Cáo Đối Soát WPS',
      mockup: [
        '[Bảng Mẫu Đầu Ra] Hạng mục | Kỳ trước (VNĐ) | Kỳ này (VNĐ) | Chênh lệch & % Tỷ trọng',
        '[Kiểm Toán Python] Chạy script đối soát tổng ngang === tổng dọc (0 tính nhẩm LLM, loại bỏ dòng trùng)',
        `[Định Dạng Cá Nhân] ${styleDna.dataPresentationRule}`,
      ],
      criteria: [
        '100% phép tính chạy qua script tất định, có checksum_metric trong HANDOFF.md',
        'Có dòng Tổng cộng và cột % Tỷ trọng cuối bảng',
        'Khớp định dạng số VNĐ dấu chấm phân cách hàng nghìn',
      ],
      subTasks: [
        {
          taskId: 'TASK-01',
          title: 'Chạy script làm sạch data, lọc dòng trùng và tính thống kê chuẩn xác',
          ownerAgent: 'abacus-capy-data-analyst',
          inputSource: '01_TaiLieu_DauVao/*.xlsx, *.csv',
          expectedArtifact: '02_KetQua_NghiemThu/Bang_SoLieu_DaDoiSoat.csv',
          qaCheckRule: 'Inspector Capy kiểm tra tổng thu - tổng chi và đối chiếu số dòng',
        },
        {
          taskId: 'TASK-02',
          title: 'Trình bày nhận định số liệu sang văn bản báo cáo WPS',
          ownerAgent: 'scribe-capy-wps-doc',
          inputSource: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          expectedArtifact: `02_KetQua_NghiemThu/BaoCao_PhanTich_Data_v${revision}.docx`,
          qaCheckRule: 'Mọi con số trong văn bản WPS khớp 100% với file CSV ở TASK-01',
        },
      ],
    },
    capcut_video: {
      title: 'Kịch Bản Timeline & Tự Động Dựng Video CapCut Qua MCP',
      mockup: [
        '[00:00 - 00:04] Hook mở đầu + Phụ đề nổi bật màu Cam Yuzu (#D96B27)',
        '[00:04 - 00:25] Cắt bỏ khoảng lặng > 0.6s, khớp nhịp BGM + Chèn B-Roll minh họa',
        `[Cấu Hình CapCut] ${styleDna.capcutEditingStyle} | Chạy capcut_validate 0 lỗi track`,
      ],
      criteria: [
        'Sao lưu bản nháp bằng capcut_clone_draft trước khi sửa timeline',
        'Phụ đề ngắn gọn 4-7 từ/dòng theo gu cá nhân',
        'Pass 100% capcut_validate trước khi gọi capcut_save',
      ],
      subTasks: [
        {
          taskId: 'TASK-01',
          title: 'Đọc timeline hiện tại, nhân bản draft an toàn & cắt nhịp segment',
          ownerAgent: 'director-capy-capcut-editor',
          inputSource: 'capcut_read_timeline',
          expectedArtifact: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          qaCheckRule: 'Kiểm tra không có khe hở frame đen giữa các segment video',
        },
        {
          taskId: 'TASK-02',
          title: 'Chèn lớp Text phụ đề, Audio BGM và chạy capcut_validate',
          ownerAgent: 'director-capy-capcut-editor',
          inputSource: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          expectedArtifact: 'CapCut Draft Saved & Validated',
          qaCheckRule: 'capcut_validate trả về 0 lỗi đè track và đúng tỷ lệ khung hình',
        },
      ],
    },
    personal_finance: {
      title: 'Cập Nhật & Cá Nhân Hóa Phần Mềm Quản Lý Tài Chính Cá Nhân (CapyFinance)',
      mockup: [
        '[Sổ Cái Zero-Sum] Tự động phân bổ thu/chi vào 5 Hũ Ngân Sách Capybara',
        `[Quy Tắc Cá Nhân] ${styleDna.financeCategorizationRule}`,
        '[Kiểm Chứng Code] Cập nhật Zod Schema + Giao diện React (<250 dòng/file) + Pass Vitest',
      ],
      criteria: [
        'Phương trình cân bằng sổ cái: Số dư ròng === Tổng Thu - Tổng Chi',
        'Dữ liệu lưu Local-First 100% trên máy cá nhân',
        'Pass npm run doctor (100/100) và Vitest unit tests',
      ],
      subTasks: [
        {
          taskId: 'TASK-01',
          title: 'Đối soát số liệu thu/chi & kiểm tra cân bằng sổ cái Zero-Sum',
          ownerAgent: 'abacus-capy-data-analyst',
          inputSource: 'src/stores/financeStore.ts',
          expectedArtifact: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          qaCheckRule: 'Kiểm tra 0 sai số số học trên toàn bộ 5 hũ ngân sách',
        },
        {
          taskId: 'TASK-02',
          title: 'Thi công nâng cấp giao diện/tính năng phần mềm Tài chính theo yêu cầu',
          ownerAgent: 'treasurer-capy-finance-coder',
          inputSource: '04_BanGiao_SubAgents/TASK-01_HANDOFF.md',
          expectedArtifact: 'src/features/finance/ (Updated & Tested)',
          qaCheckRule: 'Chạy pass npm run doctor và unit test tài chính',
        },
      ],
    },
  };
  return templates[domain];
}
