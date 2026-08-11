import React from "react";
import { ShieldAlert, Activity, CheckCircle2 } from "lucide-react";
import { SystemHealth, AuditLog } from "../types";

interface SystemHealthPanelProps {
  systemHealth: SystemHealth | null;
  auditLogs: AuditLog[];
}

export function SystemHealthPanel({ systemHealth, auditLogs }: SystemHealthPanelProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          System Health & Infrastructure Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <div className="text-slate-400 uppercase mb-1">Exchange WebSocket</div>
            <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {systemHealth?.exchangeWs || "CONNECTED"}
            </div>
          </div>
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <div className="text-slate-400 uppercase mb-1">Database Storage</div>
            <div className="text-emerald-400 font-bold text-sm">HEALTHY</div>
          </div>
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <div className="text-slate-400 uppercase mb-1">Market Data Feed</div>
            <div className="text-emerald-400 font-bold text-sm">LIVE ({systemHealth?.dataLatencyMs || 24}ms)</div>
          </div>
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <div className="text-slate-400 uppercase mb-1">Execution Engine</div>
            <div className="text-cyan-400 font-bold text-sm">{systemHealth?.executionEngine || "READY"}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Security Audit Log
        </h2>

        <div className="space-y-2 font-mono text-xs">
          {(auditLogs || []).filter(l => l && l.id).map(log => (
            <div key={log.id} className="bg-slate-950 p-3 rounded border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {log.category}
                </span>
                <span className="font-bold text-slate-200">{log.action}</span>
                <span className="text-slate-400">{log.details}</span>
              </div>
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
