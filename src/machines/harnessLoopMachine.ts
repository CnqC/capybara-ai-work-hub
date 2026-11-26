import { createMachine } from 'xstate';

/**
 * Máy trạng thái XState chuẩn hóa 1 vòng Harness của CapyHub:
 * IDLE -> LISTENING_MIC -> ANALYZING_BLUEPRINT -> AWAITING_USER_CONFIRM
 * <-> REFINING_BLUEPRINT (lặp lại tới khi người dùng đồng ý)
 * -> EXECUTING_SUBAGENTS <-> CONTINUOUS_QA_AUDIT -> COMPLETED_AND_LEARNED
 */
export const harnessLoopMachine = createMachine({
  id: 'capybaraHarnessLoop',
  initial: 'IDLE',
  states: {
    IDLE: {
      on: {
        START_MIC: 'LISTENING_MIC',
        SUBMIT_PROMPT: 'ANALYZING_BLUEPRINT',
      },
    },
    LISTENING_MIC: {
      on: {
        STOP_MIC_AND_ANALYZE: 'ANALYZING_BLUEPRINT',
        CANCEL_MIC: 'IDLE',
      },
    },
    ANALYZING_BLUEPRINT: {
      on: {
        BLUEPRINT_READY: 'AWAITING_USER_CONFIRM',
      },
    },
    AWAITING_USER_CONFIRM: {
      on: {
        USER_REQUEST_REFINEMENT: 'REFINING_BLUEPRINT',
        USER_APPROVE_EXECUTION: 'EXECUTING_SUBAGENTS',
        RESET_LOOP: 'IDLE',
      },
    },
    REFINING_BLUEPRINT: {
      on: {
        BLUEPRINT_UPDATED: 'AWAITING_USER_CONFIRM',
      },
    },
    EXECUTING_SUBAGENTS: {
      on: {
        HANDOFF_READY_FOR_QA: 'CONTINUOUS_QA_AUDIT',
      },
    },
    CONTINUOUS_QA_AUDIT: {
      on: {
        QA_REJECT_RETURN_TO_WORKER: 'EXECUTING_SUBAGENTS',
        QA_PASS_NEXT_TASK: 'EXECUTING_SUBAGENTS',
        QA_PASS_ALL_COMPLETED: 'COMPLETED_AND_LEARNED',
      },
    },
    COMPLETED_AND_LEARNED: {
      on: {
        RESET_LOOP: 'IDLE',
        START_MIC: 'LISTENING_MIC',
      },
    },
  },
});
