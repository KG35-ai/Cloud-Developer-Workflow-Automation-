import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Zap,
  ExternalLink,
  Lock,
  Hash
} from 'lucide-react';
import { SlackMessage } from '../types';

interface SlackAlertsRoomProps {
  messages: SlackMessage[];
  onSendMessage: (channel: string, title: string, message: string, severity?: string) => Promise<void>;
  slackWebhookConfigured: boolean;
}

export const SlackAlertsRoom: React.FC<SlackAlertsRoomProps> = ({
  messages,
  onSendMessage,
  slackWebhookConfigured,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('#devops-incidents');
  const [titleInput, setTitleInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [severityInput, setSeverityInput] = useState<string>('high');
  const [isSending, setIsSending] = useState(false);

  const filteredMessages = messages.filter((m) => m.channel === selectedChannel);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(
        selectedChannel,
        titleInput || 'Manual Sentinel Alert',
        messageInput,
        severityInput
      );
      setTitleInput('');
      setMessageInput('');
    } finally {
      setIsSending(false);
    }
  };

  const getMessageIcon = (type: SlackMessage['type']) => {
    switch (type) {
      case 'guardrail_triggered':
      case 'incident_opened':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'auto_rollback_executed':
        return <RotateCcw className="w-5 h-5 text-amber-600" />;
      case 'pipeline_succeeded':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return <Bot className="w-5 h-5 text-gray-900" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Slack Incident & CI/CD Notification Dispatcher</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time alert channels, interactive bot messages, and automated rollback status notifications
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {slackWebhookConfigured ? (
            <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" />
              SLACK_WEBHOOK_URL Active (Posting to Live Slack)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center font-semibold">
              <Bot className="w-4 h-4 mr-1.5 text-amber-600" />
              Interactive Slack Simulator (Set SLACK_WEBHOOK_URL in .env)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Channel Navigation */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Slack Channels</h3>

          <div className="space-y-1">
            {['#devops-incidents', '#deployments', '#guardrail-alerts'].map((channel) => (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  selectedChannel === channel
                    ? 'bg-black text-white border border-black shadow-xs'
                    : 'bg-white text-gray-600 hover:text-black hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="flex items-center">
                  <Hash className="w-4 h-4 mr-2 opacity-70" />
                  {channel}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  selectedChannel === channel ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {messages.filter((m) => m.channel === channel).length}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Alert Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 mt-6 shadow-xs">
            <h4 className="text-xs font-bold text-gray-900 flex items-center uppercase tracking-wider">
              <Send className="w-3.5 h-3.5 mr-1.5 text-gray-900" />
              Dispatch Custom Slack Alert
            </h4>

            <form onSubmit={handleSend} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Alert Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Canary Memory Spike Alert"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Severity Level</label>
                <select
                  value={severityInput}
                  onChange={(e) => setSeverityInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-black font-medium"
                >
                  <option value="critical">Critical (Red)</option>
                  <option value="high">High (Amber)</option>
                  <option value="medium">Medium (Sky)</option>
                  <option value="low">Low (Gray)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter alert message details..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {isSending ? 'Dispatching...' : `Dispatch to ${selectedChannel}`}
              </button>
            </form>
          </div>
        </div>

        {/* Live Channel Stream */}
        <div className="lg:col-span-9 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center space-x-2">
              <Hash className="w-5 h-5 text-gray-900" />
              <h3 className="text-base font-bold text-gray-900">{selectedChannel} Feed</h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              Bot ID: <strong className="text-gray-900">B0881_SENTINEL</strong>
            </span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs font-mono">
                No messages posted to {selectedChannel} yet.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border transition-all ${
                    msg.severity === 'critical'
                      ? 'bg-red-50/50 border-red-200'
                      : msg.severity === 'high'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-gray-50/80 border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-gray-100 border border-gray-200 shrink-0">
                      {getMessageIcon(msg.type)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900">{msg.botName}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded uppercase font-bold border border-gray-200">
                            APP
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 mt-1">{msg.title}</h4>
                      <div className="text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex items-center space-x-2 pt-2 mt-2 border-t border-gray-200">
                          {msg.actions.map((act) => (
                            <button
                              key={act.actionId}
                              className="px-3 py-1 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition-colors uppercase tracking-wider"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
