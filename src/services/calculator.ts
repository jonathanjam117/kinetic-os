import type { BiometricProfile, WeightRecord } from '../types';

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
} as const;

export const GOAL_ADJUSTMENTS = {
  cut: -400,
  maintenance: 0,
  bulk: 250,
} as const;

export interface CaloricAndMacroTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  proteinCalories: number;
  fatGrams: number;
  fatCalories: number;
  carbGrams: number;
  carbCalories: number;
  waterTargetMl: number;
  creatineDailyGrams: number;
}

/**
 * Calculates Mifflin-St Jeor Basal Metabolic Rate and Macro Targets
 */
export function calculateBioenergetics(profile: BiometricProfile): CaloricAndMacroTargets {
  const { weightKg, heightCm, age, sex, activityLevel, goal, proteinPerKg, fatPerKg, waterMlPerKg } = profile;

  // Mifflin-St Jeor formula
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  const goalAdjustment = GOAL_ADJUSTMENTS[goal] || 0;
  const targetCalories = Math.max(1200, Math.round(tdee + goalAdjustment));

  // Protein calculation
  const safeProteinPerKg = Math.min(2.4, Math.max(1.6, proteinPerKg || 2.0));
  const proteinGrams = Math.round(weightKg * safeProteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Fat calculation (essential fatty acids minimum 0.8g/kg)
  const safeFatPerKg = Math.min(1.2, Math.max(0.7, fatPerKg || 0.9));
  const fatGrams = Math.round(weightKg * safeFatPerKg);
  const fatCalories = fatGrams * 9;

  // Carbohydrate calculation: Remaining caloric allocation
  const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbGrams = Math.round(remainingCalories / 4);
  const carbCalories = carbGrams * 4;

  // Hydration target: default 35ml per kg of bodyweight
  const waterTargetMl = Math.round(weightKg * (waterMlPerKg || 35));

  // Scientific daily continuous creatine monohydrate dose (0.1g/kg)
  const creatineDailyGrams = Number((weightKg * 0.1).toFixed(1));

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    proteinGrams,
    proteinCalories,
    fatGrams,
    fatCalories,
    carbGrams,
    carbCalories,
    waterTargetMl,
    creatineDailyGrams,
  };
}

/**
 * Calculates 7-day Exponential Moving Average (EMA) for weight records
 * Alpha = 2 / (N + 1). For N = 7, Alpha = 2 / (7 + 1) = 0.25
 * Filters water, glycogen, and sodium fluctuations.
 */
export function calculateWeightEMA(records: WeightRecord[]): WeightRecord[] {
  if (!records || records.length === 0) return [];

  // Sort chronologically ascending
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const alpha = 2 / (7 + 1); // 0.25
  let currentEMA = sorted[0].scaleWeightKg;

  return sorted.map((record, index) => {
    if (index === 0) {
      currentEMA = record.scaleWeightKg;
    } else {
      currentEMA = record.scaleWeightKg * alpha + currentEMA * (1 - alpha);
    }

    return {
      ...record,
      emaWeightKg: Number(currentEMA.toFixed(2)),
    };
  });
}

export interface ProteinPurityAuditResult {
  purityPercent: number;
  totalProteinInTubGrams: number;
  costPerGramProteinCop: number;
  costPerScoopCop: number;
  status: 'optimal' | 'standard' | 'warning' | 'alert_adulterated';
  statusLabel: string;
  verdictDescription: string;
}

/**
 * Scientific Anti-Fraud & Value Auditor for Protein Powders
 */
export function auditProteinPurityAndCost(
  scoopSizeGrams: number,
  proteinPerScoopGrams: number,
  servingsCount: number,
  priceCop: number
): ProteinPurityAuditResult {
  if (!scoopSizeGrams || scoopSizeGrams <= 0 || !proteinPerScoopGrams || proteinPerScoopGrams <= 0) {
    return {
      purityPercent: 0,
      totalProteinInTubGrams: 0,
      costPerGramProteinCop: 0,
      costPerScoopCop: 0,
      status: 'warning',
      statusLabel: 'DATOS INSUFICIENTES',
      verdictDescription: 'Ingresa valores válidos de scoop y proteína declarada.',
    };
  }

  const purityPercent = Number(((proteinPerScoopGrams / scoopSizeGrams) * 100).toFixed(1));
  const safeServings = Math.max(1, servingsCount || 1);
  const totalProteinInTubGrams = Number((proteinPerScoopGrams * safeServings).toFixed(1));
  const costPerGramProteinCop = totalProteinInTubGrams > 0 ? Math.round(priceCop / totalProteinInTubGrams) : 0;
  const costPerScoopCop = safeServings > 0 ? Math.round(priceCop / safeServings) : 0;

  let status: 'optimal' | 'standard' | 'warning' | 'alert_adulterated' = 'standard';
  let statusLabel = 'CONCENTRADO ESTÁNDAR (70-79%)';
  let verdictDescription = 'Concentración típica de suero lácteo WPC. Contiene carbohidratos residuales y trazas de grasa.';

  if (purityPercent >= 80) {
    status = 'optimal';
    statusLabel = 'ALTA PUREZA / AISLADA (≥ 80%)';
    verdictDescription = 'Grado farmacéutico o WPI microfiltrada. Bajo en lactosa y sin rellenos de carbohidratos.';
  } else if (purityPercent < 70) {
    status = 'alert_adulterated';
    statusLabel = 'ALERTA DE RELLENO (< 70%)';
    verdictDescription = 'CRÍTICO: Probable presencia de carbohidratos añadidos (maltodextrina, harina de avena) o amino spiking con glicina/taurina para inflar el nitrógeno.';
  }

  return {
    purityPercent,
    totalProteinInTubGrams,
    costPerGramProteinCop,
    costPerScoopCop,
    status,
    statusLabel,
    verdictDescription,
  };
}

/**
 * Suggests technical progressive overload target based on previous sets
 */
export function getOverloadSuggestion(
  modality: 'bodyweight' | 'isometric' | 'weighted',
  previousRepsOrSeconds?: number,
  previousWeightKg?: number,
  previousRir?: number
): string {
  if (!previousRepsOrSeconds && !previousWeightKg) {
    return 'Establecer línea base: registrar con RIR 1-2';
  }

  if (modality === 'weighted') {
    if (previousRir !== undefined && previousRir >= 2) {
      return `Objetivo: +1-2 reps con ${previousWeightKg || 0}kg o subir +2.5kg manteniendo ${previousRepsOrSeconds || 8} reps (RIR 1)`;
    }
    return `Consolidar carga: mantener ${previousWeightKg || 0}kg buscando +1 rep limpia`;
  }

  if (modality === 'isometric') {
    const targetSec = (previousRepsOrSeconds || 30) + 5;
    return `Sobrecarga temporal: sostener +5 seg (${previousRepsOrSeconds}s ➔ ${targetSec}s) con máxima tensión intra-abdominal`;
  }

  // Bodyweight
  const targetReps = (previousRepsOrSeconds || 10) + 1;
  return `Progresión de volumen: buscar +1 rep (${previousRepsOrSeconds} ➔ ${targetReps} reps) o avanzar a la siguiente variante biomecánica si RIR ≥ 3`;
}
