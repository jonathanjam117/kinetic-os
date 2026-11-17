import React, { useState } from 'react';
import type { BiometricProfile, SyncSettings } from '../../types';
import { calculateBioenergetics } from '../../services/calculator';
import { dataService, getTodayDateString } from '../../services/dataService';
import { Scale, Sliders, X, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '../common/Badge';

interface HeaderProps {
  biometrics: BiometricProfile;
  hasActiveWorkout: boolean;
  syncSettings?: SyncSettings;
  onNavigateToWorkout: () => void;
  onNavigateToSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  biometrics,
  hasActiveWorkout,
  syncSettings,
  onNavigateToWorkout,
  onNavigateToSettings,
}) => {
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [tempWeight, setTempWeight] = useState(biometrics.weightKg);
  const [tempHeight, setTempHeight] = useState(biometrics.heightCm);
  const [tempAge, setTempAge] = useState(biometrics.age);
  const [tempActivity, setTempActivity] = useState(biometrics.activityLevel);
  const [tempGoal, setTempGoal] = useState(biometrics.goal);

  const targets = calculateBioenergetics(biometrics);
  const todayStr = getTodayDateString();

  const handleSaveBiometrics = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateBiometrics({
      weightKg: tempWeight,
      heightCm: tempHeight,
      age: tempAge,
      activityLevel: tempActivity,
      goal: tempGoal,
    });
    setShowBiometricsModal(false);
  };

  const isConnected = syncSettings?.cloudStatus === 'connected';
  const isSyncing = syncSettings?.cloudStatus === 'syncing';
  const isError = syncSettings?.cloudStatus === 'error';

  return (
    <header className="sticky top-0 z-30 bg-[#09090B]/90 backdrop-blur-md border-b border-[#27272A] px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Mobile Title & Date Telemetry */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-6 h-6 rounded-[3px] bg-[#121215] border border-[#27272A] flex items-center justify-center text-[#FAFAFA] font-mono font-bold text-[10px]">
            K//
          </div>
          <span className="font-mono font-bold text-xs tracking-tight text-[#FAFAFA]">
            KINETIC // OS
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#52525B]">
          <span>TELEMETRÍA LOCAL</span>
          <span>•</span>
          <span className="text-[#A1A1AA]">{todayStr}</span>
        </div>
      </div>

      {/* Right: Quick Telemetry Chips, Cloud Sync Chip & Profile Editor */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Status Chip */}
        <button
          onClick={onNavigateToSettings}
          className="hidden sm:flex items-center gap-1.5 bg-[#121215] hover:bg-[#18181C] border border-[#27272A] px-2.5 py-1 rounded-[4px] text-[11px] font-mono transition-colors"
          title="Estado de sincronización en la nube (Supabase)"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3 h-3 text-[#F59E0B] animate-spin" />
              <span className="text-[#F59E0B]">SYNCING</span>
            </>
          ) : isConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse" />
              <span className="text-[#10B981]">CLOUD SYNC</span>
            </>
          ) : isError ? (
            <>
              <CloudOff className="w-3 h-3 text-[#EF4444]" />
              <span className="text-[#EF4444]">SYNC ERR</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#52525B]" />
              <span className="text-[#52525B]">LOCAL</span>
            </>
          )}
        </button>

        {hasActiveWorkout && (
          <button
            onClick={onNavigateToWorkout}
            className="flex items-center gap-1.5 bg-[#221805] hover:bg-[#332207] text-[#F59E0B] border border-[#422D0A] px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-subtle-pulse" />
            <span className="hidden sm:inline">SESIÓN EN CURSO</span>
            <span className="sm:hidden">ACTIVA</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 bg-[#121215] border border-[#27272A] px-3 py-1 rounded-[4px] text-xs font-mono">
          <span className="text-[#52525B]">META:</span>
          <span className="text-[#10B981] font-semibold uppercase">{biometrics.goal}</span>
          <span className="text-[#52525B]">|</span>
          <span className="text-[#FAFAFA] font-semibold">{targets.targetCalories} kcal</span>
        </div>

        <button
          onClick={() => {
            setTempWeight(biometrics.weightKg);
            setTempHeight(biometrics.heightCm);
            setTempAge(biometrics.age);
            setTempActivity(biometrics.activityLevel);
            setTempGoal(biometrics.goal);
            setShowBiometricsModal(true);
          }}
          className="flex items-center gap-1.5 bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors"
          title="Editar perfil biométrico"
        >
          <Scale className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="font-bold">{biometrics.weightKg} kg</span>
          <Sliders className="w-3 h-3 text-[#52525B]" />
        </button>
      </div>

      {/* Biometrics Quick Edit Modal */}
      {showBiometricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs uppercase font-mono font-bold text-[#FAFAFA]">
                  Ajuste de Perfil Biométrico Activo
                </h3>
              </div>
              <button
                onClick={() => setShowBiometricsModal(false)}
                className="text-[#52525B] hover:text-[#FAFAFA] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBiometrics} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tempWeight}
                    onChange={(e) => setTempWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Estatura (cm)</label>
                  <input
                    type="number"
                    required
                    value={tempHeight}
                    onChange={(e) => setTempHeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Edad</label>
                  <input
                    type="number"
                    required
                    value={tempAge}
                    onChange={(e) => setTempAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Nivel de Actividad Diaria</label>
                <select
                  value={tempActivity}
                  onChange={(e) => setTempActivity(e.target.value as BiometricProfile['activityLevel'])}
                  className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                >
                  <option value="sedentary">Sedentario (Oficina / Sin ejercicio) [1.2x]</option>
                  <option value="light">Ligero (1-3 días ejercicio/sem) [1.375x]</option>
                  <option value="moderate">Moderado (3-5 días ejercicio/sem) [1.55x]</option>
                  <option value="heavy">Pesado (6-7 días entrenamiento intenso) [1.725x]</option>
                  <option value="athlete">Atleta / Doble sesión [1.9x]</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Objetivo Fisiológico Actual</label>
                <select
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value as BiometricProfile['goal'])}
                  className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                >
                  <option value="cut">Definición / Déficit Calórico (-400 kcal)</option>
                  <option value="maintenance">Mantenimiento / Recomposición (0 kcal)</option>
                  <option value="bulk">Volumen Limpio / Superávit (+250 kcal)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowBiometricsModal(false)}
                  className="bg-[#18181C] text-[#A1A1AA] px-3 py-1.5 rounded-[4px] border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 rounded-[4px] transition-colors"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
