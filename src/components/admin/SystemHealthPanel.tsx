import React from 'react';
import { SystemHealth } from '../../types';
import { HeartPulse, CheckCircle2, Server, Database, Cpu, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

export interface SystemHealthPanelProps {
  health: SystemHealth;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ health }) => {
  const formatUptime = (sec: number) => {
    if (!sec || sec < 60) return `${sec || 0}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    return `${(sec / 3600).toFixed(1)} hrs`;
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-[#78716C] font-semibold flex items-center gap-1.5">
        <Server className="w-3.5 h-3.5 text-[#E9825B]" /> Comprehensive System Health Telemetry
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. API Health */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">1. API Health</span>
            <Server className="w-4 h-4 text-[#137333]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34A853] animate-pulse"></span>
            <span className="text-sm font-bold text-[#292524] capitalize">{health.status || 'Operational'}</span>
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">Uptime: {formatUptime(health.uptimeSeconds)}</p>
        </div>

        {/* 2. Database Health */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">2. Database Health</span>
            <Database className="w-4 h-4 text-[#E9825B]" />
          </div>
          <div className="text-sm font-bold text-[#292524] capitalize">
            {health.vectorDbStatus || 'Healthy'}
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">SQLite / Postgres Engine Active</p>
        </div>

        {/* 3. AI Provider Health */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">3. AI Provider Health</span>
            <Cpu className="w-4 h-4 text-[#137333]" />
          </div>
          <div className="text-sm font-bold text-[#137333] capitalize">
            {health.llmProviderStatus || 'Ready'}
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">Gemini / Local Fallback Active</p>
        </div>

        {/* 4. Background Jobs */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">4. Background Jobs</span>
            <RefreshCw className="w-4 h-4 text-[#E9825B]" />
          </div>
          <div className="text-sm font-bold text-[#292524]">
            Worker Active
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">Async PDF Chunking Engine</p>
        </div>

        {/* 5. Recent Failures */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">5. Recent Failures</span>
            <AlertTriangle className={`w-4 h-4 ${health.errorRate > 0 ? 'text-[#EF4444]' : 'text-[#137333]'}`} />
          </div>
          <div className={`text-sm font-bold ${health.errorRate > 0 ? 'text-[#EF4444]' : 'text-[#137333]'}`}>
            {health.errorRate > 0 ? `${(health.errorRate * 100).toFixed(1)}% Incidents` : '0 Failures'}
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">
            {health.errorRate > 0 ? 'Pipeline Exception Detected' : 'Auto-Recovered Pipeline'}
          </p>
        </div>

        {/* 6. Processing Backlog */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">6. Processing Backlog</span>
            <Clock className="w-4 h-4 text-[#E9825B]" />
          </div>
          <div className="text-sm font-bold text-[#292524]">
            {health.status === 'degraded' ? 'Queue Active' : '0 Queued'}
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">
            {health.status === 'degraded' ? 'Ingestion In Progress' : 'Zero Processing Delay'}
          </p>
        </div>

        {/* 7. AI Latency */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">7. AI Latency</span>
            <HeartPulse className="w-4 h-4 text-[#E9825B]" />
          </div>
          <div className="text-sm font-bold text-[#292524]">
            {health.apiLatencyMs > 0 ? `${health.apiLatencyMs} ms` : '0 ms'}
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">
            {health.apiLatencyMs > 0 ? 'RAG Inference Speed' : 'No Queries Recorded'}
          </p>
        </div>

        {/* 8. Error Rates */}
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono">
            <span className="font-semibold text-[10px] uppercase">8. Error Rates</span>
            <CheckCircle2 className="w-4 h-4 text-[#137333]" />
          </div>
          <div className="text-sm font-bold text-[#137333]">
            {((health.errorRate || 0) * 100).toFixed(2)}%
          </div>
          <p className="text-[10px] text-[#78716C] font-mono">Target Threshold &lt; 0.5%</p>
        </div>
      </div>
    </div>
  );
};
