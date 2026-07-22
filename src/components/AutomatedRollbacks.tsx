import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  RotateCcw,
  Plus,
  Sliders,
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { GuardrailRule } from '../types';

interface AutomatedRollbacksProps {
  guardrails: GuardrailRule[];
  onToggleRule: (id: string) => void;
  onCreateRule: (rule: Omit<GuardrailRule, 'id'>) => void;
  onSimulateRollback: () => void;
}

export const AutomatedRollbacks: React.FC<AutomatedRollbacksProps> = ({
  guardrails,
  onToggleRule,
  onCreateRule,
  onSimulateRollback,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [metric, setMetric] = useState<GuardrailRule['metric']>('error_rate');
  const [operator, setOperator] = useState<GuardrailRule['operator']>('>');
  const [threshold, setThreshold] = useState('5.0');
  const [unit, setUnit] = useState('%');
  const [action, setAction] = useState<GuardrailRule['action']>('auto_rollback');
  const [evaluationWindowSeconds, setEvaluationWindowSeconds] = useState('60');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRule({
      name: name || 'Custom Guardrail Safeguard',
      metric,
      operator,
      threshold: parseFloat(threshold) || 5,
      unit,
      action,
      enabled: true,
      evaluationWindowSeconds: parseInt(evaluationWindowSeconds) || 60,
      description: description || 'Automated canary telemetry safeguard.',
    });
    setShowAddModal(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Safeguard Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Automated Zero-Downtime Rollback Engine</h2>
            </div>
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              Sentinel continuously polls telemetry metrics during canary & production deployments. If an active guardrail threshold is breached, Sentinel halts the rollout, shifts 100% of live traffic back to the prior stable image, and posts a real-time incident report to Slack.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onSimulateRollback}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center transition-colors"
            >
              <Zap className="w-4 h-4 mr-1.5 text-red-600" />
              Trigger Test Rollback
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Guardrail Rule
            </button>
          </div>
        </div>

        {/* Workflow Visualizer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-1.5 text-gray-600" />
            Automated Rollback Circuit-Breaker Architecture
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
              <div className="text-gray-900 font-mono text-xs font-bold mb-1">STEP 1</div>
              <div className="text-xs font-bold text-gray-900">10% Canary Traffic</div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">Route commit to canary pods</div>
            </div>

            <div className="flex items-center justify-center hidden md:flex text-gray-400">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
              <div className="text-gray-900 font-mono text-xs font-bold mb-1">STEP 2</div>
              <div className="text-xs font-bold text-gray-900">Guardrail Probe</div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">Real-time telemetry checks</div>
            </div>

            <div className="flex items-center justify-center hidden md:flex text-gray-400">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <div className="text-amber-800 font-mono text-xs font-bold mb-1">STEP 3</div>
              <div className="text-xs font-bold text-amber-900">Zero-Downtime Rollback</div>
              <div className="text-[11px] text-amber-700 mt-1 font-mono">Instant traffic shift & Slack alert</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center tracking-tight">
              <Sliders className="w-5 h-5 mr-2 text-gray-900" />
              Active Guardrail Safety Policies
            </h3>
            <p className="text-xs text-gray-500">
              Automated actions execute immediately when conditions evaluate to true
            </p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-800 font-mono px-3 py-1 rounded-full border border-gray-200 font-bold">
            {guardrails.filter((g) => g.enabled).length} / {guardrails.length} Enabled
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {guardrails.map((rule) => (
            <div
              key={rule.id}
              className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                rule.enabled ? 'bg-white' : 'bg-gray-50/50 opacity-60'
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {rule.id}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">{rule.name}</h4>
                  {rule.action === 'auto_rollback' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center">
                      <RotateCcw className="w-3 h-3 mr-1 text-amber-600" />
                      Auto Rollback
                    </span>
                  )}
                  {rule.action === 'notify_slack_critical' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                      Slack Critical
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600">{rule.description}</p>

                <div className="flex items-center space-x-4 text-xs font-mono text-gray-700 pt-1">
                  <span>
                    Condition: <strong className="text-black font-bold">{rule.metric}</strong> {rule.operator} {rule.threshold}{rule.unit}
                  </span>
                  <span>Window: {rule.evaluationWindowSeconds}s</span>
                </div>
              </div>

              {/* Rule Toggle Switch */}
              <div className="flex items-center space-x-4 shrink-0">
                <div className="text-right hidden sm:block font-mono">
                  <div className="text-xs font-bold text-gray-900">
                    {rule.enabled ? 'Safeguard Active' : 'Policy Paused'}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {rule.enabled ? 'Monitoring live telemetry' : 'Bypassed'}
                  </div>
                </div>

                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative ${
                    rule.enabled ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Guardrail Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <ShieldAlert className="w-5 h-5 text-gray-900 mr-2" />
                Add Automated Guardrail Rule
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Spike Circuit Breaker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Target Metric</label>
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-medium"
                  >
                    <option value="error_rate">5xx Error Rate (%)</option>
                    <option value="latency_p99">Latency P99 (ms)</option>
                    <option value="health_check_status">Health Probe (/healthz)</option>
                    <option value="cpu_usage">CPU Usage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-medium"
                  >
                    <option value="auto_rollback">Automated Zero-Downtime Rollback</option>
                    <option value="notify_slack_critical">Slack Critical Alert Only</option>
                    <option value="pause_pipeline">Pause Pipeline Rollout</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Operator</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-medium"
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Evaluation Window</label>
                  <input
                    type="number"
                    required
                    value={evaluationWindowSeconds}
                    onChange={(e) => setEvaluationWindowSeconds(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain the purpose of this rollback guardrail policy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold uppercase tracking-wider"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
