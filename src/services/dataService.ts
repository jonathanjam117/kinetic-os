import type {
  AppStateData,
  BiometricProfile,
  WorkoutRoutine,
  WorkoutSessionLog,
  FoodItem,
  DailyNutritionLog,
  WeightRecord,
  DailyProtocolChecklist,
  SyncSettings,
  LoggedMealEntry,
  Exercise,
  ExerciseModality,
  MarketProductReference,
} from '../types';
import {
  SEED_BIOMETRICS,
  SEED_ROUTINES,
  SEED_FOODS,
  SEED_MARKET_PRODUCTS,
  generateSeedWeightHistory,
  SEED_TODAY_NUTRITION,
  SEED_TODAY_CHECKLIST,
} from '../data/seedData';
import { calculateWeightEMA } from './calculator';
import { getSupabaseClient, testSupabaseConnection } from './supabaseClient';

const STORAGE_KEY = 'KINETIC_OS_STATE_V2';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultInitialState(): AppStateData {
  const today = getTodayDateString();
  const seedWeights = generateSeedWeightHistory();

  return {
    biometrics: { ...SEED_BIOMETRICS, updatedAt: new Date().toISOString() },
    routines: JSON.parse(JSON.stringify(SEED_ROUTINES)),
    activeWorkoutSession: null,
    workoutHistory: [
      {
        id: 'hist-1',
        routineId: 'routine-a',
        routineName: 'Calistenia & Fuerza Corporal',
        date: '2026-11-14',
        durationMinutes: 48,
        totalVolumeKg: 0,
        totalSetsCompleted: 15,
        exercisesLogged: [
          {
            exerciseName: 'Dominadas / Tracción Vertical',
            modality: 'bodyweight',
            sets: [
              { setNumber: 1, repsOrSeconds: 10, rir: 2, progressionVariant: 'Dominadas estrictas estándar', completed: true },
              { setNumber: 2, repsOrSeconds: 9, rir: 1, progressionVariant: 'Dominadas estrictas estándar', completed: true },
              { setNumber: 3, repsOrSeconds: 8, rir: 1, progressionVariant: 'Dominadas estrictas estándar', completed: true },
            ],
          },
        ],
      },
    ],
    foodDatabase: JSON.parse(JSON.stringify(SEED_FOODS)),
    marketProducts: JSON.parse(JSON.stringify(SEED_MARKET_PRODUCTS)),
    dailyNutrition: {
      [today]: JSON.parse(JSON.stringify(SEED_TODAY_NUTRITION)),
    },
    weightHistory: seedWeights,
    dailyChecklist: {
      [today]: { ...SEED_TODAY_CHECKLIST, date: today },
    },
    syncSettings: {
      supabaseUrl:
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '',
      supabaseAnonKey:
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '',
      isCloudSyncConfigured: Boolean(
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
      ),
      cloudStatus: 'disconnected',
    },
  };
}

class DataService {
  private state: AppStateData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppStateData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppStateData;
        if (parsed.biometrics && parsed.routines && parsed.foodDatabase) {
          const today = getTodayDateString();
          if (!parsed.dailyNutrition[today]) {
            parsed.dailyNutrition[today] = { date: today, waterIntakeMl: 0, entries: [] };
          }
          if (!parsed.dailyChecklist[today]) {
            parsed.dailyChecklist[today] = {
              date: today,
              creatineChecked: false,
              creatineGrams: Number((parsed.biometrics.weightKg * 0.1).toFixed(1)),
              proteinChecked: false,
              hydrationChecked: false,
              sleepRecoveryChecked: false,
            };
          }
          if (!parsed.marketProducts || parsed.marketProducts.length === 0) {
            parsed.marketProducts = JSON.parse(JSON.stringify(SEED_MARKET_PRODUCTS));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse local storage, reverting to default initial state', e);
    }

    const defaultState = getDefaultInitialState();
    this.saveToStorage(defaultState);
    return defaultState;
  }

  private saveToStorage(state: AppStateData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage write failed', e);
    }
  }

  private notify() {
    this.saveToStorage(this.state);
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): AppStateData {
    return this.state;
  }

  // ==========================================
  // --- BIOMETRICS ---
  // ==========================================
  public updateBiometrics(updates: Partial<BiometricProfile>) {
    this.state.biometrics = {
      ...this.state.biometrics,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const today = getTodayDateString();
    if (this.state.dailyChecklist[today]) {
      this.state.dailyChecklist[today].creatineGrams = Number((this.state.biometrics.weightKg * 0.1).toFixed(1));
    }

    this.notify();
  }

  // ==========================================
  // --- WEIGHT HISTORY & EMA ---
  // ==========================================
  public logWeight(scaleWeightKg: number, notes?: string, dateStr?: string) {
    const date = dateStr || getTodayDateString();
    const existingIndex = this.state.weightHistory.findIndex((w) => w.date === date);

    const record: WeightRecord = {
      date,
      scaleWeightKg,
      notes: notes || undefined,
    };

    if (existingIndex >= 0) {
      this.state.weightHistory[existingIndex] = record;
    } else {
      this.state.weightHistory.push(record);
    }

    this.state.weightHistory = calculateWeightEMA(this.state.weightHistory);

    if (date === getTodayDateString()) {
      this.state.biometrics.weightKg = scaleWeightKg;
    }

    this.notify();
  }

  // ==========================================
  // --- ROUTINES & EXERCISES CRUD ---
  // ==========================================
  public createRoutine(routineData: {
    name: string;
    focus: string;
    description: string;
    estimatedMinutes: number;
  }): WorkoutRoutine {
    const newRoutine: WorkoutRoutine = {
      id: `routine-custom-${Date.now()}`,
      code: 'CUSTOM',
      name: routineData.name.trim(),
      focus: routineData.focus.trim() || 'Fuerza & Acondicionamiento',
      description: routineData.description.trim() || 'Rutina personalizada creada por el usuario.',
      estimatedMinutes: routineData.estimatedMinutes || 45,
      exercises: [],
    };

    this.state.routines.push(newRoutine);
    this.notify();
    return newRoutine;
  }

  public updateRoutine(routineId: string, updates: Partial<WorkoutRoutine>) {
    const routine = this.state.routines.find((r) => r.id === routineId);
    if (!routine) return;

    Object.assign(routine, updates);
    this.notify();
  }

  public deleteRoutine(routineId: string): boolean {
    if (this.state.routines.length <= 1) {
      return false; // Prevent deleting the last remaining routine
    }

    this.state.routines = this.state.routines.filter((r) => r.id !== routineId);

    // If active session belongs to deleted routine, cancel it
    if (this.state.activeWorkoutSession?.routineId === routineId) {
      this.state.activeWorkoutSession = null;
    }

    this.notify();
    return true;
  }

  public addExerciseToRoutine(
    routineId: string,
    exerciseData: {
      name: string;
      muscleGroup: string;
      modality: ExerciseModality;
      targetNotes: string;
      restSeconds: number;
      progressionLevels?: string[];
      targetSetsCount: number;
      defaultReps?: number;
      defaultWeightKg?: number;
    }
  ): Exercise | null {
    const routine = this.state.routines.find((r) => r.id === routineId);
    if (!routine) return null;

    const count = Math.max(1, Math.min(10, exerciseData.targetSetsCount || 3));
    const sets = [];
    for (let i = 1; i <= count; i++) {
      sets.push({
        id: `set-${Date.now()}-${i}`,
        setNumber: i,
        previousHistory:
          exerciseData.modality === 'weighted'
            ? `${exerciseData.defaultWeightKg || 0}kg x ${exerciseData.defaultReps || 10}`
            : exerciseData.modality === 'isometric'
            ? `${exerciseData.defaultReps || 30}s`
            : `${exerciseData.defaultReps || 10} reps`,
        progressionLevel: exerciseData.progressionLevels?.[0],
        weightKg: exerciseData.modality === 'weighted' ? exerciseData.defaultWeightKg || 0 : undefined,
        repsOrSeconds: exerciseData.defaultReps || (exerciseData.modality === 'isometric' ? 30 : 10),
        rir: 2,
        completed: false,
      });
    }

    const newExercise: Exercise = {
      id: `ex-${Date.now()}`,
      name: exerciseData.name.trim(),
      muscleGroup: exerciseData.muscleGroup.trim() || 'General',
      modality: exerciseData.modality,
      progressionLevels:
        exerciseData.modality === 'bodyweight' && exerciseData.progressionLevels?.length
          ? exerciseData.progressionLevels
          : undefined,
      currentProgressionIndex: 0,
      targetNotes: exerciseData.targetNotes.trim() || 'Mantener técnica limpia y control excéntrico.',
      restSeconds: exerciseData.restSeconds || 90,
      sets,
    };

    routine.exercises.push(newExercise);

    // If active workout session is on this routine, sync exercises
    if (this.state.activeWorkoutSession && this.state.activeWorkoutSession.routineId === routineId) {
      this.state.activeWorkoutSession.exercises.push(JSON.parse(JSON.stringify(newExercise)));
    }

    this.notify();
    return newExercise;
  }

  public updateExerciseInRoutine(
    routineId: string,
    exerciseId: string,
    updates: Partial<Exercise>
  ) {
    const routine = this.state.routines.find((r) => r.id === routineId);
    if (!routine) return;

    const exercise = routine.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    Object.assign(exercise, updates);

    if (this.state.activeWorkoutSession && this.state.activeWorkoutSession.routineId === routineId) {
      const activeEx = this.state.activeWorkoutSession.exercises.find((ex) => ex.id === exerciseId);
      if (activeEx) {
        Object.assign(activeEx, updates);
      }
    }

    this.notify();
  }

  public deleteExerciseFromRoutine(routineId: string, exerciseId: string): boolean {
    const routine = this.state.routines.find((r) => r.id === routineId);
    if (!routine || routine.exercises.length <= 1) return false;

    routine.exercises = routine.exercises.filter((ex) => ex.id !== exerciseId);

    if (this.state.activeWorkoutSession && this.state.activeWorkoutSession.routineId === routineId) {
      this.state.activeWorkoutSession.exercises = this.state.activeWorkoutSession.exercises.filter(
        (ex) => ex.id !== exerciseId
      );
    }

    this.notify();
    return true;
  }

  // ==========================================
  // --- ACTIVE WORKOUT SESSION ---
  // ==========================================
  public startWorkout(routineId: string) {
    const routine = this.state.routines.find((r) => r.id === routineId);
    if (!routine) return;

    this.state.activeWorkoutSession = {
      routineId,
      startedAt: new Date().toISOString(),
      exercises: JSON.parse(JSON.stringify(routine.exercises)),
    };
    this.notify();
  }

  public updateActiveExerciseSet(
    exerciseId: string,
    setId: string,
    updates: Partial<Exercise['sets'][0]>
  ) {
    if (!this.state.activeWorkoutSession) return;

    const exercise = this.state.activeWorkoutSession.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    const set = exercise.sets.find((s) => s.id === setId);
    if (!set) return;

    Object.assign(set, updates);
    this.notify();
  }

  public addSetToActiveExercise(exerciseId: string) {
    if (!this.state.activeWorkoutSession) return;
    const exercise = this.state.activeWorkoutSession.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSetNumber = exercise.sets.length + 1;

    exercise.sets.push({
      id: `set-${Date.now()}-${newSetNumber}`,
      setNumber: newSetNumber,
      previousHistory: lastSet ? `${lastSet.repsOrSeconds} reps` : '10 reps',
      progressionLevel: lastSet?.progressionLevel,
      weightKg: lastSet?.weightKg,
      repsOrSeconds: lastSet?.repsOrSeconds || 10,
      rir: 2,
      completed: false,
    });
    this.notify();
  }

  public removeSetFromActiveExercise(exerciseId: string, setId: string) {
    if (!this.state.activeWorkoutSession) return;
    const exercise = this.state.activeWorkoutSession.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise || exercise.sets.length <= 1) return;

    exercise.sets = exercise.sets.filter((s) => s.id !== setId).map((s, idx) => ({
      ...s,
      setNumber: idx + 1,
    }));
    this.notify();
  }

  public finishActiveWorkout(): WorkoutSessionLog | null {
    if (!this.state.activeWorkoutSession) return null;

    const routine = this.state.routines.find((r) => r.id === this.state.activeWorkoutSession?.routineId);
    const routineName = routine?.name || 'Rutina Personalizada';

    const startTime = new Date(this.state.activeWorkoutSession.startedAt).getTime();
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / (1000 * 60)));

    let totalVolumeKg = 0;
    let totalSetsCompleted = 0;

    const exercisesLogged = this.state.activeWorkoutSession.exercises.map((ex) => {
      const loggedSets = ex.sets.map((s) => {
        if (s.completed) {
          totalSetsCompleted += 1;
          if (s.weightKg && s.weightKg > 0) {
            totalVolumeKg += s.weightKg * s.repsOrSeconds;
          }
        }
        return {
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          repsOrSeconds: s.repsOrSeconds,
          rir: s.rir,
          progressionVariant: s.progressionLevel,
          completed: s.completed,
        };
      });

      return {
        exerciseName: ex.name,
        modality: ex.modality,
        sets: loggedSets,
      };
    });

    const sessionLog: WorkoutSessionLog = {
      id: `workout-log-${Date.now()}`,
      routineId: this.state.activeWorkoutSession.routineId,
      routineName,
      date: getTodayDateString(),
      durationMinutes,
      totalVolumeKg: Math.round(totalVolumeKg),
      totalSetsCompleted,
      exercisesLogged,
    };

    this.state.workoutHistory.unshift(sessionLog);
    this.state.activeWorkoutSession = null;
    this.notify();

    // Trigger background cloud sync if configured
    if (this.state.syncSettings.isCloudSyncConfigured) {
      this.pushToSupabase().catch(() => {});
    }

    return sessionLog;
  }

  public cancelActiveWorkout() {
    this.state.activeWorkoutSession = null;
    this.notify();
  }

  // ==========================================
  // --- FOOD DATABASE CRUD & MEAL LOGGING ---
  // ==========================================
  public addCustomFood(foodData: Omit<FoodItem, 'id'>): FoodItem {
    const newFood: FoodItem = {
      id: `food-custom-${Date.now()}`,
      ...foodData,
      isCustom: true,
    };
    this.state.foodDatabase.unshift(newFood);
    this.notify();
    return newFood;
  }

  public deleteFood(foodId: string) {
    this.state.foodDatabase = this.state.foodDatabase.filter((f) => f.id !== foodId);
    this.notify();
  }

  public logFoodEntry(
    food: FoodItem,
    grams: number,
    block: LoggedMealEntry['block'],
    dateStr?: string
  ) {
    const date = dateStr || getTodayDateString();
    if (!this.state.dailyNutrition[date]) {
      this.state.dailyNutrition[date] = { date, waterIntakeMl: 0, entries: [] };
    }

    const factor = grams / 100;
    const entry: LoggedMealEntry = {
      id: `meal-${Date.now()}`,
      foodId: food.id,
      foodName: food.name,
      block,
      grams,
      calories: Math.round(food.caloriesPer100g * factor),
      protein: Number((food.proteinPer100g * factor).toFixed(1)),
      carbs: Number((food.carbsPer100g * factor).toFixed(1)),
      fat: Number((food.fatPer100g * factor).toFixed(1)),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.state.dailyNutrition[date].entries.push(entry);
    this.notify();
  }

  public removeFoodEntry(entryId: string, dateStr?: string) {
    const date = dateStr || getTodayDateString();
    if (!this.state.dailyNutrition[date]) return;

    this.state.dailyNutrition[date].entries = this.state.dailyNutrition[date].entries.filter(
      (e) => e.id !== entryId
    );
    this.notify();
  }

  public updateWaterIntake(deltaMl: number, dateStr?: string) {
    const date = dateStr || getTodayDateString();
    if (!this.state.dailyNutrition[date]) {
      this.state.dailyNutrition[date] = { date, waterIntakeMl: 0, entries: [] };
    }
    const current = this.state.dailyNutrition[date].waterIntakeMl || 0;
    this.state.dailyNutrition[date].waterIntakeMl = Math.max(0, current + deltaMl);
    this.notify();
  }

  // ==========================================
  // --- MARKET SUPPLEMENTS CRUD ---
  // ==========================================
  public saveAuditedProduct(productData: Omit<MarketProductReference, 'id'>): MarketProductReference {
    const newProduct: MarketProductReference = {
      id: `prod-audited-${Date.now()}`,
      ...productData,
      isCustomAudited: true,
    };
    this.state.marketProducts.unshift(newProduct);
    this.notify();
    return newProduct;
  }

  public deleteMarketProduct(productId: string) {
    this.state.marketProducts = this.state.marketProducts.filter((p) => p.id !== productId);
    this.notify();
  }

  // ==========================================
  // --- DAILY CHECKLIST ---
  // ==========================================
  public toggleDailyChecklistItem(
    item: 'creatineChecked' | 'proteinChecked' | 'hydrationChecked' | 'sleepRecoveryChecked',
    dateStr?: string
  ) {
    const date = dateStr || getTodayDateString();
    if (!this.state.dailyChecklist[date]) {
      this.state.dailyChecklist[date] = {
        date,
        creatineChecked: false,
        creatineGrams: Number((this.state.biometrics.weightKg * 0.1).toFixed(1)),
        proteinChecked: false,
        hydrationChecked: false,
        sleepRecoveryChecked: false,
      };
    }

    this.state.dailyChecklist[date][item] = !this.state.dailyChecklist[date][item];
    this.notify();
  }

  // ==========================================
  // --- REAL SUPABASE SYNC (DUAL-WRITE) ---
  // ==========================================
  public updateSyncSettings(settings: Partial<SyncSettings>) {
    const isConfigured = Boolean(
      settings.supabaseUrl || this.state.syncSettings.supabaseUrl
    );
    this.state.syncSettings = {
      ...this.state.syncSettings,
      ...settings,
      isCloudSyncConfigured: isConfigured,
      cloudStatus: isConfigured ? 'connected' : 'disconnected',
    };
    this.notify();
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    const res = await testSupabaseConnection(
      this.state.syncSettings.supabaseUrl,
      this.state.syncSettings.supabaseAnonKey
    );
    this.state.syncSettings.cloudStatus = res.success ? 'connected' : 'error';
    this.state.syncSettings.lastSyncLog = res.message;
    this.notify();
    return res;
  }

  public async pushToSupabase(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient(
      this.state.syncSettings.supabaseUrl,
      this.state.syncSettings.supabaseAnonKey
    );

    if (!client) {
      return { success: false, message: 'Supabase no está configurado (faltan URL y Key).' };
    }

    try {
      this.state.syncSettings.cloudStatus = 'syncing';
      this.notify();

      // Push Biometrics snapshot
      const b = this.state.biometrics;
      await client.from('user_biometrics').upsert({
        weight_kg: b.weightKg,
        height_cm: b.heightCm,
        age: b.age,
        sex: b.sex,
        activity_level: b.activityLevel,
        goal: b.goal,
        protein_per_kg: b.proteinPerKg,
        fat_per_kg: b.fatPerKg,
        water_ml_per_kg: b.waterMlPerKg,
        updated_at: new Date().toISOString(),
      });

      // Push Weight Records
      if (this.state.weightHistory.length > 0) {
        const payload = this.state.weightHistory.map((w) => ({
          record_date: w.date,
          scale_weight_kg: w.scaleWeightKg,
          ema_weight_kg: w.emaWeightKg,
          notes: w.notes || null,
        }));
        await client.from('weight_records').upsert(payload, { onConflict: 'record_date' });
      }

      this.state.syncSettings.cloudStatus = 'connected';
      this.state.syncSettings.lastSyncedAt = new Date().toISOString();
      this.state.syncSettings.lastSyncLog = `Push exitoso a Supabase (${new Date().toLocaleTimeString()}).`;
      this.notify();
      return { success: true, message: 'Datos sincronizados exitosamente con Supabase.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.state.syncSettings.cloudStatus = 'error';
      this.state.syncSettings.lastSyncLog = `Error al sincronizar: ${errorMsg}`;
      this.notify();
      return { success: false, message: errorMsg };
    }
  }

  public async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient(
      this.state.syncSettings.supabaseUrl,
      this.state.syncSettings.supabaseAnonKey
    );

    if (!client) {
      return { success: false, message: 'Supabase no está configurado.' };
    }

    try {
      this.state.syncSettings.cloudStatus = 'syncing';
      this.notify();

      // Pull weight records
      const { data: weights, error: wError } = await client
        .from('weight_records')
        .select('*')
        .order('record_date', { ascending: true });

      if (!wError && weights && weights.length > 0) {
        this.state.weightHistory = weights.map((r: { record_date: string; scale_weight_kg: number; ema_weight_kg?: number; notes?: string }) => ({
          date: r.record_date,
          scaleWeightKg: Number(r.scale_weight_kg),
          emaWeightKg: r.ema_weight_kg ? Number(r.ema_weight_kg) : undefined,
          notes: r.notes || undefined,
        }));
      }

      this.state.syncSettings.cloudStatus = 'connected';
      this.state.syncSettings.lastSyncedAt = new Date().toISOString();
      this.state.syncSettings.lastSyncLog = `Pull exitoso de Supabase (${new Date().toLocaleTimeString()}).`;
      this.notify();
      return { success: true, message: 'Datos descargados y consolidados desde Supabase.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.state.syncSettings.cloudStatus = 'error';
      this.state.syncSettings.lastSyncLog = `Error al descargar: ${errorMsg}`;
      this.notify();
      return { success: false, message: errorMsg };
    }
  }

  // ==========================================
  // --- EXPORT & IMPORT ---
  // ==========================================
  public exportBackupJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public exportTrainingHistoryCsv(): string {
    const headers = [
      'session_date',
      'routine_name',
      'duration_minutes',
      'exercise_name',
      'modality',
      'set_number',
      'weight_kg',
      'reps_or_seconds',
      'rir',
      'progression_variant',
      'completed',
    ];

    const rows: string[] = [headers.join(',')];

    this.state.workoutHistory.forEach((session) => {
      session.exercisesLogged.forEach((ex) => {
        ex.sets.forEach((set) => {
          const row = [
            `"${session.date}"`,
            `"${session.routineName.replace(/"/g, '""')}"`,
            session.durationMinutes,
            `"${ex.exerciseName.replace(/"/g, '""')}"`,
            `"${ex.modality}"`,
            set.setNumber,
            set.weightKg ?? '',
            set.repsOrSeconds,
            set.rir ?? '',
            `"${(set.progressionVariant || '').replace(/"/g, '""')}"`,
            set.completed ? '1' : '0',
          ];
          rows.push(row.join(','));
        });
      });
    });

    return rows.join('\n');
  }

  public importBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString) as AppStateData;
      if (!parsed.biometrics || !parsed.routines || !parsed.foodDatabase) {
        return { success: false, error: 'Estructura de JSON inválida: Faltan campos requeridos de KINETIC // OS.' };
      }
      this.state = parsed;
      this.notify();
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  public resetToFactoryDefaults() {
    this.state = getDefaultInitialState();
    this.notify();
  }
}

export const dataService = new DataService();
