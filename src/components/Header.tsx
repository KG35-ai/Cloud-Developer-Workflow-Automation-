import React from 'react';
import {
  ShieldAlert,
  GitPullRequest,
  MessageSquare,
  Activity,
  Play,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Bot
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'pipelines' | 'incidents' | 'guardrails' | 'slack' | 'webhooks' | 'metrics';
  setActiveTab: (tab: 'pipelines' | 'incidents' | 'guardrails' | 'slack' | 'webhooks' | 'metrics') => void;
  onTriggerSimulation: () => void;
  onTriggerPipeline: () => void;
  incidentsCount: number;
  slackWebhookConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onTriggerSimulation,
  onTriggerPipeline,
  incidentsCount,
  slackWebhookConfigured,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* Top Utility Banner */}
      <div className="bg-gray-50 px-4 py-1.5 border-b border-gray-200 text-xs text-gray-600 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
            Sentinel: NOMINAL
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="flex items-center text-gray-700 font-medium">
            <Bot className="w-3.5 h-3.5 mr-1 text-gray-900" />
            AI Diagnostics: <strong className="ml-1 text-black font-semibold">Gemini 3.6 Flash</strong>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="flex items-center text-gray-700">
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-gray-800" />
            Slack Bot: {slackWebhookConfigured ? (
              <span className="text-green-700 ml-1 font-semibold">Connected Webhook</span>
            ) : (
              <span className="text-amber-700 ml-1 font-semibold">Interactive Simulator</span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onTriggerPipeline}
            className="px-3 py-1 bg-black hover:bg-gray-800 text-white rounded font-medium text-xs flex items-center transition-colors uppercase tracking-wider shadow-xs"
          >
            <Play className="w-3 h-3 mr-1" />
            Dispatch Pipeline
          </button>
          <button
            onClick={onTriggerSimulation}
            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-semibold text-xs flex items-center transition-colors uppercase tracking-wider"
          >
            <Zap className="w-3 h-3 mr-1 text-red-600" />
            Simulate Canary Failure
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center shrink-0">
              <div className="w-4 h-4 border-2 border-white rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">NEBULA OS</h1>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded">
                  DEVOPS SENTINEL
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">
                PROD-ENVIRONMENT / CANARY-CLUSTER-01
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <button
              onClick={() => setActiveTab('pipelines')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'pipelines'
                  ? 'text-black border-b-2 border-black font-bold pb-2'
                  : 'text-gray-500 hover:text-black transition-colors'
              }`}
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Pipelines</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 relative ${
                activeTab === 'incidents'
                  ? 'text-black border-b-2 border-black font-bold pb-2'
                  : 'text-gray-500 hover:text-black transition-colors'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Incidents</span>
              {incidentsCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {incidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('guardrails')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'guardrails'
                  ? 'text-black border-b-2 border-black font-bold pb-2'
                  : 'text-gray-500 hover:text-black transition-colors'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Guardrails</span>
            </button>

            <button
              onClick={() => setActiveTab('slack')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'slack'
                  ? 'text-black border-b-2 border-black font-bold pb-2'
                  : 'text-gray-500 hover:text-black transition-colors'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Slack Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'metrics'
                  ? 'text-black border-b-2 border-black font-bold pb-2'
                  : 'text-gray-500 hover:text-black transition-colors'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'webhooks'
                  ? 'text-black border-b-2 border-black font-bold pb-2'
                  : 'text-gray-500 hover:text-black transition-colors'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">Webhooks</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
