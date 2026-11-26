import { getDomainBlueprintTemplate } from './blueprintTemplates';
import type {
  BlueprintPreview,
  CapyAgentId,
  TaskHandoffItem,
  UserStyleDna,
  VoiceGlossaryEntry,
  WorkDomain,
} from '@/types/harness';

const FILLER_WORDS_REGEX = /(?:^|\s)(à ừm|à khoan|ừm thì|ờ thì|à mà|kiểu như là)(?=\s|$|[,.!?])/giu;

export function normalizeVoiceTranscript(
  rawText: string,
  glossary: VoiceGlossaryEntry[]
): string {
  let cleaned = rawText.replace(FILLER_WORDS_REGEX, ' ').replace(/\s+/g, ' ').trim();
  for (const item of glossary) {
    const escaped = item.spokenPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'giu');
    cleaned = cleaned.replace(regex, item.normalizedTerm);
  }
  return cleaned.trim();
}

export function detectWorkDomain(normalizedText: string): WorkDomain {
  const lower = normalizedText.toLowerCase();
  if (/capcut|video|timeline|cắt ghép|phụ đề|clip|nhạc|tik\s?tok|short/.test(lower)) {
    return 'capcut_video';
  }
  if (/app tài chính|quản lý tài chính|hũ ngân sách|tiết kiệm|code thêm|sổ thu chi/.test(lower)) {
    return 'personal_finance';
  }
  if (/số liệu|data|excel|csv|đối soát|tăng trưởng|tỷ trọng|bảng tính/.test(lower)) {
    return 'data_analytics';
  }
  return 'wps_document';
}

export function getAssignedAgentsForDomain(domain: WorkDomain): CapyAgentId[] {
  switch (domain) {
    case 'wps_document':
      return ['boss-capy-coordinator', 'scribe-capy-wps-doc', 'inspector-capy-continuous-qa'];
    case 'data_analytics':
      return [
        'boss-capy-coordinator',
        'abacus-capy-data-analyst',
        'scribe-capy-wps-doc',
        'inspector-capy-continuous-qa',
      ];
    case 'capcut_video':
      return ['boss-capy-coordinator', 'director-capy-capcut-editor', 'inspector-capy-continuous-qa'];
    case 'personal_finance':
      return [
        'boss-capy-coordinator',
        'treasurer-capy-finance-coder',
        'abacus-capy-data-analyst',
        'inspector-capy-continuous-qa',
      ];
  }
}

export function buildDeliverableBlueprint(
  rawVoice: string,
  glossary: VoiceGlossaryEntry[],
  styleDna: UserStyleDna,
  revision = 1,
  previousHistory: string[] = []
): BlueprintPreview {
  const normalizedIntent = normalizeVoiceTranscript(rawVoice, glossary);
  const detectedDomain = detectWorkDomain(normalizedIntent);
  const assignedAgents = getAssignedAgentsForDomain(detectedDomain);
  const selected = getDomainBlueprintTemplate(detectedDomain, styleDna, revision);

  return {
    revision,
    rawVoiceTranscript: rawVoice,
    normalizedIntent,
    detectedDomain,
    assignedAgents,
    expectedDeliverableTitle: selected.title,
    concreteOutputMockup: selected.mockup,
    qualityCriteria: selected.criteria,
    subTasksPlan: selected.subTasks,
    refinementHistory: [...previousHistory, `Lần #${revision}: ${normalizedIntent}`],
  };
}

export function refineDeliverableBlueprint(
  current: BlueprintPreview,
  feedbackVoice: string,
  glossary: VoiceGlossaryEntry[],
  styleDna: UserStyleDna
): BlueprintPreview {
  const normalizedFeedback = normalizeVoiceTranscript(feedbackVoice, glossary);
  const combinedRaw = `${current.normalizedIntent}. Bổ sung chi tiết theo yêu cầu mới: ${normalizedFeedback}`;
  const updated = buildDeliverableBlueprint(
    combinedRaw,
    glossary,
    styleDna,
    current.revision + 1,
    current.refinementHistory
  );
  updated.concreteOutputMockup = [
    ...updated.concreteOutputMockup,
    `[Chi tiết bổ sung ở Lần #${current.revision + 1}]: ${normalizedFeedback}`,
  ];
  return updated;
}

export function createHandoffQueueFromBlueprint(blueprint: BlueprintPreview): TaskHandoffItem[] {
  return blueprint.subTasksPlan.map((st, idx) => ({
    taskId: st.taskId,
    title: st.title,
    domain: blueprint.detectedDomain,
    workerAgent: st.ownerAgent,
    reviewerAgent: 'inspector-capy-continuous-qa',
    status: idx === 0 ? 'READY_FOR_QA' : 'PENDING',
    inputFiles: [st.inputSource],
    outputArtifact: st.expectedArtifact,
    summaryNotes: `Đã thực thi theo Bản Hình Dung #${blueprint.revision}. Tiêu chí QA: ${st.qaCheckRule}`,
    qaVerdict: 'PENDING',
    qaFeedback: 'Đang chờ Inspector Capy kiểm tra sản phẩm thật...',
    qaCheckedAt: '',
  }));
}

export function formatHandoffMarkdown(item: TaskHandoffItem): string {
  return [
    '---',
    `task_id: ${item.taskId}`,
    `title: "${item.title}"`,
    `domain: ${item.domain}`,
    `worker_agent: ${item.workerAgent}`,
    `reviewer_agent: ${item.reviewerAgent}`,
    `status: ${item.status}`,
    `output_artifact: "${item.outputArtifact}"`,
    `qa_verdict: ${item.qaVerdict}`,
    '---',
    `# Biên Bản Bàn Giao ${item.taskId}`,
    `- **Đầu vào**: ${item.inputFiles.join(', ')}`,
    `- **Ghi chú bàn giao**: ${item.summaryNotes}`,
    `- **Phản hồi QA**: ${item.qaFeedback}`,
  ].join('\n');
}
