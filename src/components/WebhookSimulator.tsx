import React, { useState } from 'react';
import {
  Zap,
  Code,
  Send,
  CheckCircle2,
  GitCommit,
  MessageSquare,
  RefreshCw,
  Terminal,
  Activity,
  Server
} from 'lucide-react';
import { WebhookEventLog } from '../types';

interface WebhookSimulatorProps {
  logs: WebhookEventLog[];
  onFireGitHubWebhook: (payload: any, eventType: string) => Promise<void>;
  onFireSlackWebhook: (command: string, text: string) => Promise<void>;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({
  logs,
  onFireGitHubWebhook,
  onFireSlackWebhook,
}) => {
  const [sourceTab, setSourceTab] = useState<'github' | 'slack'>('github');
  const [githubEventType, setGithubEventType] = useState('push');
  const [jsonPayload, setJsonPayload] = useState(
    JSON.stringify(
      {
        repository: { full_name: 'acme-corp/checkout-service' },
        ref: 'refs/heads/main',
        head_commit: {
          id: '8a91c3d',
          message: 'feat(checkout): add Apple Pay & Google Pay support',
        },
        pusher: { name: 'dev-alex' },
      },
      null,
      2
    )
  );

  const [slackCommand, setSlackCommand] = useState('/rollback');
  const [slackText, setSlackText] = useState('rollback acme-corp/checkout-service');
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsed = JSON.parse(jsonPayload);
      await onFireGitHubWebhook(parsed, githubEventType);
    } catch (err) {
      alert('Invalid JSON Payload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onFireSlackWebhook(slackCommand, slackText);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (preset: 'push' | 'pr_fail' | 'rollback' | 'status') => {
    if (preset === 'push') {
      setSourceTab('github');
      setGithubEventType('push');
      setJsonPayload(
        JSON.stringify(
          {
            repository: { full_name: 'acme-corp/user-auth-api' },
            ref: 'refs/heads/release/v2.5',
            head_commit: {
              id: 'c12d88f',
              message: 'fix(redis): patch connection leak under high load',
            },
            pusher: { name: 'sarah.chen' },
          },
          null,
          2
        )
      );
    } else if (preset === 'pr_fail') {
      setSourceTab('github');
      setGithubEventType('workflow_dispatch');
      setJsonPayload(
        JSON.stringify(
          {
            repository: { full_name: 'acme-corp/billing-service' },
            ref: 'refs/heads/canary',
            head_commit: {
              id: 'f90111a',
              message: 'feat(db): locked migration script update',
            },
            pusher: { name: 'ci-runner' },
          },
          null,
          2
        )
      );
    } else if (preset === 'rollback') {
      setSourceTab('slack');
      setSlackCommand('/rollback');
      setSlackText('acme-corp/user-auth-api');
    } else if (preset === 'status') {
      setSourceTab('slack');
      setSlackCommand('/sentinel-status');
      setSlackText('active-guardrails');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">GitHub & Slack Webhook Simulator</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Test real-world HTTP webhook endpoints (<code className="text-black font-mono font-bold">/api/webhooks/github</code> & <code className="text-black font-mono font-bold">/api/webhooks/slack</code>)
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => loadPreset('push')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold flex items-center transition-colors uppercase tracking-wider"
          >
            <GitCommit className="w-3.5 h-3.5 mr-1.5 text-gray-900" />
            GitHub Push
          </button>
          <button
            onClick={() => loadPreset('pr_fail')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold flex items-center transition-colors uppercase tracking-wider"
          >
            <Terminal className="w-3.5 h-3.5 mr-1.5 text-gray-900" />
            Workflow Event
          </button>
          <button
            onClick={() => loadPreset('rollback')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold flex items-center transition-colors uppercase tracking-wider"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-gray-900" />
            Slack /rollback
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulator Form */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setSourceTab('github')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider ${
                  sourceTab === 'github'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
                }`}
              >
                GitHub Event Webhook
              </button>
              <button
                onClick={() => setSourceTab('slack')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider ${
                  sourceTab === 'slack'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
                }`}
              >
                Slack Command Webhook
              </button>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">POST /api/webhooks/{sourceTab}</span>
          </div>

          {sourceTab === 'github' ? (
            <form onSubmit={handleGitHubSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  x-github-event Header
                </label>
                <select
                  value={githubEventType}
                  onChange={(e) => setGithubEventType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 font-mono focus:outline-none focus:border-black font-medium"
                >
                  <option value="push">push</option>
                  <option value="workflow_dispatch">workflow_dispatch</option>
                  <option value="pull_request">pull_request</option>
                  <option value="deployment_status">deployment_status</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  JSON Request Body
                </label>
                <textarea
                  rows={10}
                  required
                  value={jsonPayload}
                  onChange={(e) => setJsonPayload(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 font-mono text-xs focus:outline-none focus:border-black leading-relaxed font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Sending Webhook...' : 'Fire GitHub Webhook Event'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSlackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Slack Command Name
                </label>
                <input
                  type="text"
                  required
                  value={slackCommand}
                  onChange={(e) => setSlackCommand(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 font-mono focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Command Arguments / Text
                </label>
                <input
                  type="text"
                  required
                  value={slackText}
                  onChange={(e) => setSlackText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 font-mono focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-600 space-y-1">
                <div className="font-bold text-gray-900">Simulated Slack Payload:</div>
                <div className="font-mono text-black font-bold">
                  command: "{slackCommand}", text: "{slackText}", user_name: "sarah.chen"
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Executing...' : 'Fire Slack Command Webhook'}
              </button>
            </form>
          )}
        </div>

        {/* Live Webhook Audit Log */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-gray-900" />
              <h3 className="text-base font-bold text-gray-900">Live Webhook Receiver Log</h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">{logs.length} Requests Handled</span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 text-xs">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-mono">
                No webhooks received yet. Fire a payload from the left panel to test execution!
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 font-mono"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          log.source === 'github'
                            ? 'bg-gray-200 text-gray-900 border border-gray-300'
                            : 'bg-green-100 text-green-800 border border-green-300'
                        }`}
                      >
                        {log.source}
                      </span>
                      <span className="text-gray-900 font-bold">{log.eventType}</span>
                    </div>

                    <span className="text-green-800 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                      HTTP {log.responseStatus} OK
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-800 font-sans">
                    <strong className="text-black font-bold">Action: </strong>
                    {log.processedAction}
                  </div>

                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200 flex justify-between">
                    <span>ID: {log.id}</span>
                    <span>{new Date(log.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
