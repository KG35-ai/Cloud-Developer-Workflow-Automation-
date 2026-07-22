import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Activity, ShieldCheck, AlertTriangle, Cpu, Zap } from 'lucide-react';
import { SystemMetricPoint } from '../types';

interface MetricsMonitorProps {
  metrics: SystemMetricPoint[];
}

export const MetricsMonitor: React.FC<MetricsMonitorProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Live Telemetry & Anomaly Guard</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time Prometheus/OpenTelemetry stream evaluation triggering automated zero-downtime rollbacks
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center font-semibold">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-green-600" />
            Error Rate Guardrail (&lt; 5.0% Limit)
          </span>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Canary HTTP Error Rate % (5xx Errors)</h3>
            <p className="text-xs text-gray-500">
              Red highlight represents canary deployment failure where Sentinel executed automated rollback
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center text-red-600 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 mr-1.5" />
              Error Rate %
            </span>
            <span className="flex items-center text-gray-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-black mr-1.5" />
              Latency P99 (ms)
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timeLabel" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#dc2626" tick={{ fontSize: 10 }} domain={[0, 20]} />
              <YAxis yAxisId="right" orientation="right" stroke="#000000" tick={{ fontSize: 10 }} />

              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                labelStyle={{ color: '#0f172a', fontSize: '11px', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '12px' }}
              />

              <ReferenceLine yAxisId="left" y={5.0} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Guardrail Limit (5.0%)', fill: '#d97706', fontSize: 10, position: 'top' }} />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="errorRatePercent"
                name="Error Rate %"
                stroke="#dc2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorError)"
              />

              <Area
                yAxisId="right"
                type="monotone"
                dataKey="latencyMs"
                name="Latency P99 (ms)"
                stroke="#000000"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorLatency)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-200 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <div className="font-bold text-gray-900">Peak Anomaly: 18.4%</div>
              <div className="text-[11px] text-gray-500 font-mono">Canary DB connection pool exhaustion</div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-gray-900">Sentinel Reaction Time: 4.2s</div>
              <div className="text-[11px] text-gray-500 font-mono">Instant metric threshold breach reaction</div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <div className="font-bold text-gray-900">Post-Rollback Status</div>
              <div className="text-[11px] text-gray-500 font-mono">0.2% baseline error rate restored</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
