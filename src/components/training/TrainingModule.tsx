import React, { useState } from 'react';
import type { WorkoutRoutine, Exercise, ExerciseSet, ExerciseModality } from '../../types';
import { dataService } from '../../services/dataService';
import { getOverloadSuggestion } from '../../services/calculator';
import { useRestTimer } from '../../context/RestTimerContext';
import { Badge } from '../common/Badge';
import {
  Dumbbell,
  Play,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Edit2,
  Settings2,
  X,
  Layers,
} from 'lucide-react';

interface TrainingModuleProps {
  routines: WorkoutRoutine[];
  activeWorkout: {
    routineId: string;
    startedAt: string;
    exercises: Exercise[];
  } | null;
  workoutHistoryCount: number;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({
  routines,
  activeWorkout,
}) => {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    activeWorkout?.routineId || routines[0]?.id || 'routine-a'
  );
  const [showCompletionSuccess, setShowCompletionSuccess] = useState<boolean>(false);

  // Global Rest Timer hook
  const { startRest } = useRestTimer();

  // Modals for CRUD
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  // Form states for Routine CRUD
  const [routineFormName, setRoutineFormName] = useState('');
  const [routineFormFocus, setRoutineFormFocus] = useState('');
  const [routineFormDesc, setRoutineFormDesc] = useState('');
  const [routineFormMins, setRoutineFormMins] = useState(45);

  // Form states for Exercise CRUD
  const [exFormName, setExFormName] = useState('');
  const [exFormMuscle, setExFormMuscle] = useState('');
  const [exFormModality, setExFormModality] = useState<ExerciseModality>('weighted');
  const [exFormSetsCount, setExFormSetsCount] = useState(3);
  const [exFormReps, setExFormReps] = useState(10);
  const [exFormWeight, setExFormWeight] = useState(0);
  const [exFormRest, setExFormRest] = useState(90);
  const [exFormNotes, setExFormNotes] = useState('');
  const [exFormProgressions, setExFormProgressions] = useState('Estándar, Avanzado, Unilateral');

  const currentRoutine = routines.find((r) => r.id === selectedRoutineId) || routines[0] || {
    id: 'empty',
    name: 'Sin Rutinas',
    description: '',
    focus: '',
    estimatedMinutes: 0,
    exercises: [],
  };

  const isCurrentActive = activeWorkout && activeWorkout.routineId === selectedRoutineId;
  const exercisesToDisplay = isCurrentActive && activeWorkout ? activeWorkout.exercises : currentRoutine.exercises;

  const handleStartWorkout = (routineId: string) => {
    dataService.startWorkout(routineId);
    setSelectedRoutineId(routineId);
  };

  const handleSetToggle = (exercise: Exercise, set: ExerciseSet) => {
    if (!activeWorkout) {
      dataService.startWorkout(selectedRoutineId);
    }

    const nextCompleted = !set.completed;
    dataService.updateActiveExerciseSet(exercise.id, set.id, {
      completed: nextCompleted,
    });

    if (nextCompleted) {
      // Trigger global rest timer! Stays active even across navigation
      startRest(exercise.restSeconds || 90, exercise.name);
    }
  };

  const handleFinishWorkout = () => {
    const summary = dataService.finishActiveWorkout();
    if (summary) {
      setShowCompletionSuccess(true);
      setTimeout(() => setShowCompletionSuccess(false), 5000);
    }
  };

  const handleCancelWorkout = () => {
    if (window.confirm('¿Deseas descartar la sesión activa sin guardar los registros?')) {
      dataService.cancelActiveWorkout();
    }
  };

  // Routine CRUD Handlers
  const handleOpenCreateRoutine = () => {
    setRoutineFormName('');
    setRoutineFormFocus('Fuerza & Hipertrofia');
    setRoutineFormDesc('Enfoque en tensión mecánica y sobrecarga progresiva.');
    setRoutineFormMins(50);
    setShowCreateRoutineModal(true);
  };

  const handleSaveNewRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineFormName.trim()) return;
    const created = dataService.createRoutine({
      name: routineFormName,
      focus: routineFormFocus,
      description: routineFormDesc,
      estimatedMinutes: routineFormMins,
    });
    setSelectedRoutineId(created.id);
    setShowCreateRoutineModal(false);
  };

  const handleOpenEditRoutine = () => {
    setRoutineFormName(currentRoutine.name);
    setRoutineFormFocus(currentRoutine.focus);
    setRoutineFormDesc(currentRoutine.description);
    setRoutineFormMins(currentRoutine.estimatedMinutes);
    setShowEditRoutineModal(true);
  };

  const handleSaveEditRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateRoutine(currentRoutine.id, {
      name: routineFormName,
      focus: routineFormFocus,
      description: routineFormDesc,
      estimatedMinutes: routineFormMins,
    });
    setShowEditRoutineModal(false);
  };

  const handleDeleteCurrentRoutine = () => {
    if (routines.length <= 1) {
      alert('Debes conservar al menos 1 rutina en el sistema.');
      return;
    }
    if (window.confirm(`¿Seguro que deseas eliminar la rutina "${currentRoutine.name}"?`)) {
      const nextId = routines.find((r) => r.id !== currentRoutine.id)?.id || '';
      dataService.deleteRoutine(currentRoutine.id);
      setSelectedRoutineId(nextId);
    }
  };

  // Exercise CRUD Handlers
  const handleOpenAddExercise = () => {
    setExFormName('');
    setExFormMuscle('Pectoral / Deltoides');
    setExFormModality('weighted');
    setExFormSetsCount(3);
    setExFormReps(10);
    setExFormWeight(20);
    setExFormRest(90);
    setExFormNotes('RIR 1-2, control excéntrico de 2 segundos.');
    setExFormProgressions('Variante Inclinada, Estándar, Con Pausa');
    setShowAddExerciseModal(true);
  };

  const handleSaveNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exFormName.trim()) return;

    const progressionLevels =
      exFormModality === 'bodyweight'
        ? exFormProgressions.split(',').map((p) => p.trim()).filter(Boolean)
        : undefined;

    dataService.addExerciseToRoutine(currentRoutine.id, {
      name: exFormName,
      muscleGroup: exFormMuscle,
      modality: exFormModality,
      targetNotes: exFormNotes,
      restSeconds: exFormRest,
      progressionLevels,
      targetSetsCount: exFormSetsCount,
      defaultReps: exFormReps,
      defaultWeightKg: exFormModality === 'weighted' ? exFormWeight : undefined,
    });

    setShowAddExerciseModal(false);
  };

  const handleDeleteExercise = (exerciseId: string, exName: string) => {
    if (currentRoutine.exercises.length <= 1) {
      alert('Una rutina debe tener al menos 1 ejercicio.');
      return;
    }
    if (window.confirm(`¿Eliminar "${exName}" de esta rutina?`)) {
      dataService.deleteExerciseFromRoutine(currentRoutine.id, exerciseId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Session Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA]">
              Módulo B // Entrenamiento & Sobrecarga Progresiva
            </span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#FAFAFA]" />
              {currentRoutine.name}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenEditRoutine}
                className="p-1 text-[#52525B] hover:text-[#FAFAFA] rounded transition-colors"
                title="Editar datos de esta rutina"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteCurrentRoutine}
                className="p-1 text-[#52525B] hover:text-[#EF4444] rounded transition-colors"
                title="Eliminar esta rutina"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">{currentRoutine.description}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeWorkout ? (
            <>
              <button
                onClick={handleCancelWorkout}
                className="bg-[#18181C] hover:bg-[#27272A] text-[#EF4444] border border-[#27272A] px-3 py-1.5 text-xs font-mono rounded-[4px] transition-colors"
              >
                Descartar Sesión
              </button>
              <button
                onClick={handleFinishWorkout}
                className="bg-[#10B981] hover:bg-[#059669] text-[#09090B] font-bold px-4 py-1.5 text-xs font-mono rounded-[4px] flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar & Guardar
              </button>
            </>
          ) : (
            <button
              onClick={() => handleStartWorkout(selectedRoutineId)}
              className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 text-xs font-mono rounded-[4px] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-[#09090B]" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Routine Selector Tabs + New Routine Button */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5">
          {routines.map((r) => {
            const isSelected = r.id === selectedRoutineId;
            const isOngoing = activeWorkout && activeWorkout.routineId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoutineId(r.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-[4px] border transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#18181C] text-[#FAFAFA] border-[#FAFAFA]'
                    : 'bg-[#121215] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                }`}
              >
                {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse" />}
                <span>{r.name}</span>
                <span className="text-[10px] text-[#52525B]">({r.exercises.length} ej)</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleOpenCreateRoutine}
          className="flex items-center gap-1.5 bg-[#18181C] hover:bg-[#27272A] text-[#10B981] border border-[#27272A] hover:border-[#10B981] px-3 py-2 rounded-[4px] text-xs font-mono whitespace-nowrap transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nueva Rutina</span>
        </button>
      </div>

      {/* Routine Details Bar + Add Exercise Action */}
      <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px] flex items-center justify-between font-mono text-xs text-[#A1A1AA]">
        <div className="flex items-center gap-3">
          <span>Enfoque: <strong className="text-[#FAFAFA]">{currentRoutine.focus}</strong></span>
          <span>•</span>
          <span>Tiempo: <strong className="text-[#FAFAFA]">~{currentRoutine.estimatedMinutes} min</strong></span>
        </div>

        <button
          onClick={handleOpenAddExercise}
          className="inline-flex items-center gap-1 text-[11px] text-[#FAFAFA] hover:text-[#10B981] bg-[#121215] hover:bg-[#18181C] border border-[#27272A] px-2.5 py-1 rounded-[4px] transition-colors"
        >
          <Plus className="w-3 h-3 text-[#10B981]" />
          <span>+ Añadir Ejercicio</span>
        </button>
      </div>

      {/* Success Notification */}
      {showCompletionSuccess && (
        <div className="bg-[#062016] border border-[#0A3D28] text-[#10B981] px-4 py-3 rounded-[6px] font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            ¡Sesión completada y guardada en el historial de telemetría!
          </span>
          <span className="text-[10px] text-[#A1A1AA]">Exportable a .CSV para análisis en Python</span>
        </div>
      )}

      {/* Exercises Bento List */}
      <div className="space-y-4">
        {exercisesToDisplay.map((exercise, exIndex) => {
          const completedSetsCount = exercise.sets.filter((s) => s.completed).length;
          const isAllDone = completedSetsCount === exercise.sets.length && exercise.sets.length > 0;
          const lastSet = exercise.sets[0];
          const overloadSuggestion = getOverloadSuggestion(
            exercise.modality,
            lastSet?.repsOrSeconds,
            lastSet?.weightKg,
            lastSet?.rir
          );

          return (
            <div
              key={exercise.id}
              className={`bg-[#121215] border rounded-[6px] transition-colors ${
                isAllDone ? 'border-[#10B981]/50' : 'border-[#27272A]'
              }`}
            >
              {/* Exercise Header */}
              <div className="p-3.5 border-b border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#141418]">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-mono font-bold text-[#52525B] mt-0.5">
                    {String(exIndex + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#FAFAFA]">{exercise.name}</h3>
                      <Badge
                        variant={
                          exercise.modality === 'weighted'
                            ? 'cyan'
                            : exercise.modality === 'isometric'
                            ? 'amber'
                            : 'emerald'
                        }
                        size="xs"
                      >
                        {exercise.modality === 'weighted'
                          ? 'Pesas / Lastre'
                          : exercise.modality === 'isometric'
                          ? 'Isométrico (Seg)'
                          : 'Calistenia / Peso Corp'}
                      </Badge>
                      <span className="text-[11px] font-mono text-[#52525B]">
                        {completedSetsCount}/{exercise.sets.length} series
                      </span>
                    </div>
                    <span className="text-[11px] text-[#A1A1AA]">{exercise.muscleGroup}</span>
                  </div>
                </div>

                {/* Rest, Variant Selector & Delete Exercise */}
                <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
                  <span className="flex items-center gap-1 bg-[#09090B] border border-[#27272A] px-2 py-0.5 rounded-[4px] text-[10px]">
                    <Clock className="w-3 h-3 text-[#52525B]" />
                    Descanso: {exercise.restSeconds}s
                  </span>

                  {exercise.progressionLevels && (
                    <div className="relative">
                      <select
                        aria-label="Variante biomecánica"
                        value={exercise.progressionLevels[exercise.currentProgressionIndex || 0]}
                        onChange={(e) => {
                          const idx = exercise.progressionLevels?.indexOf(e.target.value) || 0;
                          exercise.currentProgressionIndex = idx;
                          exercise.sets.forEach((s) => {
                            s.progressionLevel = e.target.value;
                          });
                          dataService.updateActiveExerciseSet(exercise.id, exercise.sets[0].id, {});
                        }}
                        className="bg-[#09090B] text-[#FAFAFA] border border-[#27272A] text-[10px] rounded-[4px] px-2 py-1 outline-none cursor-pointer max-w-[200px] truncate"
                      >
                        {exercise.progressionLevels.map((lvl, lidx) => (
                          <option key={lidx} value={lvl}>
                            Nivel {lidx + 1}: {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                    className="p-1 text-[#52525B] hover:text-[#EF4444] rounded transition-colors"
                    title="Eliminar ejercicio de la rutina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progressive Overload Engine Indicator */}
              <div className="px-3.5 py-2 bg-[#0C0C0E] border-b border-[#27272A]/70 flex items-center gap-2 text-[11px] font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span className="text-[#52525B]">MOTOR DE SOBRECARGA:</span>
                <span className="text-[#A1A1AA] truncate">{overloadSuggestion}</span>
              </div>

              {/* Zero-friction Sets Table */}
              <div className="p-3 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272A] text-[10px] uppercase text-[#52525B]">
                      <th className="py-2 px-2 w-12 text-center">Serie</th>
                      <th className="py-2 px-2">Historial Previo</th>
                      <th className="py-2 px-2">
                        {exercise.modality === 'weighted' ? 'Carga (kg)' : 'Variante Biomecánica'}
                      </th>
                      <th className="py-2 px-2 w-28">
                        {exercise.modality === 'isometric' ? 'Segundos (s)' : 'Reps'}
                      </th>
                      <th className="py-2 px-2 w-20">RIR (0-4)</th>
                      <th className="py-2 px-2 w-16 text-center">Estado</th>
                      <th className="py-2 px-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]/50">
                    {exercise.sets.map((set) => (
                      <tr
                        key={set.id}
                        className={`transition-colors ${
                          set.completed ? 'bg-[#062016]/20' : 'hover:bg-[#18181C]'
                        }`}
                      >
                        {/* Serie Number */}
                        <td className="py-2.5 px-2 text-center font-bold text-[#A1A1AA]">
                          {set.setNumber}
                        </td>

                        {/* Historial Previo */}
                        <td className="py-2.5 px-2 text-[#52525B]">
                          {set.previousHistory || '—'}
                        </td>

                        {/* Modality input (Weight or Variant) */}
                        <td className="py-2.5 px-2">
                          {exercise.modality === 'weighted' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={set.weightKg ?? ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  dataService.updateActiveExerciseSet(exercise.id, set.id, {
                                    weightKg: isNaN(val) ? 0 : val,
                                  });
                                }}
                                placeholder="0"
                                className="w-20 bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-2 py-1 rounded-[4px] text-xs outline-none"
                              />
                              <span className="text-[10px] text-[#52525B]">kg</span>
                            </div>
                          ) : (
                            <span className="text-[#A1A1AA] text-[11px] truncate block max-w-[220px]">
                              {set.progressionLevel ||
                                exercise.progressionLevels?.[exercise.currentProgressionIndex || 0] ||
                                'Peso Corporal'}
                            </span>
                          )}
                        </td>

                        {/* Reps or Seconds */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            value={set.repsOrSeconds || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              dataService.updateActiveExerciseSet(exercise.id, set.id, {
                                repsOrSeconds: isNaN(val) ? 0 : val,
                              });
                            }}
                            className="w-16 bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-2 py-1 rounded-[4px] text-xs font-semibold outline-none"
                          />
                        </td>

                        {/* RIR (Reps in Reserve 0-4) */}
                        <td className="py-2.5 px-2">
                          <select
                            aria-label="RIR Reps in Reserve"
                            value={set.rir ?? 2}
                            onChange={(e) => {
                              dataService.updateActiveExerciseSet(exercise.id, set.id, {
                                rir: parseInt(e.target.value, 10),
                              });
                            }}
                            className="bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-1.5 py-1 rounded-[4px] text-xs outline-none cursor-pointer"
                          >
                            <option value={0}>RIR 0 (Fallo)</option>
                            <option value={1}>RIR 1 (Óptimo)</option>
                            <option value={2}>RIR 2 (Sólido)</option>
                            <option value={3}>RIR 3 (Ligero)</option>
                            <option value={4}>RIR 4 (Calentamiento)</option>
                          </select>
                        </td>

                        {/* Checkbox Complete */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleSetToggle(exercise, set)}
                            className={`w-7 h-7 rounded-[4px] border flex items-center justify-center transition-all ${
                              set.completed
                                ? 'bg-[#10B981] border-[#10B981] text-[#09090B]'
                                : 'bg-[#09090B] border-[#27272A] text-transparent hover:border-[#A1A1AA]'
                            }`}
                            title={set.completed ? 'Serie Completada' : 'Marcar como Completada'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>

                        {/* Delete set */}
                        <td className="py-2.5 px-1 text-center">
                          <button
                            onClick={() => dataService.removeSetFromActiveExercise(exercise.id, set.id)}
                            className="text-[#52525B] hover:text-[#EF4444] p-1 transition-colors"
                            title="Eliminar serie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add set button */}
                <div className="mt-2.5 pt-2 border-t border-[#27272A]/40 flex justify-between items-center">
                  <button
                    onClick={() => dataService.addSetToActiveExercise(exercise.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] bg-[#18181C] hover:bg-[#27272A] border border-[#27272A] px-2.5 py-1 rounded-[4px] transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#10B981]" />
                    <span>Añadir Serie</span>
                  </button>

                  <span className="text-[10px] text-[#52525B] font-mono">
                    {exercise.targetNotes}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Nueva Rutina */}
      {showCreateRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <h3 className="text-xs uppercase font-mono font-bold text-[#FAFAFA] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#10B981]" />
                Crear Nueva Rutina
              </h3>
              <button onClick={() => setShowCreateRoutineModal(false)} className="text-[#52525B] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRoutine} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Nombre de la Rutina:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Torso Pesado // Enfoque Pectoral"
                  value={routineFormName}
                  onChange={(e) => setRoutineFormName(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Enfoque Principal:</label>
                <input
                  type="text"
                  placeholder="Ej. Hipertrofia & Fuerza Máxima"
                  value={routineFormFocus}
                  onChange={(e) => setRoutineFormFocus(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Tiempo Estimado (min):</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={routineFormMins}
                    onChange={(e) => setRoutineFormMins(parseInt(e.target.value, 10) || 45)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Descripción / Objetivos:</label>
                <textarea
                  rows={2}
                  placeholder="Objetivos biomecánicos de la sesión..."
                  value={routineFormDesc}
                  onChange={(e) => setRoutineFormDesc(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none font-sans text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowCreateRoutineModal(false)}
                  className="bg-[#18181C] text-[#A1A1AA] px-3 py-1.5 rounded-[4px] border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 rounded-[4px] transition-colors"
                >
                  Guardar Rutina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Rutina */}
      {showEditRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <h3 className="text-xs uppercase font-mono font-bold text-[#FAFAFA] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#10B981]" />
                Editar Rutina
              </h3>
              <button onClick={() => setShowEditRoutineModal(false)} className="text-[#52525B] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoutine} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Nombre de la Rutina:</label>
                <input
                  type="text"
                  required
                  value={routineFormName}
                  onChange={(e) => setRoutineFormName(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Enfoque Principal:</label>
                <input
                  type="text"
                  value={routineFormFocus}
                  onChange={(e) => setRoutineFormFocus(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Tiempo Estimado (min):</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={routineFormMins}
                  onChange={(e) => setRoutineFormMins(parseInt(e.target.value, 10) || 45)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={routineFormDesc}
                  onChange={(e) => setRoutineFormDesc(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none font-sans text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowEditRoutineModal(false)}
                  className="bg-[#18181C] text-[#A1A1AA] px-3 py-1.5 rounded-[4px] border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 rounded-[4px] transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Añadir Ejercicio a la Rutina */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <h3 className="text-xs uppercase font-mono font-bold text-[#FAFAFA] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#10B981]" />
                Añadir Ejercicio a {currentRoutine.name}
              </h3>
              <button onClick={() => setShowAddExerciseModal(false)} className="text-[#52525B] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewExercise} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Nombre del Ejercicio:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Press Militar con Mancuernas"
                    value={exFormName}
                    onChange={(e) => setExFormName(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Grupo Muscular:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hombros / Tríceps"
                    value={exFormMuscle}
                    onChange={(e) => setExFormMuscle(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Modalidad Biomecánica:</label>
                  <select
                    value={exFormModality}
                    onChange={(e) => setExFormModality(e.target.value as ExerciseModality)}
                    className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                  >
                    <option value="weighted">Pesas / Lastre (kg)</option>
                    <option value="bodyweight">Calistenia / Peso Corporal</option>
                    <option value="isometric">Isométrico / Tensión (seg)</option>
                  </select>
                </div>
              </div>

              {exFormModality === 'bodyweight' && (
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">
                    Progresiones Biomecánicas (separadas por coma):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Inclinadas, Estándar, Diamante, Arquero"
                    value={exFormProgressions}
                    onChange={(e) => setExFormProgressions(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Series Objetivo:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={exFormSetsCount}
                    onChange={(e) => setExFormSetsCount(parseInt(e.target.value, 10) || 3)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">
                    {exFormModality === 'isometric' ? 'Segundos Obj:' : 'Reps Obj:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={exFormReps}
                    onChange={(e) => setExFormReps(parseInt(e.target.value, 10) || 10)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Descanso (seg):</label>
                  <input
                    type="number"
                    step="15"
                    min="30"
                    value={exFormRest}
                    onChange={(e) => setExFormRest(parseInt(e.target.value, 10) || 90)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              </div>

              {exFormModality === 'weighted' && (
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Carga Inicial (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={exFormWeight}
                    onChange={(e) => setExFormWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Notas de Sobrecarga Progresiva:</label>
                <input
                  type="text"
                  placeholder="Ej. Pausa de 1s abajo, buscar RIR 1 en serie final"
                  value={exFormNotes}
                  onChange={(e) => setExFormNotes(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal(false)}
                  className="bg-[#18181C] text-[#A1A1AA] px-3 py-1.5 rounded-[4px] border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 rounded-[4px] transition-colors"
                >
                  Agregar a Rutina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
