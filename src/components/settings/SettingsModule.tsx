import React, { useState } from 'react';
import type { SyncSettings } from '../../types';
import { dataService } from '../../services/dataService';
import { SUPABASE_POSTGRESQL_SCHEMA, SQLITE_LOCAL_SCHEMA } from '../../data/schemaSql';
import { Badge } from '../common/Badge';
import {
  Database,
  Cloud,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  CloudUpload,
  CloudDownload,
  Activity,
} from 'lucide-react';

interface SettingsModuleProps {
  syncSettings: SyncSettings;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ syncSettings }) => {
  const [supabaseUrl, setSupabaseUrl] = useState(syncSettings?.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(syncSettings?.supabaseAnonKey || '');
  const [activeSchemaTab, setActiveSchemaTab] = useState<'supabase' | 'sqlite'>('supabase');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isProcessingSync, setIsProcessingSync] = useState(false);

  const handleSaveSyncSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingSync(true);
    dataService.updateSyncSettings({
      supabaseUrl,
      supabaseAnonKey,
    });

    const testRes = await dataService.testConnection();
    setSyncStatusMsg(testRes.message);
    setIsProcessingSync(false);
  };

  const handlePushSupabase = async () => {
    setIsProcessingSync(true);
    const res = await dataService.pushToSupabase();
    setSyncStatusMsg(res.message);
    setIsProcessingSync(false);
  };

  const handlePullSupabase = async () => {
    setIsProcessingSync(true);
    const res = await dataService.pullFromSupabase();
    setSyncStatusMsg(res.message);
    setIsProcessingSync(false);
  };

  const handleExportJson = () => {
    const jsonStr = dataService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kinetic_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvStr = dataService.exportTrainingHistoryCsv();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kinetic_training_history_pandas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = dataService.importBackupJson(content);
        if (result.success) {
          setImportStatus('Backup importado y restaurado con éxito.');
        } else {
          setImportStatus(`Error al importar: ${result.error}`);
        }
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleCopySchema = () => {
    const schemaText = activeSchemaTab === 'supabase' ? SUPABASE_POSTGRESQL_SCHEMA : SQLITE_LOCAL_SCHEMA;
    navigator.clipboard.writeText(schemaText);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleDownloadSchemaFile = () => {
    const schemaText = activeSchemaTab === 'supabase' ? SUPABASE_POSTGRESQL_SCHEMA : SQLITE_LOCAL_SCHEMA;
    const blob = new Blob([schemaText], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeSchemaTab === 'supabase' ? 'schema_supabase_postgresql.sql' : 'schema_sqlite.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToFactory = () => {
    if (
      window.confirm(
        '¿Restablecer KINETIC // OS al estado de fábrica con los datos semilla iniciales? Se sobreescribirán los registros locales.'
      )
    ) {
      dataService.resetToFactoryDefaults();
      alert('Sistema restaurado al estado semilla original.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
          <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA]">
            Persistencia, Sincronización & Portabilidad de Datos
          </span>
        </div>
        <h2 className="text-lg font-bold text-[#FAFAFA] tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-[#FAFAFA]" />
          Arquitectura Desacoplada: Local-First + Supabase Dual-Write
        </h2>
        <p className="text-xs text-[#A1A1AA] mt-0.5">
          Tus datos se almacenan 100% en tu navegador mediante LocalStorage/IndexedDB (latencia cero) y se sincronizan con Supabase PostgreSQL cuando esté configurado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cloud Sync & Backup Export (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cloud Sync (Supabase Credentials Configuration) */}
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <h3 className="text-xs uppercase font-mono tracking-wider text-[#FAFAFA] flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#06B6D4]" />
                Sincronización en la Nube (Supabase)
              </h3>
              <Badge
                variant={
                  syncSettings?.cloudStatus === 'connected'
                    ? 'emerald'
                    : syncSettings?.cloudStatus === 'syncing'
                    ? 'amber'
                    : 'neutral'
                }
              >
                {syncSettings?.cloudStatus === 'connected'
                  ? 'CONECTADO'
                  : syncSettings?.cloudStatus === 'syncing'
                  ? 'SINCRONIZANDO...'
                  : 'STANDALONE LOCAL'}
              </Badge>
            </div>

            <form onSubmit={handleSaveSyncSettings} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-[#52525B] block mb-1">
                  SUPABASE_URL:
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-[#52525B] block mb-1">
                  SUPABASE_ANON_KEY:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#52525B] font-mono">
                  {syncSettings?.lastSyncedAt
                    ? `Sync: ${new Date(syncSettings.lastSyncedAt).toLocaleTimeString()}`
                    : 'Modo Local Activo'}
                </span>

                <button
                  type="submit"
                  disabled={isProcessingSync}
                  className="bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] px-3 py-1 text-xs font-mono rounded-[4px] transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3 h-3 text-[#10B981]" />
                  <span>Probar Conexión</span>
                </button>
              </div>

              {/* Action Buttons: Push / Pull */}
              <div className="pt-2 border-t border-[#27272A] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePushSupabase}
                  disabled={isProcessingSync || !supabaseUrl}
                  className="bg-[#18181C] hover:bg-[#27272A] disabled:opacity-40 text-[#10B981] border border-[#27272A] py-1.5 px-2 rounded-[4px] font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Subir (Push)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePullSupabase}
                  disabled={isProcessingSync || !supabaseUrl}
                  className="bg-[#18181C] hover:bg-[#27272A] disabled:opacity-40 text-[#06B6D4] border border-[#27272A] py-1.5 px-2 rounded-[4px] font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Descargar (Pull)</span>
                </button>
              </div>

              {syncStatusMsg && (
                <div className="p-2.5 rounded-[4px] bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#FAFAFA] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span className="truncate">{syncStatusMsg}</span>
                </div>
              )}
            </form>
          </div>

          {/* Portability Controls */}
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-5 space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider text-[#FAFAFA] flex items-center gap-2 pb-2 border-b border-[#27272A]">
              <Download className="w-4 h-4 text-[#10B981]" />
              Portabilidad Total de Datos
            </h3>

            <div className="space-y-3">
              {/* Export Full Backup JSON */}
              <button
                onClick={handleExportJson}
                className="w-full bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] p-3 rounded-[4px] text-xs font-mono text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#10B981]" />
                    Exportar Backup Completo (.JSON)
                  </div>
                  <div className="text-[10px] text-[#52525B] mt-0.5 font-sans">
                    Guarda biometría, rutinas, historial, nutrición y peso en un solo archivo.
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#A1A1AA]" />
              </button>

              {/* Export CSV for Pandas */}
              <button
                onClick={handleExportCsv}
                className="w-full bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] p-3 rounded-[4px] text-xs font-mono text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#06B6D4]" />
                    Exportar Historial para Python / Pandas (.CSV)
                  </div>
                  <div className="text-[10px] text-[#52525B] mt-0.5 font-sans">
                    Formato tabular optimizado para notebooks de Jupyter, regresiones y telemetría de sobrecarga.
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#A1A1AA]" />
              </button>

              {/* Import Backup JSON */}
              <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px]">
                <label className="text-xs font-mono font-bold text-[#FAFAFA] block mb-1 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Importar / Restaurar Backup (.JSON)
                </label>
                <p className="text-[10px] text-[#52525B] mb-2 font-sans">
                  Restaura tu base de datos completa desde un backup previo generado por KINETIC // OS.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="w-full text-xs font-mono text-[#A1A1AA] file:mr-2 file:py-1 file:px-2.5 file:rounded-[3px] file:border file:border-[#27272A] file:bg-[#18181C] file:text-[#FAFAFA] file:text-xs file:font-mono hover:file:bg-[#27272A] cursor-pointer"
                />
              </div>

              {importStatus && (
                <div className="p-2.5 rounded-[4px] bg-[#18181C] border border-[#27272A] text-xs font-mono text-[#10B981]">
                  {importStatus}
                </div>
              )}
            </div>
          </div>

          {/* Reset To Factory */}
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-[#EF4444] block">Estado de Fábrica</span>
              <span className="text-[10px] text-[#52525B]">Recargar datos semilla originales</span>
            </div>
            <button
              onClick={handleResetToFactory}
              className="bg-[#260B0B] hover:bg-[#381010] text-[#EF4444] border border-[#4A1616] px-3 py-1 text-xs font-mono rounded-[4px] transition-colors"
            >
              Restablecer Semilla
            </button>
          </div>
        </div>

        {/* Right Column: SQL Schema Viewer & Code Export (7 cols) */}
        <div className="lg:col-span-7 bg-[#121215] border border-[#27272A] rounded-[6px] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider text-[#FAFAFA] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#10B981]" />
                Esquema SQL Exacto (schema.sql)
              </h3>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                DDL listo para pegar en el SQL Editor de Supabase (PostgreSQL) o SQLite.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopySchema}
                className="bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] px-2.5 py-1 text-xs font-mono rounded-[4px] flex items-center gap-1 transition-colors"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleDownloadSchemaFile}
                className="bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] px-2.5 py-1 text-xs font-mono rounded-[4px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .SQL</span>
              </button>
            </div>
          </div>

          {/* Database Engine Selector */}
          <div className="flex gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveSchemaTab('supabase')}
              className={`px-3 py-1 rounded-[3px] border transition-colors ${
                activeSchemaTab === 'supabase'
                  ? 'bg-[#FAFAFA] text-[#09090B] border-[#FAFAFA] font-bold'
                  : 'bg-[#09090B] text-[#A1A1AA] border-[#27272A]'
              }`}
            >
              PostgreSQL 15+ (Supabase / RLS)
            </button>
            <button
              onClick={() => setActiveSchemaTab('sqlite')}
              className={`px-3 py-1 rounded-[3px] border transition-colors ${
                activeSchemaTab === 'sqlite'
                  ? 'bg-[#FAFAFA] text-[#09090B] border-[#FAFAFA] font-bold'
                  : 'bg-[#09090B] text-[#A1A1AA] border-[#27272A]'
              }`}
            >
              SQLite 3.35+ (Local / Turso)
            </button>
          </div>

          {/* Code Container with Micro Scrollbar */}
          <div className="relative bg-[#09090B] border border-[#27272A] rounded-[4px] p-3 max-h-[480px] overflow-y-auto">
            <pre className="font-mono text-[11px] text-[#A1A1AA] leading-relaxed select-all">
              {activeSchemaTab === 'supabase' ? SUPABASE_POSTGRESQL_SCHEMA : SQLITE_LOCAL_SCHEMA}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
