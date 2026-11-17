import React, { useMemo } from 'react';
import type {
  BiometricProfile,
  WorkoutRoutine,
  DailyNutritionLog,
  WeightRecord,
  DailyProtocolChecklist,
  Exercise,
} from '../../types';
import { calculateBioenergetics } from '../../services/calculator';
import { dataService, getTodayDateString } from '../../services/dataService';
import { WeightTrendChart } from './WeightTrendChart';
import { Badge } from '../common/Badge';
import {
  Flame,
  CheckCircle2,
  Play,
  Dumbbell,
  ArrowUpRight,
} from 'lucide-react';

interface CommandCenterProps {
  biometrics: BiometricProfile;
  routines: WorkoutRoutine[];
  dailyNutrition: DailyNutritionLog;
  weightRecords: WeightRecord[];
  dailyChecklist: DailyProtocolChecklist;
  activeWorkout: {
    routineId: string;
    startedAt: string;
    exercises: Exercise[];
  } | null;
  onNavigateToModule: (moduleId: 'training' | 'nutrition' | 'supplements' | 'settings') => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  biometrics,
  routines,
  dailyNutrition,
  weightRecords,
  dailyChecklist,
  activeWorkout,
  onNavigateToModule,
}) => {
  const todayStr = getTodayDateString();
  const targets = useMemo(() => calculateBioenergetics(biometrics), [biometrics]);

  // Consumed macros
  const consumed = useMemo(() => {
    const entries = dailyNutrition?.entries || [];
    let cal = 0, p = 0, c = 0, f = 0;
    entries.forEach((e) => {
      cal += e.calories;
      p += e.protein;
      c += e.carbs;
      f += e.fat;
    });
    return {
      calories: Math.round(cal),
      protein: Number(p.toFixed(1)),
      carbs: Number(c.toFixed(1)),
      fat: Number(f.toFixed(1)),
    };
  }, [dailyNutrition]);

  // Today's scheduled routine (defaults to Routine A or active routine)
  const scheduledRoutine = routines[0] || {
    id: 'routine-a',
    name: 'Calistenia & Fuerza Corporal',
    focus: 'Full Body / Casa & Barras',
    estimatedMinutes: 50,
    exercises: [],
  };

  const handleStartTodayWorkout = () => {
    if (!activeWorkout) {
      dataService.startWorkout(scheduledRoutine.id);
    }
    onNavigateToModule('training');
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Top Layer: Biometrics Active Status & Today's Workout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card (7 cols): Active Biometrics & Bioenergetic Target Summary */}
        <div className="lg:col-span-7 bg-[#121215] border border-[#27272A] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]/70 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
                <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA]">
                  Telemetría Biocelular Activa // KINETIC CORE
                </span>
              </div>
              <Badge variant="emerald">{biometrics.goal.toUpperCase()}</Badge>
            </div>

            {/* Editable Biometrics Quick Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded-[4px]">
                <label className="text-[10px] uppercase font-mono text-[#52525B] block">Peso Actual</label>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <input
                    type="number"
                    step="0.1"
                    value={biometrics.weightKg}
                    onChange={(e) =>
                      dataService.updateBiometrics({ weightKg: parseFloat(e.target.value) || biometrics.weightKg })
                    }
                    className="w-16 bg-transparent text-[#FAFAFA] font-mono font-bold text-base outline-none focus:text-[#10B981]"
                  />
                  <span className="text-xs font-mono text-[#52525B]">kg</span>
                </div>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded-[4px]">
                <label className="text-[10px] uppercase font-mono text-[#52525B] block">Estatura</label>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <input
                    type="number"
                    value={biometrics.heightCm}
                    onChange={(e) =>
                      dataService.updateBiometrics({ heightCm: parseFloat(e.target.value) || biometrics.heightCm })
                    }
                    className="w-14 bg-transparent text-[#FAFAFA] font-mono font-bold text-base outline-none focus:text-[#10B981]"
                  />
                  <span className="text-xs font-mono text-[#52525B]">cm</span>
                </div>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded-[4px]">
                <label className="text-[10px] uppercase font-mono text-[#52525B] block">Edad</label>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <input
                    type="number"
                    value={biometrics.age}
                    onChange={(e) =>
                      dataService.updateBiometrics({ age: parseInt(e.target.value, 10) || biometrics.age })
                    }
                    className="w-12 bg-transparent text-[#FAFAFA] font-mono font-bold text-base outline-none focus:text-[#10B981]"
                  />
                  <span className="text-xs font-mono text-[#52525B]">años</span>
                </div>
              </div>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded-[4px]">
                <label className="text-[10px] uppercase font-mono text-[#52525B] block">Actividad</label>
                <select
                  value={biometrics.activityLevel}
                  onChange={(e) =>
                    dataService.updateBiometrics({
                      activityLevel: e.target.value as BiometricProfile['activityLevel'],
                    })
                  }
                  className="bg-transparent text-[#FAFAFA] font-mono text-xs mt-1 w-full outline-none cursor-pointer"
                >
                  <option value="sedentary">Sedentario (1.2x)</option>
                  <option value="light">Ligero (1.375x)</option>
                  <option value="moderate">Moderado (1.55x)</option>
                  <option value="heavy">Pesado (1.725x)</option>
                  <option value="athlete">Atleta (1.9x)</option>
                </select>
              </div>
            </div>

            {/* Energetic Target Row */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-[#09090B] border border-[#27272A] rounded-[4px] font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#52525B] uppercase block">Tasa Metabólica (BMR)</span>
                <span className="text-[#FAFAFA] font-semibold">{targets.bmr} kcal</span>
              </div>
              <div>
                <span className="text-[10px] text-[#52525B] uppercase block">Gasto Total (TDEE)</span>
                <span className="text-[#FAFAFA] font-semibold">{targets.tdee} kcal</span>
              </div>
              <div>
                <span className="text-[10px] text-[#10B981] uppercase block font-bold">Meta Calórica Hoy</span>
                <span className="text-[#10B981] font-bold text-sm">{targets.targetCalories} kcal</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272A]/70 flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
            <span>Dosis Creatina Fija: <strong className="text-[#FAFAFA]">{targets.creatineDailyGrams}g</strong> (0.1g/kg)</span>
            <button
              onClick={() => onNavigateToModule('nutrition')}
              className="text-[#10B981] hover:underline flex items-center gap-1"
            >
              <span>Ver motor nutricional</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Card (5 cols): Widget "Sesión de Hoy" */}
        <div className="lg:col-span-5 bg-[#121215] border border-[#27272A] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]/70 mb-4">
              <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-[#10B981]" />
                Widget // Sesión Programada de Hoy
              </span>
              {activeWorkout ? (
                <Badge variant="amber" className="animate-pulse">EN EJECUCIÓN</Badge>
              ) : (
                <Badge variant="neutral">LISTA PARA INICIAR</Badge>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-[#FAFAFA] tracking-tight">
                  {scheduledRoutine.name}
                </h3>
                <span className="text-xs font-mono text-[#A1A1AA]">{scheduledRoutine.focus}</span>
              </div>

              <p className="text-xs text-[#52525B] leading-relaxed">
                {scheduledRoutine.description}
              </p>

              <div className="bg-[#09090B] border border-[#27272A] p-2.5 rounded-[4px] space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Ejercicios Programados:</span>
                  <span className="text-[#FAFAFA] font-semibold">{scheduledRoutine.exercises.length}</span>
                </div>
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Tiempo Estimado:</span>
                  <span className="text-[#FAFAFA] font-semibold">~{scheduledRoutine.estimatedMinutes} min</span>
                </div>
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Descanso Típico:</span>
                  <span className="text-[#FAFAFA]">90s - 120s</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTodayWorkout}
            className={`w-full mt-4 py-2.5 px-4 rounded-[4px] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              activeWorkout
                ? 'bg-[#10B981] hover:bg-[#059669] text-[#09090B]'
                : 'bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{activeWorkout ? 'Continuar Sesión Activa' : 'Iniciar Sesión Inmediata'}</span>
          </button>
        </div>
      </div>

      {/* 4px Minimalist Telemetry Progress Bars (Macros & Hydration) */}
      <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272A]/70">
          <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#10B981]" />
            Telemetría de Macros & Hidratación (Barras Minimalistas 4px)
          </span>
          <span className="text-[10px] font-mono text-[#52525B]">FECHA: {todayStr}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Calories Bar */}
          <div>
            <div className="flex justify-between items-baseline text-xs font-mono mb-1.5">
              <span className="text-[#A1A1AA] text-[10px] uppercase">Calorías Totales</span>
              <span className="text-[#FAFAFA] font-bold">
                {consumed.calories} <span className="text-[#52525B]">/ {targets.targetCalories} kcal</span>
              </span>
            </div>
            <div className="w-full bg-[#09090B] h-1 rounded-full overflow-hidden border border-[#27272A]/40">
              <div
                className="h-full bg-[#FAFAFA] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.calories / targets.targetCalories) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#52525B] mt-1 block">
              {Math.round((consumed.calories / targets.targetCalories) * 100)}% ejecutado
            </span>
          </div>

          {/* Protein Bar */}
          <div>
            <div className="flex justify-between items-baseline text-xs font-mono mb-1.5">
              <span className="text-[#10B981] text-[10px] uppercase font-semibold">Proteína Pura</span>
              <span className="text-[#10B981] font-bold">
                {consumed.protein} <span className="text-[#52525B]">/ {targets.proteinGrams}g</span>
              </span>
            </div>
            <div className="w-full bg-[#09090B] h-1 rounded-full overflow-hidden border border-[#27272A]/40">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.protein / targets.proteinGrams) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#52525B] mt-1 block">
              {Math.round((consumed.protein / targets.proteinGrams) * 100)}% de meta
            </span>
          </div>

          {/* Carbs Bar */}
          <div>
            <div className="flex justify-between items-baseline text-xs font-mono mb-1.5">
              <span className="text-[#06B6D4] text-[10px] uppercase font-semibold">Carbohidratos</span>
              <span className="text-[#FAFAFA] font-bold">
                {consumed.carbs} <span className="text-[#52525B]">/ {targets.carbGrams}g</span>
              </span>
            </div>
            <div className="w-full bg-[#09090B] h-1 rounded-full overflow-hidden border border-[#27272A]/40">
              <div
                className="h-full bg-[#06B6D4] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.carbs / targets.carbGrams) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#52525B] mt-1 block">
              {Math.round((consumed.carbs / targets.carbGrams) * 100)}% de meta
            </span>
          </div>

          {/* Fats Bar */}
          <div>
            <div className="flex justify-between items-baseline text-xs font-mono mb-1.5">
              <span className="text-[#F59E0B] text-[10px] uppercase font-semibold">Grasas Esenciales</span>
              <span className="text-[#FAFAFA] font-bold">
                {consumed.fat} <span className="text-[#52525B]">/ {targets.fatGrams}g</span>
              </span>
            </div>
            <div className="w-full bg-[#09090B] h-1 rounded-full overflow-hidden border border-[#27272A]/40">
              <div
                className="h-full bg-[#F59E0B] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.fat / targets.fatGrams) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#52525B] mt-1 block">
              {Math.round((consumed.fat / targets.fatGrams) * 100)}% de meta
            </span>
          </div>

          {/* Water Bar */}
          <div>
            <div className="flex justify-between items-baseline text-xs font-mono mb-1.5">
              <span className="text-[#06B6D4] text-[10px] uppercase font-semibold">Hidratación</span>
              <span className="text-[#06B6D4] font-bold">
                {dailyNutrition?.waterIntakeMl || 0} <span className="text-[#52525B]">/ {targets.waterTargetMl} ml</span>
              </span>
            </div>
            <div className="w-full bg-[#09090B] h-1 rounded-full overflow-hidden border border-[#27272A]/40">
              <div
                className="h-full bg-[#06B6D4] transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    ((dailyNutrition?.waterIntakeMl || 0) / (targets.waterTargetMl || 2500)) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#52525B] mt-1 block">
              {Math.round(((dailyNutrition?.waterIntakeMl || 0) / (targets.waterTargetMl || 2500)) * 100)}% hidratado
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Bottom Layer: Daily Protocol Checklist & Weight Trend (MacroFactor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Protocol Checklist (4 cols) */}
        <div className="lg:col-span-4 bg-[#121215] border border-[#27272A] rounded-[6px] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]/70">
            <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Checklist // Protocolo Diario
            </span>
            <span className="text-[10px] font-mono text-[#52525B]">4 PILARES</span>
          </div>

          <div className="space-y-2.5">
            {/* Creatine */}
            <div
              onClick={() => dataService.toggleDailyChecklistItem('creatineChecked')}
              className={`p-3 rounded-[4px] border cursor-pointer transition-colors flex items-center justify-between ${
                dailyChecklist?.creatineChecked
                  ? 'bg-[#062016]/40 border-[#0A3D28] text-[#10B981]'
                  : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-semibold flex items-center gap-1.5">
                  <span>Creatina Micronizada</span>
                  <Badge variant="emerald" size="xs">0.1g/kg</Badge>
                </div>
                <div className="text-[10px] font-mono opacity-80 mt-0.5">
                  Dosis calculada: {dailyChecklist?.creatineGrams || targets.creatineDailyGrams}g pura
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-[3px] border flex items-center justify-center font-bold text-xs ${
                  dailyChecklist?.creatineChecked
                    ? 'bg-[#10B981] border-[#10B981] text-[#09090B]'
                    : 'border-[#3F3F46]'
                }`}
              >
                {dailyChecklist?.creatineChecked ? '✓' : ''}
              </div>
            </div>

            {/* Protein Target */}
            <div
              onClick={() => dataService.toggleDailyChecklistItem('proteinChecked')}
              className={`p-3 rounded-[4px] border cursor-pointer transition-colors flex items-center justify-between ${
                dailyChecklist?.proteinChecked
                  ? 'bg-[#062016]/40 border-[#0A3D28] text-[#10B981]'
                  : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-semibold">Objetivo de Proteína Diario</div>
                <div className="text-[10px] font-mono opacity-80 mt-0.5">
                  Mínimo {targets.proteinGrams}g alcanzados ({consumed.protein}g registrados)
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-[3px] border flex items-center justify-center font-bold text-xs ${
                  dailyChecklist?.proteinChecked
                    ? 'bg-[#10B981] border-[#10B981] text-[#09090B]'
                    : 'border-[#3F3F46]'
                }`}
              >
                {dailyChecklist?.proteinChecked ? '✓' : ''}
              </div>
            </div>

            {/* Hydration */}
            <div
              onClick={() => dataService.toggleDailyChecklistItem('hydrationChecked')}
              className={`p-3 rounded-[4px] border cursor-pointer transition-colors flex items-center justify-between ${
                dailyChecklist?.hydrationChecked
                  ? 'bg-[#062016]/40 border-[#0A3D28] text-[#10B981]'
                  : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-semibold">Hidratación Biocelular</div>
                <div className="text-[10px] font-mono opacity-80 mt-0.5">
                  Meta {targets.waterTargetMl} ml cumplida
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-[3px] border flex items-center justify-center font-bold text-xs ${
                  dailyChecklist?.hydrationChecked
                    ? 'bg-[#10B981] border-[#10B981] text-[#09090B]'
                    : 'border-[#3F3F46]'
                }`}
              >
                {dailyChecklist?.hydrationChecked ? '✓' : ''}
              </div>
            </div>

            {/* Sleep & Recovery */}
            <div
              onClick={() => dataService.toggleDailyChecklistItem('sleepRecoveryChecked')}
              className={`p-3 rounded-[4px] border cursor-pointer transition-colors flex items-center justify-between ${
                dailyChecklist?.sleepRecoveryChecked
                  ? 'bg-[#062016]/40 border-[#0A3D28] text-[#10B981]'
                  : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
              }`}
            >
              <div>
                <div className="font-mono text-xs font-semibold">Sueño & Recuperación SNC</div>
                <div className="text-[10px] font-mono opacity-80 mt-0.5">
                  ≥ 7.5 horas de sueño reparador
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-[3px] border flex items-center justify-center font-bold text-xs ${
                  dailyChecklist?.sleepRecoveryChecked
                    ? 'bg-[#10B981] border-[#10B981] text-[#09090B]'
                    : 'border-[#3F3F46]'
                }`}
              >
                {dailyChecklist?.sleepRecoveryChecked ? '✓' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Weight Trend Telemetry Chart (MacroFactor Style) (8 cols) */}
        <div className="lg:col-span-8">
          <WeightTrendChart records={weightRecords} />
        </div>
      </div>
    </div>
  );
};
