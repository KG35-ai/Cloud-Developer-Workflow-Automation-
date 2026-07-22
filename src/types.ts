export type PipelineStatus = 
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'rolling_back'
  | 'rolled_back';

export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
  durationMs?: number;
  logs?: string[];
}

export interface PipelineRun {
  id: string;
  repo: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  avatarUrl?: string;
  status: PipelineStatus;
  environment: 'production' | 'staging' | 'canary';
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  stages: PipelineStage[];
  failureReason?: string;
  failureLogSnippet?: string;
  rollbackTriggeredBy?: 'automated_guardrail' | 'slack_command' | 'manual_user';
  rollbackTargetCommit?: string;
  rollbackCompletedAt?: string;
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'investigating' | 'mitigating' | 'rolled_back' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  pipelineRunId: string;
  repo: string;
  commitHash: string;
  environment: string;
  errorSummary: string;
  stackTrace?: string;
  rootCauseAnalysis?: {
    summary: string;
    probableCause: string;
    suggestedFix: string;
    affectedComponents: string[];
    riskAssessment: string;
    postmortemDraft: string;
  };
  slackChannel: string;
  slackThreadTs?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  automatedRollbackExecuted: boolean;
}

export interface GuardrailRule {
  id: string;
  name: string;
  metric: 'error_rate' | 'latency_p99' | 'health_check_status' | 'cpu_usage' | 'memory_spike';
  operator: '>' | '<' | '==';
  threshold: number | string;
  unit: string;
  action: 'auto_rollback' | 'notify_slack_critical' | 'pause_pipeline';
  enabled: boolean;
  evaluationWindowSeconds: number;
  description: string;
}

export interface SlackMessage {
  id: string;
  type: 'pipeline_failed' | 'incident_opened' | 'auto_rollback_executed' | 'pipeline_succeeded' | 'guardrail_triggered';
  channel: string;
  botName: string;
  title: string;
  message: string;
  timestamp: string;
  delivered: boolean;
  severity?: IncidentSeverity;
  actions?: {
    label: string;
    actionId: string;
    style?: 'primary' | 'danger' | 'default';
  }[];
  metadata?: Record<string, any>;
}

export interface SystemMetricPoint {
  timestamp: string;
  timeLabel: string;
  errorRatePercent: number;
  latencyMs: number;
  cpuUsagePercent: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export interface WebhookEventLog {
  id: string;
  source: 'github' | 'slack';
  eventType: string;
  receivedAt: string;
  payload: any;
  responseStatus: number;
  processedAction?: string;
}
