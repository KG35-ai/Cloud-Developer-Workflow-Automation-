import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  PipelineRun,
  Incident,
  GuardrailRule,
  SlackMessage,
  SystemMetricPoint,
  WebhookEventLog,
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- In-Memory State Store ---
let pipelines: PipelineRun[] = [
  {
    id: 'pipe-8492',
    repo: 'acme-corp/payment-service',
    branch: 'main',
    commitHash: '7f9c2d1',
    commitMessage: 'feat(payments): add Stripe webhook retry policy',
    author: 'Sarah Chen (dev-sarah)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    status: 'success',
    environment: 'production',
    startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    durationSeconds: 240,
    stages: [
      { id: 'stg-1', name: 'Lint & Type Check', status: 'success', durationMs: 12000 },
      { id: 'stg-2', name: 'Unit & Integration Tests', status: 'success', durationMs: 45000 },
      { id: 'stg-3', name: 'Docker Container Build', status: 'success', durationMs: 88000 },
      { id: 'stg-4', name: 'Canary Deployment (10%)', status: 'success', durationMs: 40000 },
      { id: 'stg-5', name: 'Prometheus Health Gate', status: 'success', durationMs: 30000 },
      { id: 'stg-6', name: 'Full Production Rollout', status: 'success', durationMs: 25000 },
    ],
  },
  {
    id: 'pipe-8493',
    repo: 'acme-corp/user-auth-api',
    branch: 'release/v2.4',
    commitHash: 'e41a90b',
    commitMessage: 'fix(auth): update JWT token expiry & key rotation',
    author: 'Alex Rivera (arivera-dev)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'rolled_back',
    environment: 'production',
    startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    durationSeconds: 210,
    failureReason: 'Canary Health Check Failed: Unhandled Promise Rejection in Auth Redis pool',
    failureLogSnippet: `[ERROR] 2026-07-21T18:12:04.912Z [auth-service] Redis Connection Timeout: Timeout of 5000ms exceeded at AuthStore.connect (/app/dist/redis.js:42:15)\n[CRITICAL] Canary 5xx Error Rate spiked to 14.8% (Guardrail limit: 5.0%)\n[SENTINEL] Triggering Automated Zero-Downtime Rollback to previous stable image v2.3.9 (commit a1b82c3)`,
    rollbackTriggeredBy: 'automated_guardrail',
    rollbackTargetCommit: 'a1b82c3',
    rollbackCompletedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    stages: [
      { id: 'stg-1', name: 'Lint & Type Check', status: 'success', durationMs: 11000 },
      { id: 'stg-2', name: 'Unit & Integration Tests', status: 'success', durationMs: 38000 },
      { id: 'stg-3', name: 'Docker Container Build', status: 'success', durationMs: 65000 },
      { id: 'stg-4', name: 'Canary Deployment (10%)', status: 'failed', durationMs: 22000, logs: [
        'Deploying image registry.acme.io/auth-api:e41a90b to canary-cluster-eu',
        'Canary pods ready: 3/3',
        'Routing 10% live traffic via Istio mesh...',
        'ERROR: High 500 Internal Server Error rate detected on /api/v1/auth/token',
        'Guardrail #GR-01 (Canary 5xx Error Rate > 5.0%) TRIPPED at 14.8%',
        'Executing automated rollback to v2.3.9...'
      ] },
      { id: 'stg-5', name: 'Automated Rollback Safeguard', status: 'success', durationMs: 18000, logs: [
        'Traffic routed back to v2.3.9 stable deployment',
        'Canary pods terminated gracefully',
        'Alert dispatched to Slack #devops-incidents & GitHub PR #412 commented'
      ] },
    ],
  },
  {
    id: 'pipe-8494',
    repo: 'acme-corp/inventory-worker',
    branch: 'main',
    commitHash: 'b92d4f8',
    commitMessage: 'refactor(kafka): optimize partition consumer offset logic',
    author: 'Elena Rostova (erostova)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'running',
    environment: 'canary',
    startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    stages: [
      { id: 'stg-1', name: 'Lint & Type Check', status: 'success', durationMs: 9000 },
      { id: 'stg-2', name: 'Unit & Integration Tests', status: 'success', durationMs: 42000 },
      { id: 'stg-3', name: 'Docker Container Build', status: 'success', durationMs: 50000 },
      { id: 'stg-4', name: 'Canary Deployment (10%)', status: 'running', durationMs: 15000 },
      { id: 'stg-5', name: 'Prometheus Health Gate', status: 'pending' },
      { id: 'stg-6', name: 'Full Production Rollout', status: 'pending' },
    ],
  }
];

let incidents: Incident[] = [
  {
    id: 'inc-3021',
    title: 'Canary Error Spike on User-Auth-API v2.4 (Redis Pool Timeout)',
    severity: 'critical',
    status: 'rolled_back',
    pipelineRunId: 'pipe-8493',
    repo: 'acme-corp/user-auth-api',
    commitHash: 'e41a90b',
    environment: 'production-canary',
    errorSummary: 'Redis connection timeout leading to 14.8% 5xx error rate during 10% canary traffic rollout.',
    stackTrace: `Error: Redis Connection Timeout of 5000ms
    at AuthStore.connect (/app/dist/redis.js:42:15)
    at async TokenService.generateAccessToken (/app/dist/services/token.js:18:9)
    at async Express.handleRequest (/app/dist/server.js:102:4)`,
    slackChannel: '#devops-incidents',
    slackThreadTs: '1721585524.001200',
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    automatedRollbackExecuted: true,
    rootCauseAnalysis: {
      summary: 'Incompatible Redis client pool connection string configuration introduced in commit e41a90b.',
      probableCause: 'The auth API was configured to attempt SSL connection to Redis on a non-TLS internal port in production env configs, blocking thread execution.',
      suggestedFix: 'Revert redis config ssl flag or ensure REDIS_TLS_ENABLED env var matches internal cluster secret setup.',
      affectedComponents: ['User Auth Service', 'Token Generation Endpoint', 'Redis Session Cache'],
      riskAssessment: 'Low residual risk. Automated rollback reinstated v2.3.9 stable release in <18 seconds with zero customer impact on 90% primary traffic.',
      postmortemDraft: 'Incident Inc-3021: At 18:12 UTC, canary deployment of user-auth-api commit e41a90b triggered 14.8% HTTP 500 errors due to Redis SSL handshake timeout. Guardrail GR-01 detected error spike and automatically triggered zero-downtime rollback to v2.3.9 within 18s. No user data was lost.'
    }
  }
];

let guardrails: GuardrailRule[] = [
  {
    id: 'GR-01',
    name: 'Canary 5xx Error Rate Safeguard',
    metric: 'error_rate',
    operator: '>',
    threshold: 5.0,
    unit: '%',
    action: 'auto_rollback',
    enabled: true,
    evaluationWindowSeconds: 60,
    description: 'Triggers instant automated rollback if canary deployment exceeds 5% HTTP 5xx error threshold.'
  },
  {
    id: 'GR-02',
    name: 'P99 Latency Guard',
    metric: 'latency_p99',
    operator: '>',
    threshold: 800,
    unit: 'ms',
    action: 'notify_slack_critical',
    enabled: true,
    evaluationWindowSeconds: 120,
    description: 'Alerts Slack #devops-incidents if 99th percentile response latency spikes above 800ms during canary.'
  },
  {
    id: 'GR-03',
    name: 'Synthetic Health Probe Check',
    metric: 'health_check_status',
    operator: '==',
    threshold: 0,
    unit: 'health',
    action: 'auto_rollback',
    enabled: true,
    evaluationWindowSeconds: 30,
    description: 'Immediately rolls back deployment if /healthz endpoint fails 3 consecutive HTTP status probes.'
  },
  {
    id: 'GR-04',
    name: 'Pod CPU Spike Limit',
    metric: 'cpu_usage',
    operator: '>',
    threshold: 90,
    unit: '%',
    action: 'pause_pipeline',
    enabled: false,
    evaluationWindowSeconds: 180,
    description: 'Pauses canary rollout and requires engineer confirmation if CPU usage hits 90%.'
  }
];

let slackMessages: SlackMessage[] = [
  {
    id: 'msg-101',
    type: 'pipeline_succeeded',
    channel: '#deployments',
    botName: 'GitHub-Deploy Sentinel',
    title: '✅ Pipeline #8492 Succeeded',
    message: '*acme-corp/payment-service* branch `main` successfully deployed to *production* (commit `7f9c2d1`). All 6 pipeline stages passed.',
    timestamp: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    delivered: true,
    severity: 'low',
  },
  {
    id: 'msg-102',
    type: 'guardrail_triggered',
    channel: '#devops-incidents',
    botName: 'Sentinel Guardrail Engine',
    title: '🚨 Guardrail GR-01 Tripped: Canary Error Spike (14.8%)',
    message: 'Canary deployment for *acme-corp/user-auth-api* commit `e41a90b` exceeded error threshold. Executing automated zero-downtime rollback to v2.3.9.',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    delivered: true,
    severity: 'critical',
    actions: [
      { label: 'View Incident Inc-3021', actionId: 'view_incident', style: 'primary' },
      { label: 'Inspect AI RCA Report', actionId: 'view_rca', style: 'default' },
    ]
  },
  {
    id: 'msg-103',
    type: 'auto_rollback_executed',
    channel: '#devops-incidents',
    botName: 'GitHub-Deploy Sentinel',
    title: '🔄 Automated Rollback Completed Successfully',
    message: '*acme-corp/user-auth-api* environment *production* safely restored to stable tag `v2.3.9` (commit `a1b82c3`) in 18 seconds. Zero downtime experienced.',
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    delivered: true,
    severity: 'high',
  }
];

let webhookLogs: WebhookEventLog[] = [
  {
    id: 'wh-901',
    source: 'github',
    eventType: 'push',
    receivedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    payload: {
      repository: 'acme-corp/user-auth-api',
      ref: 'refs/heads/release/v2.4',
      commit: 'e41a90b',
      pusher: 'arivera-dev'
    },
    responseStatus: 200,
    processedAction: 'Triggered CI/CD Pipeline pipe-8493'
  },
  {
    id: 'wh-902',
    source: 'slack',
    eventType: 'slash_command',
    receivedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    payload: {
      command: '/sentinel-status',
      user_name: 'sarah.chen',
      channel_name: 'devops-incidents'
    },
    responseStatus: 200,
    processedAction: 'Responded with live pipeline status overview'
  }
];

// --- Helper Functions ---

const dispatchSlackMessage = async (msg: Omit<SlackMessage, 'id' | 'timestamp' | 'delivered'>) => {
  const newMsg: SlackMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    delivered: true,
  };
  slackMessages.unshift(newMsg);

  // If real SLACK_WEBHOOK_URL is set, attempt HTTP POST
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*${newMsg.title}*\n${newMsg.message}`,
        }),
      });
    } catch (e) {
      console.error('Failed sending to real Slack webhook:', e);
    }
  }

  return newMsg;
};

// --- API ROUTES ---

// 1. Get all pipelines
app.get('/api/pipelines', (req, res) => {
  res.json({ success: true, pipelines });
});

// 2. Trigger new pipeline
app.post('/api/pipelines/trigger', async (req, res) => {
  const { repo, branch, commitMessage, author, environment } = req.body;
  
  const newPipe: PipelineRun = {
    id: `pipe-${Math.floor(1000 + Math.random() * 9000)}`,
    repo: repo || 'acme-corp/microservice-core',
    branch: branch || 'main',
    commitHash: Math.random().toString(16).substring(2, 9),
    commitMessage: commitMessage || 'feat(core): update service deployment manifest',
    author: author || 'Dev Automation Bot',
    status: 'running',
    environment: environment || 'canary',
    startedAt: new Date().toISOString(),
    stages: [
      { id: 'stg-1', name: 'Lint & Code Quality', status: 'running', durationMs: 2000 },
      { id: 'stg-2', name: 'Unit & E2E Test Suite', status: 'pending' },
      { id: 'stg-3', name: 'Container Artifact Build', status: 'pending' },
      { id: 'stg-4', name: 'Canary Deployment (10%)', status: 'pending' },
      { id: 'stg-5', name: 'Prometheus Guardrail Gate', status: 'pending' },
    ]
  };

  pipelines.unshift(newPipe);

  // Dispatch Slack notification
  await dispatchSlackMessage({
    type: 'pipeline_succeeded',
    channel: '#deployments',
    botName: 'GitHub-Deploy Sentinel',
    title: `🚀 CI/CD Pipeline #${newPipe.id} Dispatched`,
    message: `Triggered pipeline for *${newPipe.repo}* (${newPipe.branch}) - "${newPipe.commitMessage}" by ${newPipe.author}`,
    severity: 'low',
  });

  res.json({ success: true, pipeline: newPipe });
});

// 3. Rollback pipeline
app.post('/api/pipelines/:id/rollback', async (req, res) => {
  const { id } = req.params;
  const { reason, triggeredBy } = req.body;

  const pipe = pipelines.find(p => p.id === id);
  if (!pipe) {
    return res.status(404).json({ success: false, message: 'Pipeline not found' });
  }

  const rollbackTarget = 'v' + (Math.floor(Math.random() * 5) + 1) + '.' + Math.floor(Math.random() * 9) + '.0';

  pipe.status = 'rolled_back';
  pipe.rollbackTriggeredBy = triggeredBy || 'manual_user';
  pipe.rollbackTargetCommit = rollbackTarget;
  pipe.rollbackCompletedAt = new Date().toISOString();
  pipe.completedAt = new Date().toISOString();

  // Create or update associated incident
  let inc = incidents.find(i => i.pipelineRunId === id);
  if (!inc) {
    inc = {
      id: `inc-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Rollback Triggered for ${pipe.repo}`,
      severity: 'high',
      status: 'rolled_back',
      pipelineRunId: pipe.id,
      repo: pipe.repo,
      commitHash: pipe.commitHash,
      environment: pipe.environment,
      errorSummary: reason || pipe.failureReason || 'Manual or Guardrail triggered rollback execution.',
      slackChannel: '#devops-incidents',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
      automatedRollbackExecuted: triggeredBy === 'automated_guardrail',
    };
    incidents.unshift(inc);
  } else {
    inc.status = 'rolled_back';
    inc.automatedRollbackExecuted = triggeredBy === 'automated_guardrail';
    inc.resolvedAt = new Date().toISOString();
  }

  // Post Slack confirmation
  await dispatchSlackMessage({
    type: 'auto_rollback_executed',
    channel: '#devops-incidents',
    botName: 'Sentinel Rollback Engine',
    title: `🔄 Rollback Executed for ${pipe.repo}`,
    message: `Pipeline *${pipe.id}* rolled back to stable release *${rollbackTarget}*. Reason: ${reason || 'Triggered via Sentinel Control Panel'}`,
    severity: 'high',
  });

  res.json({ success: true, pipeline: pipe, incident: inc });
});

// 4. Retry pipeline
app.post('/api/pipelines/:id/retry', async (req, res) => {
  const { id } = req.params;
  const pipe = pipelines.find(p => p.id === id);
  if (!pipe) {
    return res.status(404).json({ success: false, message: 'Pipeline not found' });
  }

  pipe.status = 'running';
  pipe.failureReason = undefined;
  pipe.failureLogSnippet = undefined;
  pipe.startedAt = new Date().toISOString();
  pipe.stages = pipe.stages.map((s, idx) => ({
    ...s,
    status: idx === 0 ? 'running' : 'pending',
    logs: undefined
  }));

  res.json({ success: true, pipeline: pipe });
});

// 5. Get incidents
app.get('/api/incidents', (req, res) => {
  res.json({ success: true, incidents });
});

// 6. AI Root Cause Analysis via Gemini API
app.post('/api/incidents/:id/ai-diagnose', async (req, res) => {
  const { id } = req.params;
  const incident = incidents.find(i => i.id === id);
  const pipeline = incident ? pipelines.find(p => p.id === incident.pipelineRunId) : null;

  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Fallback response if GEMINI_API_KEY is not present or failed
    const fallbackRCA = {
      summary: `Automated diagnostic for ${incident.repo} commit ${incident.commitHash}.`,
      probableCause: `Connection / configuration mismatch during ${incident.environment} canary rollout. Error: ${incident.errorSummary}`,
      suggestedFix: `1. Revert recent environment variables change in production config.\n2. Verify network timeout & connection pool parameters.\n3. Re-run staging integration test suite before next deploy.`,
      affectedComponents: [incident.repo, 'API Gateway', 'Connection Pool Cache'],
      riskAssessment: 'Low risk. Environment was safely rolled back.',
      postmortemDraft: `Postmortem Inc-${incident.id}: At ${new Date(incident.createdAt).toUTCString()}, ${incident.repo} deployment failed canary health checks. Sentinel guardrail isolated the cluster and completed automated zero-downtime rollback.`
    };
    incident.rootCauseAnalysis = fallbackRCA;
    return res.json({ success: true, rootCauseAnalysis: fallbackRCA, source: 'rule_engine_fallback' });
  }

  try {
    const prompt = `You are a Principal DevOps and Reliability Engineer AI Sentinel. Analyze the following incident details, pipeline logs, and stack trace to generate a comprehensive Root Cause Analysis (RCA) and Incident Postmortem.

Incident Details:
- ID: ${incident.id}
- Title: ${incident.title}
- Repository: ${incident.repo}
- Commit: ${incident.commitHash}
- Environment: ${incident.environment}
- Severity: ${incident.severity}
- Error Summary: ${incident.errorSummary}
- Stack Trace: ${incident.stackTrace || 'N/A'}
- Pipeline Logs Snippet: ${pipeline?.failureLogSnippet || 'N/A'}

Provide a structured analysis with the following fields:
1. summary: Brief 1-2 sentence executive summary of what happened.
2. probableCause: Concise technical explanation of the root cause.
3. suggestedFix: Concrete code or infrastructure fix recommendations.
4. affectedComponents: List of services or modules impacted.
5. riskAssessment: Operational risk evaluation and rollback safety status.
6. postmortemDraft: A concise, professional postmortem report draft ready for Slack or Markdown docs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            probableCause: { type: Type.STRING },
            suggestedFix: { type: Type.STRING },
            affectedComponents: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            riskAssessment: { type: Type.STRING },
            postmortemDraft: { type: Type.STRING }
          },
          required: ['summary', 'probableCause', 'suggestedFix', 'affectedComponents', 'riskAssessment', 'postmortemDraft']
        }
      }
    });

    const parsedRCA = JSON.parse(response.text || '{}');
    incident.rootCauseAnalysis = parsedRCA;

    res.json({ success: true, rootCauseAnalysis: parsedRCA, source: 'gemini_ai' });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    const fallbackRCA = {
      summary: `Automated diagnostic for ${incident.repo}.`,
      probableCause: `Anomalous latency and error spike detected during deployment. ${incident.errorSummary}`,
      suggestedFix: `Check environment credentials and verify dependent service health.`,
      affectedComponents: [incident.repo, 'Core Service Mesh'],
      riskAssessment: 'Controlled. Automated rollback completed.',
      postmortemDraft: `Incident ${incident.id} postmortem generated by Sentinel fallback guard.`
    };
    incident.rootCauseAnalysis = fallbackRCA;
    res.json({ success: true, rootCauseAnalysis: fallbackRCA, source: 'error_fallback' });
  }
});

// 7. Get and manage Guardrails
app.get('/api/guardrails', (req, res) => {
  res.json({ success: true, guardrails });
});

app.post('/api/guardrails', (req, res) => {
  const { name, metric, operator, threshold, unit, action, evaluationWindowSeconds, description } = req.body;
  const newRule: GuardrailRule = {
    id: `GR-${String(guardrails.length + 1).padStart(2, '0')}`,
    name: name || 'New Guardrail Rule',
    metric: metric || 'error_rate',
    operator: operator || '>',
    threshold: Number(threshold) || 5.0,
    unit: unit || '%',
    action: action || 'auto_rollback',
    enabled: true,
    evaluationWindowSeconds: Number(evaluationWindowSeconds) || 60,
    description: description || 'Custom metric evaluation safeguard.'
  };
  guardrails.push(newRule);
  res.json({ success: true, guardrail: newRule });
});

app.post('/api/guardrails/:id/toggle', (req, res) => {
  const { id } = req.params;
  const rule = guardrails.find(g => g.id === id);
  if (rule) {
    rule.enabled = !rule.enabled;
    res.json({ success: true, guardrail: rule });
  } else {
    res.status(404).json({ success: false, message: 'Guardrail not found' });
  }
});

// 8. Slack Messages & Webhooks
app.get('/api/slack/history', (req, res) => {
  res.json({ success: true, messages: slackMessages });
});

app.post('/api/slack/send', async (req, res) => {
  const { channel, title, message, severity } = req.body;
  const msg = await dispatchSlackMessage({
    type: 'incident_opened',
    channel: channel || '#devops-incidents',
    botName: 'Custom Sentinel Alert',
    title: title || 'Custom DevOps Notification',
    message: message || 'Notification dispatched manually via Sentinel.',
    severity: severity || 'medium',
  });
  res.json({ success: true, message: msg });
});

// 9. GitHub & Slack Webhook endpoints
app.post('/api/webhooks/github', async (req, res) => {
  const eventType = req.headers['x-github-event'] || req.body.event || 'push';
  const payload = req.body;

  const log: WebhookEventLog = {
    id: `wh-${Date.now()}`,
    source: 'github',
    eventType: String(eventType),
    receivedAt: new Date().toISOString(),
    payload,
    responseStatus: 200,
    processedAction: `Received GitHub ${eventType} payload`
  };

  // If push event or workflow dispatch, automatically spawn a pipeline
  if (eventType === 'push' || eventType === 'workflow_dispatch') {
    const repo = payload.repository?.full_name || payload.repo || 'acme-corp/api-gateway';
    const commitMsg = payload.head_commit?.message || payload.commitMessage || 'Merge pull request #104 from dev/feature-auth';
    
    const newPipe: PipelineRun = {
      id: `pipe-${Math.floor(1000 + Math.random() * 9000)}`,
      repo,
      branch: payload.ref?.replace('refs/heads/', '') || 'main',
      commitHash: payload.head_commit?.id?.substring(0, 7) || Math.random().toString(16).substring(2, 9),
      commitMessage: commitMsg,
      author: payload.pusher?.name || payload.sender?.login || 'github-webhook-trigger',
      status: 'running',
      environment: 'canary',
      startedAt: new Date().toISOString(),
      stages: [
        { id: 'stg-1', name: 'Lint & Type Check', status: 'success', durationMs: 4000 },
        { id: 'stg-2', name: 'Unit & Integration Tests', status: 'running', durationMs: 12000 },
        { id: 'stg-3', name: 'Container Artifact Build', status: 'pending' },
        { id: 'stg-4', name: 'Canary Rollout', status: 'pending' },
      ]
    };
    pipelines.unshift(newPipe);
    log.processedAction = `Triggered Pipeline ${newPipe.id} for ${repo}`;

    await dispatchSlackMessage({
      type: 'pipeline_succeeded',
      channel: '#deployments',
      botName: 'GitHub Webhook Sentinel',
      title: `⚡ GitHub Webhook: New Commit Pushed`,
      message: `Pushed to *${repo}* (\`${newPipe.branch}\`): "${commitMsg}". Pipeline *${newPipe.id}* initiated.`,
      severity: 'low',
    });
  }

  webhookLogs.unshift(log);
  res.json({ success: true, webhookLog: log });
});

app.post('/api/webhooks/slack', async (req, res) => {
  const { command, text, user_name } = req.body;
  const log: WebhookEventLog = {
    id: `wh-${Date.now()}`,
    source: 'slack',
    eventType: 'slash_command',
    receivedAt: new Date().toISOString(),
    payload: req.body,
    responseStatus: 200,
    processedAction: `Executed command ${command || '/sentinel'}`
  };
  webhookLogs.unshift(log);

  if (command === '/rollback' || text?.startsWith('rollback')) {
    const latestFailed = pipelines.find(p => p.status === 'failed' || p.status === 'running');
    if (latestFailed) {
      latestFailed.status = 'rolled_back';
      latestFailed.rollbackTriggeredBy = 'slack_command';
      latestFailed.rollbackTargetCommit = 'v2.3.9';
      latestFailed.rollbackCompletedAt = new Date().toISOString();

      await dispatchSlackMessage({
        type: 'auto_rollback_executed',
        channel: '#devops-incidents',
        botName: 'Slack Interactive Sentinel',
        title: `⚡ Slack Slash Command Executed by @${user_name || 'dev'}`,
        message: `Forced instant rollback on *${latestFailed.repo}* to stable version *v2.3.9*. Pipeline ${latestFailed.id} neutralized.`,
        severity: 'high'
      });

      return res.json({
        response_type: 'in_channel',
        text: `✅ Instant rollback executed for ${latestFailed.repo}. Restored to stable release v2.3.9.`
      });
    }
  }

  res.json({
    response_type: 'ephemeral',
    text: `🤖 Sentinel Bot: Received input "${text || command}". Operational status: ALL SYSTEMS GO. Active Guardrails: ${guardrails.filter(g => g.enabled).length}.`
  });
});

app.get('/api/webhooks/logs', (req, res) => {
  res.json({ success: true, logs: webhookLogs });
});

// 10. Live System Metrics endpoint
app.get('/api/metrics', (req, res) => {
  const points: SystemMetricPoint[] = [];
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    const time = new Date(now - i * 30 * 1000);
    const timeLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Create spike around 10 minutes ago to simulate the incident
    const isSpikePeriod = i >= 12 && i <= 15;
    const errorRatePercent = isSpikePeriod ? parseFloat((12.5 + Math.random() * 4).toFixed(1)) : parseFloat((0.2 + Math.random() * 0.4).toFixed(1));
    const latencyMs = isSpikePeriod ? Math.floor(750 + Math.random() * 300) : Math.floor(110 + Math.random() * 40);
    const cpuUsagePercent = isSpikePeriod ? Math.floor(82 + Math.random() * 12) : Math.floor(35 + Math.random() * 15);
    const healthStatus = isSpikePeriod ? 'CRITICAL' : 'HEALTHY';

    points.push({
      timestamp: time.toISOString(),
      timeLabel,
      errorRatePercent,
      latencyMs,
      cpuUsagePercent,
      healthStatus,
    });
  }

  res.json({ success: true, points });
});

// 11. Failure Simulation Trigger
app.post('/api/simulate-failure', async (req, res) => {
  const { scenario } = req.body; // 'canary_db_fail' | 'memory_leak' | 'syntax_error'

  let targetRepo = 'acme-corp/billing-service';
  let errorReason = 'Canary Health Probe Failed: HTTP 500 Database Migration Lock Timeout';
  let logSnippet = `[FATAL] 2026-07-21T18:22:10Z [billing-db] Table lock timeout on "invoices" migration #2026072101\n[CRITICAL] Error rate spiked to 18.4% (> 5% guardrail limit)\n[SENTINEL] Guardrail GR-01 TRIPPED -> Executing automated rollback to tag v1.9.4`;

  if (scenario === 'memory_leak') {
    targetRepo = 'acme-corp/analytics-processor';
    errorReason = 'Out of Memory Exception: Node.js heap limit exceeded in worker thread #4';
    logSnippet = `[FATAL] FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory\n[CRITICAL] Pod restarted 5 times in 60s. Health probe failing.\n[SENTINEL] Guardrail GR-03 TRIPPED -> Executing automated rollback to v3.1.2`;
  } else if (scenario === 'syntax_error') {
    targetRepo = 'acme-corp/frontend-edge';
    errorReason = 'SyntaxError: Unexpected token \':\' at dist/server.mjs:144';
    logSnippet = `[BUILD ERROR] Failed to parse ES Module bundle at runtime.\n[SENTINEL] Build stage failed. Alerting developer on Slack & halting deployment pipeline.`;
  }

  const failedPipe: PipelineRun = {
    id: `pipe-${Math.floor(1000 + Math.random() * 9000)}`,
    repo: targetRepo,
    branch: 'main',
    commitHash: Math.random().toString(16).substring(2, 9),
    commitMessage: `feat: deploy ${scenario} updates`,
    author: 'CI Automated Release Manager',
    status: 'rolled_back',
    environment: 'production',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationSeconds: 45,
    failureReason: errorReason,
    failureLogSnippet: logSnippet,
    rollbackTriggeredBy: 'automated_guardrail',
    rollbackTargetCommit: 'v1.9.4',
    rollbackCompletedAt: new Date().toISOString(),
    stages: [
      { id: 's1', name: 'Lint & Type Check', status: 'success', durationMs: 8000 },
      { id: 's2', name: 'Build Container', status: 'success', durationMs: 25000 },
      { id: 's3', name: 'Canary Deploy (10%)', status: 'failed', durationMs: 12000, logs: [logSnippet] },
      { id: 's4', name: 'Automated Rollback Engine', status: 'success', durationMs: 5000, logs: ['Traffic reverted to v1.9.4 in 4.2 seconds'] },
    ]
  };

  pipelines.unshift(failedPipe);

  const newInc: Incident = {
    id: `inc-${Math.floor(1000 + Math.random() * 9000)}`,
    title: `[AUTOMATED SIMULATION] ${scenario.toUpperCase()} Failure on ${targetRepo}`,
    severity: 'critical',
    status: 'rolled_back',
    pipelineRunId: failedPipe.id,
    repo: targetRepo,
    commitHash: failedPipe.commitHash,
    environment: 'production-canary',
    errorSummary: errorReason,
    stackTrace: logSnippet,
    slackChannel: '#devops-incidents',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
    automatedRollbackExecuted: true,
  };

  incidents.unshift(newInc);

  // Dispatch real-time Slack alerts
  await dispatchSlackMessage({
    type: 'guardrail_triggered',
    channel: '#devops-incidents',
    botName: 'Sentinel Guardrail Engine',
    title: `🚨 CRITICAL ALERT: ${scenario.toUpperCase()} Failure Detected on ${targetRepo}`,
    message: `*Pipeline ${failedPipe.id}* failed canary gate: _${errorReason}_\n*Automated Guardrail GR-01* executed zero-downtime rollback to \`v1.9.4\` in 4.2 seconds.`,
    severity: 'critical',
  });

  res.json({
    success: true,
    message: 'Simulation executed successfully',
    pipeline: failedPipe,
    incident: newInc
  });
});

// --- VITE / STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DevOps Sentinel Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
