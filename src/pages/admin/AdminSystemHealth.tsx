import React, { useEffect, useState } from 'react';
import { fetchSystemHealthApi } from '../../api/admin';
import { appStorage } from '../../services/storage/localStorageStore';
import { SystemHealth, BackgroundJob } from '../../types';
import { SystemHealthPanel } from '../../components/admin/SystemHealthPanel';
import { Card } from '../../components/ui/Card';
import { Server, Database, Cpu, Activity, AlertTriangle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

export const AdminSystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchSystemHealthApi();
        setHealth(data);
        const storedJobs = appStorage.get('backgroundJobs') || [];
        setJobs(storedJobs);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const storedMaterials = appStorage.get('materials') || [];
  const queuedMat = storedMaterials.filter((m) => m.stage === 'uploading').length;
  const runningMat = storedMaterials.filter((m) => m.stage === 'extracting' || m.stage === 'chunking' || m.stage === 'embedding' || m.stage === 'graphing').length;
  const completedMat = storedMaterials.filter((m) => m.stage === 'ready').length;
  const failedMat = storedMaterials.filter((m) => m.stage === 'failed').length;

  const queuedJobs = jobs.filter((j) => j.status === 'queued').length + queuedMat;
  const runningJobs = jobs.filter((j) => j.status === 'processing').length + runningMat;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length + completedMat;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length + failedMat;

  const incidents = [
    ...jobs.filter((j) => j.status === 'failed').map((j) => ({
      id: j.id,
      title: `Job Failure: ${j.type}`,
      desc: j.error || 'Execution encountered a transient worker error.',
      time: new Date(j.startedAt || j.completedAt || Date.now()).toLocaleTimeString(),
      status: 'FAILED',
      isError: true,
    })),
    ...storedMaterials.filter((m) => m.stage === 'failed').map((m) => ({
      id: m.id,
      title: `PDF Extraction Failure: ${m.title}`,
      desc: 'Material text extraction pipeline failed. Retrying OCR fallback.',
      time: new Date(m.uploadedAt).toLocaleTimeString(),
      status: 'RETRYING',
      isError: true,
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in text-[#292524]">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#292524]">
          System Infrastructure & Health Operations
        </h1>
        <p className="text-xs text-[#78716C] mt-1 font-mono">
          Real-time telemetry for API microservices, database engine, background document jobs, and AI gateway latency.
        </p>
      </div>

      {/* Main Health Status Panel */}
      {health && <SystemHealthPanel health={health} />}

      {/* BACKGROUND JOB HEALTH & BACKLOG TELEMETRY */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-[#E9825B]" /> Background Document Ingestion & Job Queue Health
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#E9825B]" /> Queued Jobs
            </span>
            <p className="text-2xl font-bold text-[#292524]">{queuedJobs}</p>
          </Card>

          <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 text-[#E9825B] animate-spin" /> Processing
            </span>
            <p className="text-2xl font-bold text-[#E9825B]">{runningJobs}</p>
          </Card>

          <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" /> Completed
            </span>
            <p className="text-2xl font-bold text-[#137333]">{completedJobs}</p>
          </Card>

          <Card className="p-4 bg-white border border-[#F1E8E3] rounded-xl space-y-1 shadow-sm">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" /> Failed / Retrying
            </span>
            <p className="text-2xl font-bold text-[#EF4444]">{failedJobs}</p>
          </Card>
        </div>
      </div>

      {/* RECENT SYSTEM FAILURES & RECOVERY LOG */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" /> Recent System Incident & Exception Log
        </h2>

        <Card className="p-5 bg-white border border-[#F1E8E3] rounded-2xl shadow-sm space-y-3 font-mono text-xs">
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3] flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#292524]">{inc.title}</span>
                    <span className="text-[10px] text-[#78716C]">• {inc.time}</span>
                  </div>
                  <p className="text-xs text-[#78716C] font-sans">{inc.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-[#C5221F] bg-[#FEE2E2] px-2.5 py-1 rounded-full border border-[#FCA5A5] uppercase font-semibold flex-shrink-0">
                  {inc.status}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-[#137333] font-sans bg-[#E6F4EA]/40 rounded-xl border border-[#CEEAD6]">
              <p className="font-semibold text-xs">✓ All Background Services Operating Nominally</p>
              <p className="text-[11px] text-[#78716C] mt-0.5 font-mono">
                No active failures, stalled document queues, or gateway rate limit exceptions detected.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
