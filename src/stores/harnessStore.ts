import { create } from 'zustand';
import {
  buildDeliverableBlueprint,
  createHandoffQueueFromBlueprint,
  refineDeliverableBlueprint,
} from '@/lib/voiceBlueprintEngine';
import type {
  BlueprintPreview,
  HarnessStage,
  TaskHandoffItem,
  UserStyleDna,
  VoiceGlossaryEntry,
} from '@/types/harness';

const DEFAULT_GLOSSARY: VoiceGlossaryEntry[] = [
  { id: 'g1', spokenPhrase: 'w b s', normalizedTerm: 'WPS Office', category: 'wps_office' },
  { id: 'g2', spokenPhrase: 'vê kép pi ét', normalizedTerm: 'WPS Office', category: 'wps_office' },
  { id: 'g3', spokenPhrase: 'cáp cắt', normalizedTerm: 'CapCut', category: 'capcut' },
  { id: 'g4', spokenPhrase: 'cát phờ lâu', normalizedTerm: 'Báo cáo Dòng tiền (Cashflow)', category: 'data_finance' },
  { id: 'g5', spokenPhrase: 'sấp ây gần', normalizedTerm: 'Subagent', category: 'custom' },
];

const DEFAULT_STYLE_DNA: UserStyleDna = {
  ownerName: 'Bạn Của Quang',
  communicationTone: 'Đi thẳng vào hình mẫu sản phẩm đầu ra, có bảng đối chiếu trực quan, không vòng vo.',
  wpsDocumentFormat: 'Mở đầu bằng Tóm Tắt Điều Hành 3 ý chính, ưu tiên bảng so sánh 4 cột, luôn trích dẫn nguồn [TênFile - Mục].',
  dataPresentationRule: 'Đơn vị VNĐ dấu chấm phân cách hàng nghìn, luôn kèm dòng Tổng cộng và cột % Tỷ trọng được kiểm chứng bằng Python.',
  capcutEditingStyle: 'Khung hình 9:16 hoặc 16:9, cắt khoảng lặng > 0.6s, phụ đề 4-7 từ/dòng nhấn màu Cam Yuzu (#D96B27).',
  financeCategorizationRule: 'Chia 5 hũ ngân sách Capybara, bắt buộc đối soát Zero-Sum (Số dư ròng === Tổng thu - Tổng chi).',
  autoLearnedRules: [
    {
      id: 'learn-1',
      sessionDate: '2026-11-26',
      learnedFromFeedback: 'Nhớ gom bảng đối soát chi phí thành 4 cột rõ ràng trước khi xuất file WPS',
      appliedRule: 'Mọi báo cáo đối soát WPS luôn dựng khung bảng 4 cột (Hạng mục | Kỳ trước | Kỳ này | % Biến động).',
    },
  ],
};

const INITIAL_SAMPLE_VOICE =
  'À ừm đọc giúp tôi 2 file báo cáo chi phí tháng 10 và tháng 11 trên w b s rồi phân tích số liệu xem khoản nào vượt ngân sách để xuất ra văn bản báo cáo chuẩn cho tôi nhé';

interface HarnessState {
  stage: HarnessStage;
  voiceDraft: string;
  refinementDraft: string;
  glossary: VoiceGlossaryEntry[];
  styleDna: UserStyleDna;
  currentBlueprint: BlueprintPreview;
  handoffTasks: TaskHandoffItem[];
  setVoiceDraft: (text: string) => void;
  setRefinementDraft: (text: string) => void;
  startMicListening: () => void;
  analyzeVoiceInput: (voiceText?: string) => void;
  submitRefinementFeedback: (feedbackText?: string) => void;
  approveBlueprintAndDispatch: () => void;
  runContinuousQaForTask: (taskId: string, verdict: 'PASS' | 'REJECT', customNote?: string) => void;
  resetHarnessLoop: () => void;
  updateStyleDnaField: (field: keyof Omit<UserStyleDna, 'autoLearnedRules'>, value: string) => void;
  addVoiceGlossaryEntry: (spokenPhrase: string, normalizedTerm: string, category: VoiceGlossaryEntry['category']) => void;
}

const initialBlueprint = buildDeliverableBlueprint(
  INITIAL_SAMPLE_VOICE,
  DEFAULT_GLOSSARY,
  DEFAULT_STYLE_DNA
);

export const useHarnessStore = create<HarnessState>((set, get) => ({
  stage: 'AWAITING_USER_CONFIRM',
  voiceDraft: INITIAL_SAMPLE_VOICE,
  refinementDraft: '',
  glossary: DEFAULT_GLOSSARY,
  styleDna: DEFAULT_STYLE_DNA,
  currentBlueprint: initialBlueprint,
  handoffTasks: createHandoffQueueFromBlueprint(initialBlueprint),

  setVoiceDraft: (text) => set({ voiceDraft: text }),
  setRefinementDraft: (text) => set({ refinementDraft: text }),

  startMicListening: () => set({ stage: 'LISTENING_MIC' }),

  analyzeVoiceInput: (voiceText) => {
    const state = get();
    const raw = (voiceText ?? state.voiceDraft).trim();
    if (!raw) return;
    const blueprint = buildDeliverableBlueprint(raw, state.glossary, state.styleDna);
    set({
      voiceDraft: raw,
      currentBlueprint: blueprint,
      handoffTasks: createHandoffQueueFromBlueprint(blueprint),
      stage: 'AWAITING_USER_CONFIRM',
    });
  },

  submitRefinementFeedback: (feedbackText) => {
    const state = get();
    const fb = (feedbackText ?? state.refinementDraft).trim();
    if (!fb) return;
    const refined = refineDeliverableBlueprint(
      state.currentBlueprint,
      fb,
      state.glossary,
      state.styleDna
    );
    const newLearned = {
      id: `learn-${Date.now()}`,
      sessionDate: new Date().toISOString().slice(0, 10),
      learnedFromFeedback: fb,
      appliedRule: `Tự động áp dụng yêu cầu tinh chỉnh: "${refined.normalizedIntent.slice(-90)}"`,
    };
    set({
      currentBlueprint: refined,
      handoffTasks: createHandoffQueueFromBlueprint(refined),
      refinementDraft: '',
      stage: 'AWAITING_USER_CONFIRM',
      styleDna: {
        ...state.styleDna,
        autoLearnedRules: [newLearned, ...state.styleDna.autoLearnedRules],
      },
    });
  },

  approveBlueprintAndDispatch: () => {
    const state = get();
    const queue = createHandoffQueueFromBlueprint(state.currentBlueprint);
    set({
      handoffTasks: queue,
      stage: 'CONTINUOUS_QA_AUDIT',
    });
  },

  runContinuousQaForTask: (taskId, verdict, customNote) => {
    const state = get();
    const nowIso = new Date().toISOString();
    const updated = state.handoffTasks.map((t) => {
      if (t.taskId !== taskId) return t;
      if (verdict === 'PASS') {
        return {
          ...t,
          status: 'QA_PASSED' as const,
          qaVerdict: 'PASS' as const,
          qaFeedback:
            customNote ??
            'Inspector Capy đã đối chiếu sản phẩm thật với CURRENT-BLUEPRINT.md và USER-STYLE-DNA.md: Khớp 100%, đóng dấu PASS!',
          qaCheckedAt: nowIso,
        };
      }
      return {
        ...t,
        status: 'QA_REJECTED' as const,
        qaVerdict: 'REJECT' as const,
        qaFeedback:
          customNote ??
          'Inspector Capy phát hiện điểm chưa khớp với Bản Hình Dung. Yêu cầu Worker Subagent chỉnh lại trước khi mở khóa task sau!',
        qaCheckedAt: nowIso,
      };
    });

    // Nếu task hiện tại PASS, tự động mở khóa task PENDING kế tiếp sang READY_FOR_QA
    if (verdict === 'PASS') {
      const nextPendingIdx = updated.findIndex((t) => t.status === 'PENDING');
      if (nextPendingIdx >= 0) {
        updated[nextPendingIdx] = {
          ...updated[nextPendingIdx],
          status: 'READY_FOR_QA',
          qaFeedback: 'Đã được Boss Capy mở khóa bàn giao từ task trước. Sẵn sàng cho Inspector Capy nghiệm thu.',
        };
      }
    }

    const allPassed = updated.every((t) => t.qaVerdict === 'PASS');
    set({
      handoffTasks: updated,
      stage: allPassed ? 'COMPLETED_AND_LEARNED' : 'CONTINUOUS_QA_AUDIT',
    });
  },

  resetHarnessLoop: () => set({ stage: 'IDLE', refinementDraft: '' }),

  updateStyleDnaField: (field, value) =>
    set((state) => ({
      styleDna: {
        ...state.styleDna,
        [field]: value,
      },
    })),

  addVoiceGlossaryEntry: (spokenPhrase, normalizedTerm, category) =>
    set((state) => ({
      glossary: [
        {
          id: `g-${Date.now()}`,
          spokenPhrase: spokenPhrase.trim(),
          normalizedTerm: normalizedTerm.trim(),
          category,
        },
        ...state.glossary,
      ],
    })),
}));
