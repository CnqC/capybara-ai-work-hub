import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import {
  buildTreasurerSelfUpgradePrompt,
  calculateFinanceSummary,
  exportTransactionsToCsv,
  formatVnd,
} from '@/lib/financeMath';
import {
  buildDeliverableBlueprint,
  createHandoffQueueFromBlueprint,
  detectWorkDomain,
  formatHandoffMarkdown,
  normalizeVoiceTranscript,
  refineDeliverableBlueprint,
} from '@/lib/voiceBlueprintEngine';
import { harnessLoopMachine } from '@/machines/harnessLoopMachine';
import type { FinanceTransaction } from '@/types/finance';
import type { UserStyleDna, VoiceGlossaryEntry } from '@/types/harness';

const MOCK_GLOSSARY: VoiceGlossaryEntry[] = [
  { id: '1', spokenPhrase: 'w b s', normalizedTerm: 'WPS Office', category: 'wps_office' },
  { id: '2', spokenPhrase: 'cáp cắt', normalizedTerm: 'CapCut', category: 'capcut' },
];

const MOCK_DNA: UserStyleDna = {
  ownerName: 'Minh',
  communicationTone: 'Ngắn gọn, trực quan',
  wpsDocumentFormat: 'Bảng 4 cột, có Tóm tắt điều hành',
  dataPresentationRule: 'Đơn vị VNĐ dấu chấm',
  capcutEditingStyle: '9:16 nhịp nhanh',
  financeCategorizationRule: '5 hũ ngân sách',
  autoLearnedRules: [],
};

describe('CapyHub Voice-to-Blueprint Confirm Loop & Handoff QA Engine', () => {
  it('khử nhiễu từ đệm giọng nói và dịch chuẩn thuật ngữ WPS / CapCut từ VOICE-GLOSSARY', () => {
    const raw = 'À ừm đọc file trên w b s rồi dựng video cáp cắt cho tôi nhé';
    const cleaned = normalizeVoiceTranscript(raw, MOCK_GLOSSARY);
    expect(cleaned).toContain('WPS Office');
    expect(cleaned).toContain('CapCut');
    expect(cleaned.toLowerCase()).not.toContain('à ừm');
  });

  it('phân loại chính xác 4 đầu việc (WPS, Data, CapCut, Personal Finance)', () => {
    expect(detectWorkDomain('Dựng timeline video trên CapCut')).toBe('capcut_video');
    expect(detectWorkDomain('Đối soát bảng số liệu Excel tháng 11')).toBe('data_analytics');
    expect(detectWorkDomain('Code thêm tính năng cho app tài chính sổ thu chi')).toBe('personal_finance');
    expect(detectWorkDomain('Tổng hợp hợp đồng 3 bên trên WPS Office')).toBe('wps_document');
  });

  it('lặp lại phân tích Bản Hình Dung Kết Quả Cuối (Iterative Refinement) khi người dùng chưa ưng ý', () => {
    const bp1 = buildDeliverableBlueprint(
      'Phân tích số liệu doanh thu tháng 11',
      MOCK_GLOSSARY,
      MOCK_DNA
    );
    expect(bp1.revision).toBe(1);
    expect(bp1.detectedDomain).toBe('data_analytics');

    const bp2 = refineDeliverableBlueprint(
      bp1,
      'À khoan thêm cột % tăng trưởng so với tháng 10 trên w b s',
      MOCK_GLOSSARY,
      MOCK_DNA
    );
    expect(bp2.revision).toBe(2);
    expect(bp2.concreteOutputMockup.some((m) => m.includes('Lần #2'))).toBe(true);
    expect(bp2.refinementHistory).toHaveLength(2);
  });

  it('tạo danh sách file bàn giao HANDOFF.md có YAML Frontmatter chuẩn cho Inspector Capy QA', () => {
    const bp = buildDeliverableBlueprint('Edit video cáp cắt 60 giây', MOCK_GLOSSARY, MOCK_DNA);
    const queue = createHandoffQueueFromBlueprint(bp);
    expect(queue.length).toBeGreaterThanOrEqual(2);
    expect(queue[0].status).toBe('READY_FOR_QA');
    expect(queue[1].status).toBe('PENDING');

    const md = formatHandoffMarkdown(queue[0]);
    expect(md).toContain('---');
    expect(md).toContain('worker_agent: director-capy-capcut-editor');
    expect(md).toContain('reviewer_agent: inspector-capy-continuous-qa');
  });

  it('vận hành chuẩn máy trạng thái XState từ Mic -> Confirm -> Refinement -> Subagents -> QA', () => {
    const actor = createActor(harnessLoopMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('IDLE');

    actor.send({ type: 'START_MIC' });
    expect(actor.getSnapshot().value).toBe('LISTENING_MIC');

    actor.send({ type: 'STOP_MIC_AND_ANALYZE' });
    expect(actor.getSnapshot().value).toBe('ANALYZING_BLUEPRINT');

    actor.send({ type: 'BLUEPRINT_READY' });
    expect(actor.getSnapshot().value).toBe('AWAITING_USER_CONFIRM');

    // Người dùng chưa ưng, nói thêm vào Mic để chỉnh bản Confirm
    actor.send({ type: 'USER_REQUEST_REFINEMENT' });
    expect(actor.getSnapshot().value).toBe('REFINING_BLUEPRINT');

    actor.send({ type: 'BLUEPRINT_UPDATED' });
    expect(actor.getSnapshot().value).toBe('AWAITING_USER_CONFIRM');

    // Người dùng đồng ý cho thực thi
    actor.send({ type: 'USER_APPROVE_EXECUTION' });
    expect(actor.getSnapshot().value).toBe('EXECUTING_SUBAGENTS');

    actor.send({ type: 'HANDOFF_READY_FOR_QA' });
    expect(actor.getSnapshot().value).toBe('CONTINUOUS_QA_AUDIT');

    actor.send({ type: 'QA_PASS_ALL_COMPLETED' });
    expect(actor.getSnapshot().value).toBe('COMPLETED_AND_LEARNED');
  });
});

describe('CapyFinance Personal Finance Zero-Sum Ledger Math', () => {
  const sampleTxs: FinanceTransaction[] = [
    {
      id: '1',
      date: '2026-11-01',
      title: 'Lương tháng 11',
      type: 'income',
      amountVnd: 20000000,
      bucket: 'essential_living',
      note: '',
      verifiedByAbacusCapy: true,
    },
    {
      id: '2',
      date: '2026-11-02',
      title: 'Chi phí sinh hoạt',
      type: 'expense',
      amountVnd: 8000000,
      bucket: 'essential_living',
      note: '',
      verifiedByAbacusCapy: true,
    },
    {
      id: '3',
      date: '2026-11-03',
      title: 'Mua WPS Pro',
      type: 'expense',
      amountVnd: 2000000,
      bucket: 'work_tools_wps_capcut',
      note: '',
      verifiedByAbacusCapy: true,
    },
  ];

  it('tính toán chính xác tổng thu, tổng chi, số dư ròng và đảm bảo cân bằng Zero-Sum', () => {
    const summary = calculateFinanceSummary(sampleTxs);
    expect(summary.totalIncomeVnd).toBe(20000000);
    expect(summary.totalExpenseVnd).toBe(10000000);
    expect(summary.netBalanceVnd).toBe(10000000);
    expect(summary.savingsRatePercent).toBe(50);
    expect(summary.isZeroSumBalanced).toBe(true);
    expect(formatVnd(summary.netBalanceVnd)).toBe('10.000.000 VNĐ');
  });

  it('xuất CSV chuẩn và sinh lệnh nâng cấp App tài chính có gắn cổng Confirm Blueprint', () => {
    const csv = exportTransactionsToCsv(sampleTxs);
    expect(csv).toContain('ID,Ngay,TieuDe,Loai,SoTienVND');
    expect(csv).toContain('20000000');

    const summary = calculateFinanceSummary(sampleTxs);
    const prompt = buildTreasurerSelfUpgradePrompt('Thêm biểu đồ so sánh quý', summary, []);
    expect(prompt).toContain('target_agent: treasurer-capy-finance-coder');
    expect(prompt).toContain('workflow_gate: ITERATIVE_BLUEPRINT_CONFIRM_FIRST');
  });
});
