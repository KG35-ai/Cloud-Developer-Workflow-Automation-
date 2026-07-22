import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  User,
  Clock,
  RotateCcw,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { PipelineRun, PipelineStage } from '../types';

interface PipelineDashboardProps {
  pipelines: PipelineRun[];
  onRollback: (pipelineId: string, reason: string) => void;
  onRetry: (pipelineId: string) => void;
  onOpenAIDiagnostic: (pipelineRunId: string) => void;
}

export const PipelineDashboard: React.FC<PipelineDashboardProps> = ({
  pipelines,
  onRollback,
  onRetry,
  onOpenAIDiagnostic,
}) => {
  const [filter, setFilter] = useState<'all' | 'failed' | 'rolled_back' | 'running' | 'success'>('all');
  const [selectedPipelineLogs, setSelectedPipelineLogs] = useState<PipelineRun | null>(null);
  const [rollbackReasonInput, setRollbackReasonInput] = useState<{ [key: string]: string }>({});

  const filteredPipelines = pipelines.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusBadge = (status: PipelineRun['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" />
            Succeeded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />
            Failed
          </span>
        );
      case 'rolled_back':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Rolled Back
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-600 animate-spin" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            Pending
          </span>
        );
    }
  };

  const getStageIcon = (status: PipelineStage['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'skipped':
        return <span className="w-4 h-4 text-gray-400 text-xs text-center font-mono">—</span>;
      default:
        return <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total CI/CD Runs</span>
            <span className="p-2 bg-gray-100 text-black rounded-lg">
              <GitBranch className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-light text-gray-900">{pipelines.length}</div>
          <div className="mt-1 text-xs text-gray-500 font-mono">Active monitoring on main & releases</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Automated Rollbacks</span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-light text-amber-800">
            {pipelines.filter((p) => p.status === 'rolled_back').length}
          </div>
          <div className="mt-1 text-xs text-green-700 flex items-center font-medium">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
            100% Zero Downtime Mitigations
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Successful Rollouts</span>
            <span className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-light text-green-700">
            {pipelines.filter((p) => p.status === 'success').length}
          </div>
          <div className="mt-1 text-xs text-gray-500 font-mono">All tests & health gates verified</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Guardrails</span>
            <span className="p-2 bg-gray-100 text-gray-900 rounded-lg border border-gray-200">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-light text-gray-900">4 Rules</div>
          <div className="mt-1 text-xs text-gray-500 font-mono">Real-time telemetry evaluation</div>
        </div>
      </div>

      {/* Filter and Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">CI/CD Pipeline Stream</h2>
          <p className="text-xs text-gray-500">
            Live deployment pipeline statuses, canary health checks, and automated rollback actions
          </p>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'running', 'failed', 'rolled_back', 'success'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                filter === st
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              {st === 'rolled_back' ? 'Rolled Back' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Pipelines List */}
      <div className="space-y-4">
        {filteredPipelines.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 font-mono text-xs">
            No pipeline runs found matching the filter "{filter}".
          </div>
        ) : (
          filteredPipelines.map((pipe) => (
            <div
              key={pipe.id}
              className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
                pipe.status === 'failed'
                  ? 'border-red-200 bg-red-50/20'
                  : pipe.status === 'rolled_back'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Header Info */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-lg bg-black text-white shrink-0 mt-0.5">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-bold text-gray-900 text-base">{pipe.repo}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-gray-100 text-gray-700 border border-gray-200">
                        {pipe.branch}
                      </span>
                      {getStatusBadge(pipe.status)}
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-800 border border-gray-200 uppercase">
                        {pipe.environment}
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 mt-1 flex items-center gap-1.5 font-medium">
                      <GitCommit className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{pipe.commitMessage}</span>
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{pipe.commitHash}
                      </span>
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2 font-mono">
                      <span className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {pipe.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {new Date(pipe.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {pipe.durationSeconds && (
                        <span>Duration: {pipe.durationSeconds}s</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center flex-wrap gap-2 self-start lg:self-center">
                  {(pipe.status === 'failed' || pipe.status === 'rolled_back') && (
                    <button
                      onClick={() => onOpenAIDiagnostic(pipe.id)}
                      className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1 text-yellow-300" />
                      AI Root Cause (Gemini)
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedPipelineLogs(pipe)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded text-xs font-semibold flex items-center transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 mr-1 text-gray-500" />
                    Inspect Logs
                  </button>

                  {pipe.status === 'running' && (
                    <button
                      onClick={() => onRollback(pipe.id, 'Manual override rollback during execution')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center transition-colors shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Force Rollback
                    </button>
                  )}

                  {pipe.status === 'failed' && (
                    <button
                      onClick={() => onRollback(pipe.id, 'User manual zero-downtime rollback command')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center transition-colors shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Rollback to Healthy
                    </button>
                  )}

                  {(pipe.status === 'failed' || pipe.status === 'rolled_back') && (
                    <button
                      onClick={() => onRetry(pipe.id)}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Re-run Pipeline
                    </button>
                  )}
                </div>
              </div>

              {/* Stage Progress Tracker */}
              <div className="mt-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pipeline Execution Stages</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {pipe.stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                        stage.status === 'success'
                          ? 'bg-green-50/50 border-green-200 text-green-900'
                          : stage.status === 'failed'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : stage.status === 'running'
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-gray-400">0{idx + 1}</span>
                        {getStageIcon(stage.status)}
                      </div>
                      <div className="font-semibold truncate text-gray-900">{stage.name}</div>
                      {stage.durationMs && (
                        <div className="text-[10px] font-mono text-gray-500 mt-1">{(stage.durationMs / 1000).toFixed(1)}s</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Failure / Rollback Banner if applicable */}
              {pipe.failureReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-red-900 uppercase tracking-wider text-[11px]">Failure Trigger: </strong>
                    <span>{pipe.failureReason}</span>
                    {pipe.rollbackTargetCommit && (
                      <div className="mt-1 text-green-800 font-mono text-[11px] flex items-center font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
                        Automated Sentinel Rollback Safely Executed → Restored stable commit #{pipe.rollbackTargetCommit}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Logs Inspection Modal */}
      {selectedPipelineLogs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-gray-900" />
                <h3 className="text-base font-bold text-gray-900">
                  Console Logs — {selectedPipelineLogs.repo} ({selectedPipelineLogs.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedPipelineLogs(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs space-y-2 bg-[#141414] text-green-400 flex-1 min-h-[300px]">
              <div className="opacity-50">
                [INIT] Dispatching CI/CD runner container for commit {selectedPipelineLogs.commitHash}...
              </div>

              {selectedPipelineLogs.stages.map((stage) => (
                <div key={stage.id} className="space-y-1">
                  <div className="text-blue-400 font-semibold border-b border-gray-800 pb-0.5 pt-2">
                    === Stage: {stage.name} [{stage.status.toUpperCase()}] ===
                  </div>
                  {stage.logs && stage.logs.length > 0 ? (
                    stage.logs.map((logLine, idx) => (
                      <div
                        key={idx}
                        className={
                          logLine.includes('ERROR') || logLine.includes('FATAL')
                            ? 'text-red-400 font-bold bg-red-950/40 p-1 rounded'
                            : logLine.includes('TRIPPED') || logLine.includes('Rollback')
                            ? 'text-yellow-300 font-semibold bg-amber-950/40 p-1 rounded'
                            : 'text-gray-300'
                        }
                      >
                        {logLine}
                      </div>
                    ))
                  ) : (
                    <div className="opacity-40 pl-2">Logs verified successfully. Duration: {stage.durationMs ? `${stage.durationMs}ms` : 'completed'}</div>
                  )}
                </div>
              ))}

              {selectedPipelineLogs.failureLogSnippet && (
                <div className="mt-4 p-3 bg-red-950/60 border border-red-700 rounded text-red-200">
                  <div className="font-bold text-red-400 mb-1">CRITICAL FAILURE STACK TRACE:</div>
                  <pre className="whitespace-pre-wrap font-mono text-xs">{selectedPipelineLogs.failureLogSnippet}</pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <span className="text-xs text-gray-600 font-mono">
                Status: <strong className="text-black uppercase">{selectedPipelineLogs.status}</strong>
              </span>
              <button
                onClick={() => setSelectedPipelineLogs(null)}
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded text-xs font-semibold uppercase tracking-wider"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
