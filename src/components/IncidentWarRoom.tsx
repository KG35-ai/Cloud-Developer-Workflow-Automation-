import React, { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  Bot,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { Incident } from '../types';

interface IncidentWarRoomProps {
  incidents: Incident[];
  onDiagnoseWithAI: (incidentId: string) => Promise<void>;
  onResolveIncident: (incidentId: string) => void;
  selectedIncidentId?: string | null;
}

export const IncidentWarRoom: React.FC<IncidentWarRoomProps> = ({
  incidents,
  onDiagnoseWithAI,
  onResolveIncident,
  selectedIncidentId,
}) => {
  const [activeIncidentId, setActiveIncidentId] = useState<string>(
    selectedIncidentId || (incidents.length > 0 ? incidents[0].id : '')
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const currentIncident = incidents.find((i) => i.id === activeIncidentId) || incidents[0];

  const handleAIDiagnoseClick = async (id: string) => {
    setIsDiagnosing(true);
    try {
      await onDiagnoseWithAI(id);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const getSeverityBadge = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">MEDIUM</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Incident Command & AI Diagnostics War Room</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time incident response management, Slack alert threads, and Gemini AI Root Cause Analysis (RCA)
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-xs text-gray-600 flex items-center font-medium">
            <Bot className="w-4 h-4 text-gray-900 mr-1.5" />
            AI Diagnostics: <strong className="text-black ml-1 font-semibold">Gemini 3.6 Flash</strong>
          </span>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No Active Incidents Detected</h3>
          <p className="text-xs text-gray-500 mt-1">All CI/CD pipelines and production canary deployments are healthy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incidents Sidebar List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Incident Stream</h3>

            <div className="space-y-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setActiveIncidentId(inc.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    currentIncident?.id === inc.id
                      ? 'bg-gray-100 border-black shadow-xs font-semibold'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-900">{inc.id}</span>
                      {getSeverityBadge(inc.severity)}
                    </div>
                    {inc.status === 'rolled_back' ? (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Rolled Back
                      </span>
                    ) : (
                      <span className="text-[10px] text-green-700 font-semibold flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Resolved
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{inc.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{inc.errorSummary}</p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono mt-3 pt-2 border-t border-gray-100">
                    <span>{inc.repo}</span>
                    <span>{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Incident Command Board */}
          {currentIncident && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
                {/* Incident Detail Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
                        {currentIncident.id}
                      </span>
                      {getSeverityBadge(currentIncident.severity)}
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        Env: {currentIncident.environment}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{currentIncident.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      Repository: <strong className="text-gray-900">{currentIncident.repo}</strong> | Commit #{currentIncident.commitHash}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAIDiagnoseClick(currentIncident.id)}
                      disabled={isDiagnosing}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center transition-colors disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 mr-1.5 ${isDiagnosing ? 'animate-spin' : 'text-yellow-300'}`} />
                      {isDiagnosing ? 'Gemini AI Analyzing...' : 'Run AI Root Cause (Gemini)'}
                    </button>

                    {currentIncident.status !== 'resolved' && (
                      <button
                        onClick={() => onResolveIncident(currentIncident.id)}
                        className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold flex items-center"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Summary & Stack Trace */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                    <Terminal className="w-4 h-4 mr-1 text-gray-500" />
                    Error Summary & Stack Trace Snippet
                  </h4>
                  <div className="bg-[#141414] p-4 rounded-xl border border-gray-800 font-mono text-xs text-red-400 overflow-x-auto">
                    <div className="font-bold text-red-300 mb-1">{currentIncident.errorSummary}</div>
                    {currentIncident.stackTrace && (
                      <pre className="text-gray-300 mt-2 text-[11px] whitespace-pre-wrap">{currentIncident.stackTrace}</pre>
                    )}
                  </div>
                </div>

                {/* AI Root Cause Analysis Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-black text-white rounded">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Gemini AI Root Cause Analysis (RCA)</h4>
                    </div>
                    {currentIncident.rootCauseAnalysis && (
                      <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-mono font-semibold">
                        AI Diagnosis Verified
                      </span>
                    )}
                  </div>

                  {!currentIncident.rootCauseAnalysis ? (
                    <div className="text-center py-6 text-gray-500 space-y-3 font-mono text-xs">
                      <Sparkles className="w-8 h-8 text-black mx-auto animate-pulse" />
                      <p>
                        Click <strong className="text-black font-bold">"Run AI Root Cause (Gemini)"</strong> to analyze stack trace, commit diffs, and telemetry anomalies.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs text-gray-900">
                      {/* Executive Summary */}
                      <div>
                        <div className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1">Executive Summary</div>
                        <p className="text-gray-900 leading-relaxed bg-white p-3 rounded-lg border border-gray-200 font-medium">
                          {currentIncident.rootCauseAnalysis.summary}
                        </p>
                      </div>

                      {/* Technical Probable Cause */}
                      <div>
                        <div className="font-bold text-red-600 uppercase text-[10px] tracking-widest mb-1">Probable Technical Cause</div>
                        <p className="text-red-950 bg-red-50 border border-red-200 p-3 rounded-lg font-medium">
                          {currentIncident.rootCauseAnalysis.probableCause}
                        </p>
                      </div>

                      {/* Suggested Fix */}
                      <div>
                        <div className="font-bold text-green-700 uppercase text-[10px] tracking-widest mb-1">Recommended Code & Infra Fix</div>
                        <pre className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200 font-mono text-[11px] whitespace-pre-wrap">
                          {currentIncident.rootCauseAnalysis.suggestedFix}
                        </pre>
                      </div>

                      {/* Impacted Components & Risk */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1">Impacted Services</div>
                          <ul className="list-disc list-inside space-y-1 text-gray-800 font-medium">
                            {currentIncident.rootCauseAnalysis.affectedComponents?.map((comp, idx) => (
                              <li key={idx}>{comp}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1">Rollback Safety & Risk Assessment</div>
                          <p className="text-gray-800 text-[11px] font-medium">
                            {currentIncident.rootCauseAnalysis.riskAssessment}
                          </p>
                        </div>
                      </div>

                      {/* Postmortem Report Draft */}
                      <div>
                        <div className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1 flex items-center">
                          <FileText className="w-3.5 h-3.5 mr-1 text-gray-500" />
                          Generated Postmortem Draft (Ready for Slack)
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-gray-900 text-[11px] whitespace-pre-wrap">
                          {currentIncident.rootCauseAnalysis.postmortemDraft}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slack Thread Context */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-800" />
                    <span className="text-gray-700">
                      Dispatched to Slack Channel: <strong className="text-black">{currentIncident.slackChannel}</strong>
                    </span>
                  </div>
                  <span className="text-gray-500 font-mono">Thread ID: {currentIncident.slackThreadTs || 'ts_1721585'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
