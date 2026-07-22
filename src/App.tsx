import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { PipelineDashboard } from './components/PipelineDashboard';
import { AutomatedRollbacks } from './components/AutomatedRollbacks';
import { IncidentWarRoom } from './components/IncidentWarRoom';
import { SlackAlertsRoom } from './components/SlackAlertsRoom';
import { WebhookSimulator } from './components/WebhookSimulator';
import { MetricsMonitor } from './components/MetricsMonitor';

import {
  PipelineRun,
  Incident,
  GuardrailRule,
  SlackMessage,
  WebhookEventLog,
  SystemMetricPoint,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'pipelines' | 'incidents' | 'guardrails' | 'slack' | 'webhooks' | 'metrics'
  >('pipelines');

  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailRule[]>([]);
  const [slackMessages, setSlackMessages] = useState<SlackMessage[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventLog[]>([]);
  const [metrics, setMetrics] = useState<SystemMetricPoint[]>([]);

  const [selectedIncidentForAI, setSelectedIncidentForAI] = useState<string | null>(null);
  const [slackWebhookConfigured, setSlackWebhookConfigured] = useState(false);

  // Fetch all data from Express backend
  const refreshAllData = async () => {
    try {
      const [pipeRes, incRes, guardRes, slackRes, whRes, metRes] = await Promise.all([
        fetch('/api/pipelines'),
        fetch('/api/incidents'),
        fetch('/api/guardrails'),
        fetch('/api/slack/history'),
        fetch('/api/webhooks/logs'),
        fetch('/api/metrics'),
      ]);

      const [pipeData, incData, guardData, slackData, whData, metData] = await Promise.all([
        pipeRes.json(),
        incRes.json(),
        guardRes.json(),
        slackRes.json(),
        whRes.json(),
        metRes.json(),
      ]);

      if (pipeData.success) setPipelines(pipeData.pipelines);
      if (incData.success) setIncidents(incData.incidents);
      if (guardData.success) setGuardrails(guardData.guardrails);
      if (slackData.success) setSlackMessages(slackData.messages);
      if (whData.success) setWebhookLogs(whData.logs);
      if (metData.success) setMetrics(metData.points);
    } catch (err) {
      console.error('Error fetching backend data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 10000); // Periodic live telemetry refresh
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleTriggerPipeline = async () => {
    try {
      const res = await fetch('/api/pipelines/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: 'acme-corp/payment-gateway',
          branch: 'main',
          commitMessage: 'feat(pay): add Apple Pay & Google Pay checkout pipeline',
          author: 'DevOps Automated Pipeline',
          environment: 'canary',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
        setActiveTab('pipelines');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRollback = async (pipelineId: string, reason: string) => {
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, triggeredBy: 'manual_user' }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetry = async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}/retry`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDiagnoseWithAI = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/ai-diagnose`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAIDiagnosticFromPipeline = async (pipelineRunId: string) => {
    let inc = incidents.find((i) => i.pipelineRunId === pipelineRunId);
    if (!inc) {
      // Create or locate incident
      const pipe = pipelines.find((p) => p.id === pipelineRunId);
      if (pipe) {
        await handleRollback(pipelineRunId, pipe.failureReason || 'Failed canary checks');
        await refreshAllData();
      }
    }
    const updatedInc = incidents.find((i) => i.pipelineRunId === pipelineRunId) || incidents[0];
    if (updatedInc) {
      setSelectedIncidentForAI(updatedInc.id);
      setActiveTab('incidents');
      await handleDiagnoseWithAI(updatedInc.id);
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      const res = await fetch(`/api/guardrails/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (rule: Omit<GuardrailRule, 'id'>) => {
    try {
      const res = await fetch('/api/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendSlackMessage = async (
    channel: string,
    title: string,
    message: string,
    severity?: string
  ) => {
    try {
      const res = await fetch('/api/slack/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, title, message, severity }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFireGitHubWebhook = async (payload: any, eventType: string) => {
    try {
      const res = await fetch('/api/webhooks/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-event': eventType,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFireSlackWebhook = async (command: string, text: string) => {
    try {
      const res = await fetch('/api/webhooks/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, text, user_name: 'dev-alex' }),
      });
      const data = await res.json();
      if (data) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateFailure = async () => {
    try {
      const res = await fetch('/api/simulate-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'canary_db_fail' }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
        setActiveTab('pipelines');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeIncidentsCount = incidents.filter(
    (i) => i.status === 'investigating' || i.status === 'rolled_back'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col font-sans selection:bg-black selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerSimulation={handleSimulateFailure}
        onTriggerPipeline={handleTriggerPipeline}
        incidentsCount={activeIncidentsCount}
        slackWebhookConfigured={slackWebhookConfigured}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {activeTab === 'pipelines' && (
          <PipelineDashboard
            pipelines={pipelines}
            onRollback={handleRollback}
            onRetry={handleRetry}
            onOpenAIDiagnostic={handleOpenAIDiagnosticFromPipeline}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentWarRoom
            incidents={incidents}
            onDiagnoseWithAI={handleDiagnoseWithAI}
            onResolveIncident={async (id) => {
              const inc = incidents.find((i) => i.id === id);
              if (inc) {
                inc.status = 'resolved';
                inc.resolvedAt = new Date().toISOString();
                setIncidents([...incidents]);
              }
            }}
            selectedIncidentId={selectedIncidentForAI}
          />
        )}

        {activeTab === 'guardrails' && (
          <AutomatedRollbacks
            guardrails={guardrails}
            onToggleRule={handleToggleRule}
            onCreateRule={handleCreateRule}
            onSimulateRollback={handleSimulateFailure}
          />
        )}

        {activeTab === 'slack' && (
          <SlackAlertsRoom
            messages={slackMessages}
            onSendMessage={handleSendSlackMessage}
            slackWebhookConfigured={slackWebhookConfigured}
          />
        )}

        {activeTab === 'metrics' && <MetricsMonitor metrics={metrics} />}

        {activeTab === 'webhooks' && (
          <WebhookSimulator
            logs={webhookLogs}
            onFireGitHubWebhook={handleFireGitHubWebhook}
            onFireSlackWebhook={handleFireSlackWebhook}
          />
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono">
          <div>
            NEBULA OS // DEVOPS SENTINEL & CI/CD WORKFLOW ENGINE
          </div>
          <div className="flex items-center space-x-4 text-gray-500">
            <span>EXPRESS + NODE.JS</span>
            <span>•</span>
            <span>GEMINI 3.6 FLASH</span>
            <span>•</span>
            <span>ZERO-DOWNTIME ROLLBACKS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
