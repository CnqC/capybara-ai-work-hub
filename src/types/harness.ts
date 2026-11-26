import { z } from 'zod';

export const WorkDomainSchema = z.enum([
  'wps_document',
  'data_analytics',
  'capcut_video',
  'personal_finance',
]);
export type WorkDomain = z.infer<typeof WorkDomainSchema>;

export const HarnessStageSchema = z.enum([
  'IDLE',
  'LISTENING_MIC',
  'ANALYZING_BLUEPRINT',
  'AWAITING_USER_CONFIRM',
  'REFINING_BLUEPRINT',
  'EXECUTING_SUBAGENTS',
  'CONTINUOUS_QA_AUDIT',
  'COMPLETED_AND_LEARNED',
]);
export type HarnessStage = z.infer<typeof HarnessStageSchema>;

export const CapyAgentIdSchema = z.enum([
  'boss-capy-coordinator',
  'scribe-capy-wps-doc',
  'abacus-capy-data-analyst',
  'director-capy-capcut-editor',
  'treasurer-capy-finance-coder',
  'inspector-capy-continuous-qa',
]);
export type CapyAgentId = z.infer<typeof CapyAgentIdSchema>;

export const BlueprintPreviewSchema = z.object({
  revision: z.number().int().min(1),
  rawVoiceTranscript: z.string(),
  normalizedIntent: z.string(),
  detectedDomain: WorkDomainSchema,
  assignedAgents: z.array(CapyAgentIdSchema),
  expectedDeliverableTitle: z.string(),
  concreteOutputMockup: z.array(z.string()),
  qualityCriteria: z.array(z.string()),
  subTasksPlan: z.array(
    z.object({
      taskId: z.string(),
      title: z.string(),
      ownerAgent: CapyAgentIdSchema,
      inputSource: z.string(),
      expectedArtifact: z.string(),
      qaCheckRule: z.string(),
    })
  ),
  refinementHistory: z.array(z.string()),
});
export type BlueprintPreview = z.infer<typeof BlueprintPreviewSchema>;

export const TaskHandoffFrontmatterSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  domain: WorkDomainSchema,
  workerAgent: CapyAgentIdSchema,
  reviewerAgent: z.literal('inspector-capy-continuous-qa'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY_FOR_QA', 'QA_PASSED', 'QA_REJECTED']),
  inputFiles: z.array(z.string()),
  outputArtifact: z.string(),
  summaryNotes: z.string(),
  qaVerdict: z.enum(['PENDING', 'PASS', 'REJECT']),
  qaFeedback: z.string(),
  qaCheckedAt: z.string(),
});
export type TaskHandoffItem = z.infer<typeof TaskHandoffFrontmatterSchema>;

export const VoiceGlossaryEntrySchema = z.object({
  id: z.string(),
  spokenPhrase: z.string(),
  normalizedTerm: z.string(),
  category: z.enum(['wps_office', 'data_finance', 'capcut', 'custom']),
});
export type VoiceGlossaryEntry = z.infer<typeof VoiceGlossaryEntrySchema>;

export const UserStyleDnaSchema = z.object({
  ownerName: z.string(),
  communicationTone: z.string(),
  wpsDocumentFormat: z.string(),
  dataPresentationRule: z.string(),
  capcutEditingStyle: z.string(),
  financeCategorizationRule: z.string(),
  autoLearnedRules: z.array(
    z.object({
      id: z.string(),
      sessionDate: z.string(),
      learnedFromFeedback: z.string(),
      appliedRule: z.string(),
    })
  ),
});
export type UserStyleDna = z.infer<typeof UserStyleDnaSchema>;
