export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';

export type FitnessGoal = 'cut' | 'maintenance' | 'bulk';

export type BiologicalSex = 'male' | 'female';

export interface BiometricProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  proteinPerKg: number; // 1.8 to 2.2
  fatPerKg: number;     // 0.8 to 1.0
  waterMlPerKg: number; // e.g. 35ml
  updatedAt: string;
}

export type ExerciseModality = 'bodyweight' | 'isometric' | 'weighted';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  previousHistory?: string; // e.g. "12 reps", "45s", "80kg x 8"
  progressionLevel?: string; // e.g. "Flexiones Diamante", "Pistol asistida"
  weightKg?: number;
  repsOrSeconds: number;
  rir: number; // 0 to 4
  completed: boolean;
  timestamp?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  modality: ExerciseModality;
  progressionLevels?: string[]; // Variants for calisthenics
  currentProgressionIndex?: number;
  targetNotes: string; // Progressive overload engine note
  restSeconds: number; // Default rest
  sets: ExerciseSet[];
}

export interface WorkoutRoutine {
  id: string;
  code: 'ROUTINE_A' | 'ROUTINE_B' | 'ROUTINE_C' | 'ROUTINE_D' | 'CUSTOM';
  name: string;
  description: string;
  focus: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

export interface WorkoutSessionLog {
  id: string;
  routineId: string;
  routineName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  exercisesLogged: {
    exerciseName: string;
    modality: ExerciseModality;
    sets: {
      setNumber: number;
      weightKg?: number;
      repsOrSeconds: number;
      rir: number;
      progressionVariant?: string;
      completed: boolean;
    }[];
  }[];
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'protein' | 'carb' | 'fat' | 'dairy' | 'fruit_veg' | 'legume';
  servingGrams: number; // standard 100g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  description?: string;
  isCustom?: boolean;
}

export type MealBlockType = 'pre_workout' | 'post_workout' | 'main_meal' | 'snack_night';

export interface LoggedMealEntry {
  id: string;
  foodId: string;
  foodName: string;
  block: MealBlockType;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface DailyNutritionLog {
  date: string; // YYYY-MM-DD
  entries: LoggedMealEntry[];
  waterIntakeMl: number;
}

export interface WeightRecord {
  date: string; // YYYY-MM-DD
  scaleWeightKg: number;
  emaWeightKg?: number; // 7-day exponential moving average
  notes?: string;
}

export interface DailyProtocolChecklist {
  date: string; // YYYY-MM-DD
  creatineChecked: boolean;
  creatineGrams: number;
  proteinChecked: boolean;
  hydrationChecked: boolean;
  sleepRecoveryChecked: boolean;
  sleepHours?: number;
}

export type SupplementTier = 'Tier S' | 'Tier A' | 'Tier B' | 'Tier C';

export interface SupplementSpec {
  id: string;
  name: string;
  category: 'protein' | 'creatine' | 'ergogenic' | 'micronutrient';
  tier: SupplementTier;
  evidenceSummary: string;
  mechanism: string;
  recommendedDose: string;
  timing: string;
  buyerAlerts: string[];
}

export interface MarketProductReference {
  id: string;
  brand: string;
  productName: string;
  category: 'wpi' | 'wpc' | 'wph' | 'casein' | 'creatine' | 'blend';
  scoopSizeGrams: number;
  proteinPerScoopGrams: number;
  servings: number;
  typicalPriceCop: number;
  purityPercent: number;
  pricePerGramProteinCop: number;
  invimaStatus: 'Vigente' | 'En Trámite' | 'Requiere Auditoría';
  notes: string;
  isCustomAudited?: boolean;
}

export interface SyncSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  lastSyncedAt?: string;
  isCloudSyncConfigured: boolean;
  cloudStatus?: 'connected' | 'error' | 'disconnected' | 'syncing';
  lastSyncLog?: string;
}

export interface AppStateData {
  biometrics: BiometricProfile;
  routines: WorkoutRoutine[];
  activeWorkoutSession: {
    routineId: string;
    startedAt: string;
    exercises: Exercise[];
  } | null;
  workoutHistory: WorkoutSessionLog[];
  foodDatabase: FoodItem[];
  marketProducts: MarketProductReference[];
  dailyNutrition: Record<string, DailyNutritionLog>; // Keyed by YYYY-MM-DD
  weightHistory: WeightRecord[];
  dailyChecklist: Record<string, DailyProtocolChecklist>; // Keyed by YYYY-MM-DD
  syncSettings: SyncSettings;
}
