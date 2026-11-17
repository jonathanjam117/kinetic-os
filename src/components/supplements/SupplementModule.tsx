import React, { useState, useMemo } from 'react';
import type { BiometricProfile, MarketProductReference } from '../../types';
import { SEED_SUPPLEMENT_SPECS } from '../../data/seedData';
import { auditProteinPurityAndCost, type ProteinPurityAuditResult } from '../../services/calculator';
import { dataService } from '../../services/dataService';
import { Badge } from '../common/Badge';
import {
  ShieldAlert,
  ShieldCheck,
  FlaskConical,
  Calculator,
  Search,
  AlertTriangle,
  Sparkles,
  Activity,
  BookmarkPlus,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

interface SupplementModuleProps {
  biometrics: BiometricProfile;
  marketProducts?: MarketProductReference[];
}

export const SupplementModule: React.FC<SupplementModuleProps> = ({
  biometrics,
  marketProducts = [],
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'auditor' | 'market'>('matrix');

  // Anti-fraud interactive calculator state
  const [scoopGrams, setScoopGrams] = useState<number>(30);
  const [proteinDeclaredGrams, setProteinDeclaredGrams] = useState<number>(24);
  const [servingsCount, setServingsCount] = useState<number>(70);
  const [priceCop, setPriceCop] = useState<number>(360000);

  // Modal to save audited product into catalog
  const [showSaveAuditModal, setShowSaveAuditModal] = useState<boolean>(false);
  const [saveAuditBrand, setSaveAuditBrand] = useState<string>('');
  const [saveAuditName, setSaveAuditName] = useState<string>('');
  const [saveAuditCat, setSaveAuditCat] = useState<MarketProductReference['category']>('wpi');
  const [saveAuditInvima, setSaveAuditInvima] = useState<MarketProductReference['invimaStatus']>('Vigente');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter for supplement matrix
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter for market products
  const [marketSearch, setMarketSearch] = useState<string>('');
  const [marketCategory, setMarketCategory] = useState<string>('all');

  // Audit calculation in real time
  const auditResult: ProteinPurityAuditResult = useMemo(() => {
    return auditProteinPurityAndCost(scoopGrams, proteinDeclaredGrams, servingsCount, priceCop);
  }, [scoopGrams, proteinDeclaredGrams, servingsCount, priceCop]);

  // Scientific daily continuous creatine monohydrate dose (Weight x 0.1g)
  const userCreatineDose = (biometrics.weightKg * 0.1).toFixed(1);

  // Caffeine safe target range (3-6 mg/kg)
  const caffeineMin = Math.round(biometrics.weightKg * 3);
  const caffeineMax = Math.round(biometrics.weightKg * 6);

  // Filter matrix supplements
  const filteredSupplements = useMemo(() => {
    return SEED_SUPPLEMENT_SPECS.filter((spec) => {
      const matchTier = tierFilter === 'all' || spec.tier === tierFilter;
      const matchCat = categoryFilter === 'all' || spec.category === categoryFilter;
      return matchTier && matchCat;
    });
  }, [tierFilter, categoryFilter]);

  // Combined market products (seed + custom)
  const allMarketProducts = marketProducts.length > 0 ? marketProducts : dataService.getState().marketProducts;

  // Filter market reference products
  const filteredMarket = useMemo(() => {
    return allMarketProducts.filter((prod) => {
      const query = marketSearch.toLowerCase();
      const matchText =
        prod.productName.toLowerCase().includes(query) ||
        prod.brand.toLowerCase().includes(query) ||
        prod.notes.toLowerCase().includes(query);
      const matchCat = marketCategory === 'all' || prod.category === marketCategory;
      return matchText && matchCat;
    });
  }, [allMarketProducts, marketSearch, marketCategory]);

  const loadPresetIntoAuditor = (
    scoop: number,
    protein: number,
    servings: number,
    price: number
  ) => {
    setScoopGrams(scoop);
    setProteinDeclaredGrams(protein);
    setServingsCount(servings);
    setPriceCop(price);
    setActiveTab('auditor');
  };

  const handleOpenSaveAuditModal = () => {
    setSaveAuditBrand('Marca Evaluada');
    setSaveAuditName(`Proteína ${auditResult.purityPercent}% Pureza`);
    setSaveAuditCat(auditResult.purityPercent >= 80 ? 'wpi' : 'wpc');
    setSaveAuditInvima('Vigente');
    setShowSaveAuditModal(true);
  };

  const handleConfirmSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveAuditName.trim()) return;

    dataService.saveAuditedProduct({
      brand: saveAuditBrand.trim() || 'Desconocida',
      productName: saveAuditName.trim(),
      category: saveAuditCat,
      scoopSizeGrams: scoopGrams,
      proteinPerScoopGrams: proteinDeclaredGrams,
      servings: servingsCount,
      typicalPriceCop: priceCop,
      purityPercent: auditResult.purityPercent,
      pricePerGramProteinCop: auditResult.costPerGramProteinCop,
      invimaStatus: saveAuditInvima,
      notes: `Auditoría personal: Pureza ${auditResult.purityPercent}%, costo $${auditResult.costPerGramProteinCop}/g. Dictamen: ${auditResult.statusLabel}.`,
    });

    setShowSaveAuditModal(false);
    setSaveSuccessMsg('¡Producto guardado exitosamente en el catálogo!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
              <span className="text-xs uppercase font-mono tracking-wider text-[#A1A1AA]">
                Módulo D // Inteligencia de Suplementación & Auditor de Mercado (Examine.com DNA)
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#FAFAFA] tracking-tight flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#FAFAFA]" />
              Evidencia Científica, Auditoría Anti-Spiking & Mercado Colombia
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Sin sesgos comerciales: análisis basado en metaanálisis de ensayos clínicos aleatorizados (RCTs).
            </p>
          </div>

          {/* Subtabs Navigation */}
          <div className="flex items-center gap-1 bg-[#09090B] p-1 border border-[#27272A] rounded-[4px]">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-[#18181C] text-[#FAFAFA] font-semibold border border-[#27272A]'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              1. Matriz Científica (Tier S-A)
            </button>
            <button
              onClick={() => setActiveTab('auditor')}
              className={`px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors ${
                activeTab === 'auditor'
                  ? 'bg-[#18181C] text-[#FAFAFA] font-semibold border border-[#27272A]'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              2. Auditor Anti-Fraude ($/g)
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors ${
                activeTab === 'market'
                  ? 'bg-[#18181C] text-[#FAFAFA] font-semibold border border-[#27272A]'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              3. Catálogo Curado ({allMarketProducts.length})
            </button>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-[#062016] border border-[#0A3D28] text-[#10B981] font-mono text-xs rounded-[4px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: Matriz Científica de Suplementos */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Quick Dynamic Personalized Bio-Calculators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Creatina 0.1g x kg */}
            <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono text-[#10B981] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Calculadora Creatina Diaria
                </span>
                <Badge variant="emerald">Tier S</Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-mono font-bold text-[#FAFAFA]">{userCreatineDose}g</span>
                <span className="text-xs font-mono text-[#A1A1AA]">/ día (continuo)</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Fórmula científica: <span className="font-mono text-[#FAFAFA]">{biometrics.weightKg} kg × 0.1g</span>. Toma diaria constante para saturación muscular sin requerir fase de carga ni ciclado.
              </p>
            </div>

            {/* Cafeína Anhidra 3-6 mg/kg */}
            <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono text-[#FAFAFA] font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Rango Pre-Entreno Cafeína
                </span>
                <Badge variant="emerald">Tier S</Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-mono font-bold text-[#FAFAFA]">{caffeineMin} - {caffeineMax} mg</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Dosis ergogénica óptima: 3 a 6 mg/kg tomada 45-60 min antes. Mantener 6-8h antes del descanso nocturno.
              </p>
            </div>

            {/* Proteína & Leucina Threshold */}
            <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono text-[#06B6D4] font-semibold flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Umbral de Leucina (mTOR)
                </span>
                <Badge variant="cyan">Tier S</Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-mono font-bold text-[#FAFAFA]">2.7 - 3.2g</span>
                <span className="text-xs font-mono text-[#A1A1AA]">por toma</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Cantidad de leucina libre necesaria por servicio para activar al máximo la Síntesis de Proteína Muscular (MPS).
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-[#52525B] mr-1">Filtrar Evidencia:</span>
              {['all', 'Tier S', 'Tier A'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-1 rounded-[3px] border transition-colors ${
                    tierFilter === t
                      ? 'bg-[#FAFAFA] text-[#09090B] border-[#FAFAFA] font-bold'
                      : 'bg-[#121215] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  {t === 'all' ? 'Todos los Tiers' : t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-[#52525B] mr-1">Categoría:</span>
              {['all', 'protein', 'creatine', 'ergogenic', 'micronutrient'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-2 py-1 rounded-[3px] border capitalize transition-colors ${
                    categoryFilter === c
                      ? 'bg-[#18181C] text-[#FAFAFA] border-[#FAFAFA]'
                      : 'bg-[#121215] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  {c === 'all' ? 'Todas' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Scientific Specs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSupplements.map((spec) => (
              <div
                key={spec.id}
                className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-[#FAFAFA]">{spec.name}</h3>
                    <Badge variant={spec.tier === 'Tier S' ? 'emerald' : 'cyan'}>{spec.tier}</Badge>
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                    {spec.evidenceSummary}
                  </p>

                  <div className="space-y-2 text-[11px] font-mono bg-[#09090B] border border-[#27272A] p-3 rounded-[4px]">
                    <div>
                      <span className="text-[#52525B] block text-[9px] uppercase">Mecanismo Fisiológico</span>
                      <span className="text-[#FAFAFA] font-sans">{spec.mechanism}</span>
                    </div>

                    <div className="pt-2 border-t border-[#27272A]/70 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[#52525B] block text-[9px] uppercase">Dosis Recomendada</span>
                        <span className="text-[#10B981]">{spec.recommendedDose}</span>
                      </div>
                      <div>
                        <span className="text-[#52525B] block text-[9px] uppercase">Timing Óptimo</span>
                        <span className="text-[#FAFAFA]">{spec.timing}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buyer Alerts */}
                <div className="bg-[#18181C] border border-[#27272A] p-2.5 rounded-[4px]">
                  <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    Alertas Críticas al Comprar:
                  </span>
                  <ul className="text-[11px] text-[#A1A1AA] space-y-1 list-disc list-inside">
                    {spec.buyerAlerts.map((alert, aidx) => (
                      <li key={aidx} className="leading-snug">{alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Calculadora Anti-Fraude */}
      {activeTab === 'auditor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls Form (5 cols) */}
            <div className="lg:col-span-5 bg-[#121215] border border-[#27272A] rounded-[6px] p-5 space-y-4">
              <div>
                <h3 className="text-xs uppercase font-mono tracking-wider text-[#FAFAFA] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#10B981]" />
                  Auditor de Pureza & Costo Real de Proteína
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mt-1">
                  Detecta si el fabricante añade harina de avena, maltodextrina o amino spiking con glicina para abaratar costos.
                </p>
              </div>

              {/* Presets buttons */}
              <div>
                <span className="text-[10px] uppercase font-mono text-[#52525B] block mb-1.5">
                  Cargar Ejemplos del Mercado:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => loadPresetIntoAuditor(30, 25, 76, 420000)}
                    className="bg-[#09090B] hover:bg-[#18181C] text-[#FAFAFA] border border-[#27272A] px-2 py-1 text-[10px] font-mono rounded-[3px] text-left truncate"
                  >
                    Dymatize ISO100 (WPI)
                  </button>
                  <button
                    onClick={() => loadPresetIntoAuditor(26, 24, 35, 195000)}
                    className="bg-[#09090B] hover:bg-[#18181C] text-[#FAFAFA] border border-[#27272A] px-2 py-1 text-[10px] font-mono rounded-[3px] text-left truncate"
                  >
                    BiPro Classic (92% WPI)
                  </button>
                  <button
                    onClick={() => loadPresetIntoAuditor(30.4, 24, 73, 380000)}
                    className="bg-[#09090B] hover:bg-[#18181C] text-[#FAFAFA] border border-[#27272A] px-2 py-1 text-[10px] font-mono rounded-[3px] text-left truncate"
                  >
                    ON Gold Standard (WPC/WPI)
                  </button>
                  <button
                    onClick={() => loadPresetIntoAuditor(100, 25, 15, 140000)}
                    className="bg-[#260B0B] hover:bg-[#361010] text-[#EF4444] border border-[#4A1616] px-2 py-1 text-[10px] font-mono rounded-[3px] text-left truncate"
                  >
                    Caso: Mass Gainer Disfrazado
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#27272A]">
                <div>
                  <label className="text-[11px] font-mono text-[#A1A1AA] flex justify-between mb-1">
                    <span>Tamaño del Scoop (g):</span>
                    <span className="text-[#FAFAFA] font-bold">{scoopGrams}g</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="300"
                    value={scoopGrams}
                    onChange={(e) => setScoopGrams(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#A1A1AA] flex justify-between mb-1">
                    <span>Proteína Declarada por Scoop (g):</span>
                    <span className="text-[#10B981] font-bold">{proteinDeclaredGrams}g</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={proteinDeclaredGrams}
                    onChange={(e) => setProteinDeclaredGrams(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#A1A1AA] flex justify-between mb-1">
                    <span>Número Total de Servicios / Porciones:</span>
                    <span className="text-[#FAFAFA] font-bold">{servingsCount} scoops</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={servingsCount}
                    onChange={(e) => setServingsCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#A1A1AA] flex justify-between mb-1">
                    <span>Precio del Tarro en COP ($):</span>
                    <span className="text-[#FAFAFA] font-bold">${priceCop.toLocaleString()} COP</span>
                  </label>
                  <input
                    type="number"
                    step="5000"
                    min="10000"
                    value={priceCop}
                    onChange={(e) => setPriceCop(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-xs rounded-[4px] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Results & Audit Verdict (7 cols) */}
            <div className="lg:col-span-7 bg-[#121215] border border-[#27272A] rounded-[6px] p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#27272A] mb-4">
                  <span className="text-xs uppercase font-mono text-[#A1A1AA]">
                    Resultado del Dictamen Técnico
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        auditResult.status === 'optimal'
                          ? 'emerald'
                          : auditResult.status === 'standard'
                          ? 'amber'
                          : 'red'
                      }
                      size="sm"
                    >
                      {auditResult.statusLabel}
                    </Badge>
                  </div>
                </div>

                {/* Primary Metric: Purity & Cost per gram */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#09090B] border border-[#27272A] p-4 rounded-[4px]">
                    <span className="text-[10px] font-mono uppercase text-[#52525B] block mb-1">
                      Pureza Real por Scoop
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-3xl font-mono font-bold ${
                          auditResult.purityPercent >= 80
                            ? 'text-[#10B981]'
                            : auditResult.purityPercent >= 70
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {auditResult.purityPercent}%
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#52525B] mt-1 block">
                      {auditResult.purityPercent >= 80
                        ? '≥ 80%: Estándar Oro de Pureza'
                        : auditResult.purityPercent >= 70
                        ? '70-79%: Concentrado Estándar'
                        : '< 70%: Alerta por Rellenos'}
                    </span>
                  </div>

                  <div className="bg-[#09090B] border border-[#27272A] p-4 rounded-[4px]">
                    <span className="text-[10px] font-mono uppercase text-[#52525B] block mb-1">
                      Costo por 1g Proteína Pura
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-mono font-bold text-[#FAFAFA]">
                        ${auditResult.costPerGramProteinCop}
                      </span>
                      <span className="text-xs font-mono text-[#A1A1AA]">COP / g</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#52525B] mt-1 block">
                      Costo por Scoop: ${auditResult.costPerScoopCop.toLocaleString()} COP
                    </span>
                  </div>
                </div>

                {/* Additional Telemetry Details */}
                <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px] space-y-2 mb-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Proteína Real Total en el Tarro:</span>
                    <span className="text-[#FAFAFA] font-bold">{auditResult.totalProteinInTubGrams} gramos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Relleno / No Proteína por Scoop:</span>
                    <span className="text-[#FAFAFA]">
                      {Math.max(0, scoopGrams - proteinDeclaredGrams).toFixed(1)}g (
                      {(100 - auditResult.purityPercent).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Technical Verdict Callout */}
                <div
                  className={`p-3.5 rounded-[4px] border font-mono text-xs ${
                    auditResult.status === 'optimal'
                      ? 'bg-[#062016] border-[#0A3D28] text-[#10B981]'
                      : auditResult.status === 'standard'
                      ? 'bg-[#221805] border-[#422D0A] text-[#F59E0B]'
                      : 'bg-[#260B0B] border-[#4A1616] text-[#EF4444]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {auditResult.status === 'optimal' ? (
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold mb-0.5 uppercase tracking-wide">
                        {auditResult.status === 'optimal'
                          ? 'Producto Verificado de Alta Eficiencia'
                          : auditResult.status === 'standard'
                          ? 'Calidad Aceptable de Suero Concentrado'
                          : 'Peligro de Sobreprecio o Adulteración'}
                      </div>
                      <p className="text-[11px] font-sans opacity-90 leading-relaxed">
                        {auditResult.verdictDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Save Audit to Catalog */}
              <div className="pt-2 flex items-center justify-between">
                <p className="text-[10px] text-[#52525B] font-mono">
                  Guarda esta auditoría en tu catálogo para comparar precios futuros.
                </p>
                <button
                  onClick={handleOpenSaveAuditModal}
                  className="bg-[#18181C] hover:bg-[#27272A] text-[#10B981] border border-[#27272A] hover:border-[#10B981] px-3.5 py-1.5 text-xs font-mono rounded-[4px] flex items-center gap-1.5 transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>+ Guardar Auditoría en Catálogo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Catálogo Curado Colombia & Personal */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          {/* Market Warning Callout */}
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[4px] bg-[#221805] border border-[#422D0A] flex items-center justify-center text-[#F59E0B] shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FAFAFA] font-mono uppercase">
                  Catálogo de Auditoría & Verificación INVIMA
                </h4>
                <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                  Incluye referencias comerciales oficiales y las auditorías que has guardado personalmente.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
              <input
                type="text"
                placeholder="Filtrar por marca (Dymatize, BiPro, ON, IMN...)"
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] pl-8 pr-3 py-1.5 text-xs font-sans rounded-[4px] outline-none"
              />
            </div>

            <div className="flex items-center gap-1 text-xs font-mono w-full sm:w-auto overflow-x-auto pb-1">
              {['all', 'wpi', 'wpc', 'blend', 'creatine'].map((c) => (
                <button
                  key={c}
                  onClick={() => setMarketCategory(c)}
                  className={`px-2.5 py-1 rounded-[3px] border uppercase transition-colors whitespace-nowrap ${
                    marketCategory === c
                      ? 'bg-[#FAFAFA] text-[#09090B] border-[#FAFAFA] font-bold'
                      : 'bg-[#121215] text-[#A1A1AA] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  {c === 'all' ? 'Todos los Productos' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Products Table */}
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-[10px] uppercase text-[#52525B] bg-[#141418]">
                  <th className="py-2.5 px-3">Marca / Producto</th>
                  <th className="py-2.5 px-2">Categoría</th>
                  <th className="py-2.5 px-2">Scoop / P. Declarada</th>
                  <th className="py-2.5 px-2">Pureza (%)</th>
                  <th className="py-2.5 px-2">Precio Est. (COP)</th>
                  <th className="py-2.5 px-2">Costo Real ($/g)</th>
                  <th className="py-2.5 px-2">INVIMA</th>
                  <th className="py-2.5 px-3">Dictamen / Observación</th>
                  <th className="py-2.5 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/50">
                {filteredMarket.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#18181C] transition-colors">
                    {/* Brand / Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#FAFAFA] font-sans flex items-center gap-1.5">
                        <span>{prod.productName}</span>
                        {prod.isCustomAudited && <Badge variant="cyan" size="xs">AUDITADO</Badge>}
                      </div>
                      <div className="text-[10px] text-[#A1A1AA]">{prod.brand}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          prod.category === 'wpi'
                            ? 'emerald'
                            : prod.category === 'creatine'
                            ? 'cyan'
                            : prod.category === 'blend'
                            ? 'amber'
                            : 'neutral'
                        }
                      >
                        {prod.category}
                      </Badge>
                    </td>

                    {/* Scoop / Prot */}
                    <td className="py-3 px-2 text-[#FAFAFA]">
                      {prod.scoopSizeGrams}g <span className="text-[#52525B]">/</span>{' '}
                      <span className="text-[#10B981] font-semibold">{prod.proteinPerScoopGrams}g</span>
                    </td>

                    {/* Purity % */}
                    <td className="py-3 px-2">
                      <span
                        className={`font-bold ${
                          prod.purityPercent >= 80
                            ? 'text-[#10B981]'
                            : prod.purityPercent >= 70
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {prod.purityPercent}%
                      </span>
                    </td>

                    {/* Price COP */}
                    <td className="py-3 px-2 text-[#FAFAFA]">${prod.typicalPriceCop.toLocaleString()}</td>

                    {/* Cost per pure gram */}
                    <td className="py-3 px-2 font-bold text-[#E4E4E7]">${prod.pricePerGramProteinCop} / g</td>

                    {/* INVIMA Status */}
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          prod.invimaStatus === 'Vigente'
                            ? 'emerald'
                            : prod.invimaStatus === 'En Trámite'
                            ? 'amber'
                            : 'red'
                        }
                      >
                        {prod.invimaStatus}
                      </Badge>
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 text-[11px] text-[#A1A1AA] font-sans max-w-xs leading-snug">
                      {prod.notes}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      {prod.isCustomAudited && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar ${prod.productName} del catálogo?`)) {
                              dataService.deleteMarketProduct(prod.id);
                            }
                          }}
                          className="text-[#52525B] hover:text-[#EF4444] p-1"
                          title="Eliminar producto auditado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Guardar Auditoría en Catálogo */}
      {showSaveAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <h3 className="text-xs uppercase font-mono font-bold text-[#FAFAFA] flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-[#10B981]" />
                Guardar Auditoría en el Catálogo
              </h3>
              <button onClick={() => setShowSaveAuditModal(false)} className="text-[#52525B] hover:text-[#FAFAFA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveAudit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Marca del Fabricante:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dymatize, BiPro, Optimum Nutrition"
                  value={saveAuditBrand}
                  onChange={(e) => setSaveAuditBrand(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] text-[#52525B] uppercase block mb-1">Nombre Completo del Producto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ISO 100 Hydrolyzed Isolate (5 lbs)"
                  value={saveAuditName}
                  onChange={(e) => setSaveAuditName(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] px-3 py-1.5 rounded-[4px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Categoría:</label>
                  <select
                    value={saveAuditCat}
                    onChange={(e) => setSaveAuditCat(e.target.value as MarketProductReference['category'])}
                    className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                  >
                    <option value="wpi">Whey Aislada (WPI)</option>
                    <option value="wpc">Whey Concentrada (WPC)</option>
                    <option value="wph">Whey Hidrolizada (WPH)</option>
                    <option value="casein">Caseína Micelar</option>
                    <option value="blend">Mezcla / Gainer</option>
                    <option value="creatine">Creatina</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#52525B] uppercase block mb-1">Estado INVIMA:</label>
                  <select
                    value={saveAuditInvima}
                    onChange={(e) => setSaveAuditInvima(e.target.value as MarketProductReference['invimaStatus'])}
                    className="w-full bg-[#09090B] border border-[#27272A] text-[#FAFAFA] px-2.5 py-1.5 rounded-[4px] outline-none"
                  >
                    <option value="Vigente">Vigente (Aprobado)</option>
                    <option value="En Trámite">En Trámite</option>
                    <option value="Requiere Auditoría">Requiere Auditoría</option>
                  </select>
                </div>
              </div>

              {/* Pre-calculated snapshot summary */}
              <div className="bg-[#09090B] border border-[#27272A] p-3 rounded-[4px] space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#52525B]">Pureza Evaluada:</span>
                  <span className="text-[#10B981] font-bold">{auditResult.purityPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B]">Costo Real / g:</span>
                  <span className="text-[#FAFAFA] font-bold">${auditResult.costPerGramProteinCop} COP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B]">Precio Total:</span>
                  <span className="text-[#FAFAFA]">${priceCop.toLocaleString()} ({servingsCount} serv)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowSaveAuditModal(false)}
                  className="bg-[#18181C] text-[#A1A1AA] px-3 py-1.5 rounded-[4px] border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-bold px-4 py-1.5 rounded-[4px] transition-colors"
                >
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
