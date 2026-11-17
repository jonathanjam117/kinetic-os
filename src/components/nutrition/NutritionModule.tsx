import React, { useState, useMemo } from 'react';
import type { BiometricProfile, FoodItem, DailyNutritionLog, MealBlockType } from '../../types';
import { calculateBioenergetics } from '../../services/calculator';
import { dataService } from '../../services/dataService';
import { Badge } from '../common/Badge';
import {
  Utensils,
  Search,
  Plus,
  Trash2,
  Droplets,
  Sliders,
  ChevronRight,
  X,
  FilePlus2,
} from 'lucide-react';

interface NutritionModuleProps {
  biometrics: BiometricProfile;
  foodDatabase: FoodItem[];
  dailyNutrition: DailyNutritionLog;
}

export const NutritionModule: React.FC<NutritionModuleProps> = ({
  biometrics,
  foodDatabase,
  dailyNutrition,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [inputGrams, setInputGrams] = useState<number>(150);
  const [targetBlock, setTargetBlock] = useState<MealBlockType>('post_workout');
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Modal for creating custom food
  const [showCreateFoodModal, setShowCreateFoodModal] = useState<boolean>(false);
  const [foodFormName, setFoodFormName] = useState('');
  const [foodFormCat, setFoodFormCat] = useState<FoodItem['category']>('protein');
  const [foodFormKcal, setFoodFormKcal] = useState(150);
  const [foodFormP, setFoodFormP] = useState(20);
  const [foodFormC, setFoodFormC] = useState(0);
  const [foodFormF, setFoodFormF] = useState(5);
  const [foodFormDesc, setFoodFormDesc] = useState('');

  // Biological targets based on Mifflin-St Jeor
  const targets = useMemo(() => calculateBioenergetics(biometrics), [biometrics]);

  // Daily consumed totals
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

  // Filter food database
  const filteredFoods = useMemo(() => {
    return foodDatabase.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || food.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [foodDatabase, searchQuery, selectedCategory]);

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood || inputGrams <= 0) return;
    dataService.logFoodEntry(selectedFood, inputGrams, targetBlock);
    setSelectedFood(null);
    setInputGrams(150);
  };

  const handleQuickAddWater = (deltaMl: number) => {
    dataService.updateWaterIntake(deltaMl);
  };

  const handleSaveCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodFormName.trim()) return;

    const created = dataService.addCustomFood({
      name: foodFormName.trim(),
      category: foodFormCat,
      servingGrams: 100,
      caloriesPer100g: foodFormKcal,
      proteinPer100g: foodFormP,
      carbsPer100g: foodFormC,
      fatPer100g: foodFormF,
      description: foodFormDesc.trim() || 'Alimento personalizado registrado por el usuario.',
    });

    setSelectedFood(created);
    setShowCreateFoodModal(false);
  };

  // Meal blocks definitions
  const blocks: { type: MealBlockType; label: string; description: string }[] = [
    { type: 'pre_workout', label: '01 // Pre-Entreno', description: 'Carbohidratos complejos + proteína magra de fácil vaciado gástrico' },
    { type: 'post_workout', label: '02 // Post-Entreno', description: 'Síntesis proteica acelerada (mTOR) y reposición de glucógeno muscular' },
    { type: 'main_meal', label: '03 // Comida Principal', description: 'Almuerzo o cena con micronutrientes, vegetales y grasas monoinsaturadas' },
    { type: 'snack_night', label: '04 // Snack / Nocturno', description: 'Proteína de liberación lenta (caseína/lácteos) o grasas saludables' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Target Summary */}
      <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]/70 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
              <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA]">
                Módulo C // Nutrición de Precisión & Bioenergética (MacroFactor DNA)
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#FAFAFA]" />
              Bioenergética Mifflin-St Jeor & Registro por Gramaje
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              TDEE: <span className="font-mono text-[#FAFAFA] font-medium">{targets.tdee} kcal</span> |
              Meta ({biometrics.goal}): <span className="font-mono text-[#10B981] font-semibold">{targets.targetCalories} kcal</span> |
              BMR: <span className="font-mono text-[#52525B]">{targets.bmr} kcal</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateFoodModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#18181C] hover:bg-[#27272A] text-[#10B981] border border-[#27272A] hover:border-[#10B981] px-3 py-1.5 text-xs font-mono rounded-[4px] transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>+ Nuevo Alimento</span>
            </button>
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className="inline-flex items-center gap-1.5 bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] px-3 py-1.5 text-xs font-mono rounded-[4px] transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ajustar Parámetros</span>
            </button>
          </div>
        </div>

        {/* Real-time Macro Telemetry Progress Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Calories */}
          <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px]">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="text-[#A1A1AA] uppercase">Calorías Totales</span>
              <span className="text-[#FAFAFA] font-semibold">
                {consumed.calories} / {targets.targetCalories} kcal
              </span>
            </div>
            <div className="w-full bg-[#18181C] h-1 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  consumed.calories > targets.targetCalories + 150 ? 'bg-[#EF4444]' : 'bg-[#FAFAFA]'
                }`}
                style={{ width: `${Math.min(100, (consumed.calories / targets.targetCalories) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#52525B] mt-1.5 block">
              Restantes: {Math.max(0, targets.targetCalories - consumed.calories)} kcal
            </span>
          </div>

          {/* Protein */}
          <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px]">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="text-[#10B981] uppercase font-semibold">Proteína (g)</span>
              <span className="text-[#10B981] font-semibold">
                {consumed.protein} / {targets.proteinGrams}g
              </span>
            </div>
            <div className="w-full bg-[#18181C] h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.protein / targets.proteinGrams) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#52525B] mt-1.5 block">
              Meta: {biometrics.proteinPerKg}g/kg ({targets.proteinCalories} kcal)
            </span>
          </div>

          {/* Carbs */}
          <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px]">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="text-[#06B6D4] uppercase font-semibold">Carbohidratos (g)</span>
              <span className="text-[#FAFAFA] font-semibold">
                {consumed.carbs} / {targets.carbGrams}g
              </span>
            </div>
            <div className="w-full bg-[#18181C] h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#06B6D4] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.carbs / targets.carbGrams) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#52525B] mt-1.5 block">
              Glucógeno: {targets.carbCalories} kcal
            </span>
          </div>

          {/* Fats */}
          <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px]">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="text-[#F59E0B] uppercase font-semibold">Grasas Esenciales</span>
              <span className="text-[#FAFAFA] font-semibold">
                {consumed.fat} / {targets.fatGrams}g
              </span>
            </div>
            <div className="w-full bg-[#18181C] h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F59E0B] transition-all duration-300"
                style={{ width: `${Math.min(100, (consumed.fat / targets.fatGrams) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#52525B] mt-1.5 block">
              Lípido: {biometrics.fatPerKg}g/kg ({targets.fatCalories} kcal)
            </span>
          </div>
        </div>

        {/* Drawer for Biometric Parameters Customization */}
        {showConfigDrawer && (
          <div className="mt-4 pt-4 border-t border-[#27272A] bg-[#09090B] p-4 rounded-[4px] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-mono text-[#FAFAFA] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
                Parámetros de Cálculo Bioenergético
              </h4>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="text-xs font-mono text-[#52525B] hover:text-[#FAFAFA]"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">
                  Proteína por kg de peso (1.8 a 2.2g):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1.8"
                    max="2.2"
                    step="0.05"
                    value={biometrics.proteinPerKg}
                    onChange={(e) =>
                      dataService.updateBiometrics({ proteinPerKg: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#FAFAFA]"
                  />
                  <span className="text-xs font-mono font-bold text-[#FAFAFA] w-12">
                    {biometrics.proteinPerKg}g
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">
                  Grasa esencial por kg (0.8 a 1.0g):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.8"
                    max="1.0"
                    step="0.05"
                    value={biometrics.fatPerKg}
                    onChange={(e) =>
                      dataService.updateBiometrics({ fatPerKg: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#FAFAFA]"
                  />
                  <span className="text-xs font-mono font-bold text-[#FAFAFA] w-12">
                    {biometrics.fatPerKg}g
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">
                  Objetivo Calórico Actual:
                </label>
                <select
                  value={biometrics.goal}
                  onChange={(e) =>
                    dataService.updateBiometrics({ goal: e.target.value as BiometricProfile['goal'] })
                  }
                  className="w-full bg-[#121215] border border-[#27272A] text-[#FAFAFA] font-mono text-xs px-2.5 py-1.5 rounded-[4px] outline-none"
                >
                  <option value="cut">Definición / Déficit (-400 kcal)</option>
                  <option value="maintenance">Mantenimiento / Recomposición (0 kcal)</option>
                  <option value="bulk">Volumen Limpio / Superávit (+250 kcal)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Food Search & Logging Engine vs Today's Meal Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Food Search & Quick Gram Entry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#10B981]" />
                Catálogo de Alimentos ({foodDatabase.length})
              </h3>
              <button
                onClick={() => setShowCreateFoodModal(true)}
                className="text-[10px] font-mono text-[#10B981] hover:underline"
              >
                + Crear
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
              <input
                type="text"
                placeholder="Buscar pechuga, arroz, huevos, avena..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-sans pl-8 pr-3 py-1.5 text-xs rounded-[4px] outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-3 scrollbar-none text-[10px] font-mono">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'protein', label: 'Proteínas' },
                { id: 'carb', label: 'Carbohidratos' },
                { id: 'fat', label: 'Grasas' },
                { id: 'dairy', label: 'Lácteos' },
                { id: 'legume', label: 'Legumbres' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-[3px] border whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#FAFAFA] text-[#09090B] border-[#FAFAFA] font-semibold'
                      : 'bg-[#09090B] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Food Selection List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-[#27272A]/40 border border-[#27272A] rounded-[4px] bg-[#09090B]">
              {filteredFoods.map((food) => {
                const isSelected = selectedFood?.id === food.id;
                return (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className={`p-2.5 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-[#18181C] border-l-2 border-[#10B981]' : 'hover:bg-[#121215]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[#FAFAFA] text-[11px] flex items-center gap-1.5">
                        <span>{food.name}</span>
                        {food.isCustom && <Badge variant="emerald" size="xs">CUSTOM</Badge>}
                      </div>
                      <div className="font-mono text-[10px] text-[#52525B]">
                        Por 100g: <span className="text-[#A1A1AA]">{food.caloriesPer100g} kcal</span> | P:{' '}
                        <span className="text-[#10B981]">{food.proteinPer100g}g</span> | C:{' '}
                        <span className="text-[#06B6D4]">{food.carbsPer100g}g</span> | G:{' '}
                        <span className="text-[#F59E0B]">{food.fatPer100g}g</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {food.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Eliminar ${food.name}?`)) {
                              dataService.deleteFood(food.id);
                              if (selectedFood?.id === food.id) setSelectedFood(null);
                            }
                          }}
                          className="text-[#52525B] hover:text-[#EF4444] p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-[#52525B]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Food Gram Entry Form */}
            {selectedFood && (
              <form onSubmit={handleAddFood} className="mt-4 pt-3 border-t border-[#27272A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FAFAFA] truncate max-w-[200px]">
                    {selectedFood.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#10B981]">Alimento Seleccionado</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#52525B] block mb-1">
                      Gramos Consumidos:
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="1"
                      required
                      value={inputGrams}
                      onChange={(e) => setInputGrams(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#52525B] block mb-1">
                      Bloque de Comida:
                    </label>
                    <select
                      value={targetBlock}
                      onChange={(e) => setTargetBlock(e.target.value as MealBlockType)}
                      className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] font-mono text-xs px-2 py-1.5 rounded-[4px] outline-none"
                    >
                      <option value="pre_workout">Pre-Entreno</option>
                      <option value="post_workout">Post-Entreno</option>
                      <option value="main_meal">Comida Principal</option>
                      <option value="snack_night">Snack / Noche</option>
                    </select>
                  </div>
                </div>

                {/* Real-time calculated telemetry for this entry */}
                <div className="bg-[#09090B] border border-[#27272A] p-2 rounded-[4px] font-mono text-[11px] flex justify-between">
                  <div>
                    <span className="text-[#52525B] block text-[9px]">CALORÍAS</span>
                    <span className="text-[#FAFAFA] font-bold">
                      {Math.round(selectedFood.caloriesPer100g * (inputGrams / 100))} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[9px]">PROTEÍNA</span>
                    <span className="text-[#10B981] font-bold">
                      {(selectedFood.proteinPer100g * (inputGrams / 100)).toFixed(1)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[9px]">CARBOHIDRATOS</span>
                    <span className="text-[#06B6D4] font-bold">
                      {(selectedFood.carbsPer100g * (inputGrams / 100)).toFixed(1)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[9px]">GRASAS</span>
                    <span className="text-[#F59E0B] font-bold">
                      {(selectedFood.fatPer100g * (inputGrams / 100)).toFixed(1)}g
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="bg-[#18181C] text-[#A1A1AA] px-3 py-1 text-xs font-mono rounded-[4px] border border-[#27272A]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1 text-xs font-mono rounded-[4px] flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Gramaje
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Hydration Widget */}
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#06B6D4]" />
                <h4 className="text-xs uppercase font-mono text-[#A1A1AA]">
                  Hidratación Celular // Meta: {targets.waterTargetMl} ml
                </h4>
              </div>
              <span className="font-mono text-sm font-bold text-[#06B6D4]">
                {dailyNutrition?.waterIntakeMl || 0} ml
              </span>
            </div>

            <div className="w-full bg-[#09090B] h-1.5 rounded-full overflow-hidden mb-3 border border-[#27272A]">
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

            <div className="flex gap-2">
              <button
                onClick={() => handleQuickAddWater(250)}
                className="flex-1 bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] py-1 text-xs font-mono rounded-[4px] transition-colors"
              >
                +250 ml (Vaso)
              </button>
              <button
                onClick={() => handleQuickAddWater(500)}
                className="flex-1 bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] py-1 text-xs font-mono rounded-[4px] transition-colors"
              >
                +500 ml (Botella)
              </button>
              <button
                onClick={() => handleQuickAddWater(-250)}
                className="bg-[#18181C] hover:bg-[#27272A] text-[#52525B] hover:text-[#FAFAFA] border border-[#27272A] px-2.5 py-1 text-xs font-mono rounded-[4px] transition-colors"
                title="Restar 250ml"
              >
                -250
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Today's 4 Meal Blocks */}
        <div className="lg:col-span-7 space-y-3">
          {blocks.map((block) => {
            const entriesInBlock = (dailyNutrition?.entries || []).filter((e) => e.block === block.type);
            const blockCalories = entriesInBlock.reduce((acc, curr) => acc + curr.calories, 0);
            const blockProtein = entriesInBlock.reduce((acc, curr) => acc + curr.protein, 0);

            return (
              <div key={block.type} className="bg-[#121215] border border-[#27272A] rounded-[6px] overflow-hidden">
                {/* Block Header */}
                <div className="p-3 bg-[#15151A] border-b border-[#27272A] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-[#FAFAFA]">{block.label}</h4>
                    <p className="text-[10px] text-[#52525B] mt-0.5">{block.description}</p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-[#FAFAFA] font-semibold">{blockCalories} kcal</span>
                    <span className="text-[#52525B] mx-1">|</span>
                    <span className="text-[#10B981] font-semibold">{blockProtein.toFixed(1)}g P</span>
                  </div>
                </div>

                {/* Entries List */}
                <div className="p-2">
                  {entriesInBlock.length === 0 ? (
                    <div className="py-4 text-center text-[11px] font-mono text-[#52525B]">
                      Sin registros en este bloque. Selecciona un alimento a la izquierda.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#27272A]/40">
                      {entriesInBlock.map((entry) => (
                        <div
                          key={entry.id}
                          className="py-2 px-2 flex items-center justify-between hover:bg-[#18181C] rounded-[4px] transition-colors"
                        >
                          <div>
                            <div className="text-xs font-medium text-[#FAFAFA] flex items-center gap-2">
                              <span>{entry.foodName}</span>
                              <Badge variant="neutral" size="xs">
                                {entry.grams}g
                              </Badge>
                            </div>
                            <div className="text-[10px] font-mono text-[#52525B] mt-0.5">
                              {entry.calories} kcal • P: <span className="text-[#10B981]">{entry.protein}g</span> • C:{' '}
                              <span className="text-[#06B6D4]">{entry.carbs}g</span> • G:{' '}
                              <span className="text-[#F59E0B]">{entry.fat}g</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#52525B]">{entry.timestamp}</span>
                            <button
                              onClick={() => dataService.removeFoodEntry(entry.id)}
                              className="text-[#52525B] hover:text-[#EF4444] p-1 transition-colors"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Crear Nuevo Alimento Custom */}
      {showCreateFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <h3 className="text-xs uppercase font-mono font-bold text-[#FAFAFA] flex items-center gap-2">
                <FilePlus2 className="w-4 h-4 text-[#10B981]" />
                Registrar Nuevo Alimento en la Base
              </h3>
              <button onClick={() => setShowCreateFoodModal(false)} className="text-[#52525B] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomFood} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Nombre del Alimento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carne de res molida 90/10 magra"
                  value={foodFormName}
                  onChange={(e) => setFoodFormName(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Categoría:</label>
                <select
                  value={foodFormCat}
                  onChange={(e) => setFoodFormCat(e.target.value as FoodItem['category'])}
                  className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                >
                  <option value="protein">Proteína Magra</option>
                  <option value="carb">Carbohidrato Complejo</option>
                  <option value="fat">Grasa Saludable</option>
                  <option value="dairy">Lácteo / Suero</option>
                  <option value="legume">Legumbre / Grano</option>
                  <option value="fruit_veg">Fruta / Vegetal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Calorías por 100g (kcal):</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={foodFormKcal}
                    onChange={(e) => setFoodFormKcal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#10B981] uppercase block mb-1 font-semibold">Proteína (g/100g):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    value={foodFormP}
                    onChange={(e) => setFoodFormP(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#06B6D4] uppercase block mb-1 font-semibold">Carbos (g/100g):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    value={foodFormC}
                    onChange={(e) => setFoodFormC(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#F59E0B] uppercase block mb-1 font-semibold">Grasas (g/100g):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    value={foodFormF}
                    onChange={(e) => setFoodFormF(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Descripción / Notas:</label>
                <input
                  type="text"
                  placeholder="Ej. Comprado fresco en supermercado local"
                  value={foodFormDesc}
                  onChange={(e) => setFoodFormDesc(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowCreateFoodModal(false)}
                  className="bg-[#18181C] text-[#A1A1AA] px-3 py-1.5 rounded-[4px] border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 rounded-[4px] transition-colors"
                >
                  Guardar Alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
