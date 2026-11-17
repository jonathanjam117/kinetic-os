import React, { useState } from 'react';
import type { WeightRecord } from '../../types';
import { dataService } from '../../services/dataService';
import { Scale, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface WeightTrendChartProps {
  records: WeightRecord[];
}

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ records }) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [scaleInput, setScaleInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Chart dimensions & calculations
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 35;
  const paddingY = 24;

  const weights = sorted.map((r) => r.scaleWeightKg);
  const emas = sorted.map((r) => r.emaWeightKg || r.scaleWeightKg);
  const allValues = [...weights, ...emas];

  const minVal = Math.min(...allValues) - 0.5;
  const maxVal = Math.max(...allValues) + 0.5;
  const range = maxVal - minVal || 1;

  const getX = (idx: number) => {
    if (sorted.length <= 1) return svgWidth / 2;
    return paddingX + (idx / (sorted.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    return svgHeight - paddingY - ((val - minVal) / range) * (svgHeight - paddingY * 2);
  };

  // Generate SVG path for Scale Weight (Dotted / Thin Gray line)
  const scalePath = sorted
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(r.scaleWeightKg).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for 7-day EMA (Solid Emerald technical line)
  const emaPath = sorted
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(r.emaWeightKg || r.scaleWeightKg).toFixed(1)}`)
    .join(' ');

  const latestRecord = sorted[sorted.length - 1];
  const previousRecord = sorted[sorted.length - 2];
  const deltaEma = latestRecord && previousRecord && latestRecord.emaWeightKg && previousRecord.emaWeightKg
    ? Number((latestRecord.emaWeightKg - previousRecord.emaWeightKg).toFixed(2))
    : 0;

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(scaleInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      dataService.logWeight(val, notesInput);
      setScaleInput('');
      setNotesInput('');
      setShowLogModal(false);
    }
  };

  return (
    <div className="bg-[#121215] border border-[#27272A] rounded-[6px] p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#27272A]/70 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
            <h3 className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">
              Tendencia de Peso // Filtro de Glucógeno & Retención (MacroFactor DNA)
            </h3>
          </div>
          <p className="text-[11px] text-[#52525B] mt-0.5">
            Compara la oscilación diaria de la báscula con la Media Móvil Exponencial (EMA 7D).
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-1.5 bg-[#18181C] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] px-2.5 py-1 text-xs rounded-[4px] font-mono transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Registrar Peso</span>
        </button>
      </div>

      {/* Top telemetry numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-[#09090B] border border-[#27272A] p-2 rounded-[4px]">
          <span className="text-[10px] uppercase font-mono text-[#52525B] block">Báscula Hoy</span>
          <span className="text-base font-mono font-semibold text-[#FAFAFA]">
            {latestRecord?.scaleWeightKg ? `${latestRecord.scaleWeightKg.toFixed(1)} kg` : '—'}
          </span>
        </div>

        <div className="bg-[#09090B] border border-[#27272A] p-2 rounded-[4px]">
          <span className="text-[10px] uppercase font-mono text-[#10B981] block">EMA 7 Días</span>
          <span className="text-base font-mono font-semibold text-[#10B981]">
            {latestRecord?.emaWeightKg ? `${latestRecord.emaWeightKg.toFixed(2)} kg` : '—'}
          </span>
        </div>

        <div className="bg-[#09090B] border border-[#27272A] p-2 rounded-[4px]">
          <span className="text-[10px] uppercase font-mono text-[#52525B] block">Delta Tendencia</span>
          <div className="flex items-center gap-1">
            {deltaEma < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-[#10B981]" />
            ) : deltaEma > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-[#52525B]" />
            )}
            <span className={`text-sm font-mono font-medium ${deltaEma < 0 ? 'text-[#10B981]' : deltaEma > 0 ? 'text-[#F59E0B]' : 'text-[#A1A1AA]'}`}>
              {deltaEma > 0 ? `+${deltaEma}` : deltaEma} kg/sem
            </span>
          </div>
        </div>

        <div className="bg-[#09090B] border border-[#27272A] p-2 rounded-[4px]">
          <span className="text-[10px] uppercase font-mono text-[#52525B] block">Ruido de Retención</span>
          <span className="text-sm font-mono text-[#A1A1AA]">
            {latestRecord && latestRecord.emaWeightKg
              ? `${(latestRecord.scaleWeightKg - latestRecord.emaWeightKg > 0 ? '+' : '')}${(latestRecord.scaleWeightKg - latestRecord.emaWeightKg).toFixed(2)} kg`
              : '0.0 kg'}
          </span>
        </div>
      </div>

      {/* Crisp SVG Telemetry Chart */}
      <div className="relative bg-[#09090B] border border-[#27272A] rounded-[4px] p-2 overflow-hidden">
        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] font-mono mb-1 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#52525B]">
              <span className="w-2.5 h-[1.5px] bg-[#52525B] inline-block border-b border-dashed border-[#A1A1AA]"></span>
              Báscula Diaria (Ruido)
            </span>
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-2.5 h-[2px] bg-[#10B981] inline-block"></span>
              Tendencia Real (EMA 7D)
            </span>
          </div>
          <span className="text-[#52525B]">Rango: {minVal.toFixed(1)} - {maxVal.toFixed(1)} kg</span>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-32 overflow-visible">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            const val = maxVal - pct * range;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#1C1C21" strokeWidth="1" strokeDasharray="2 3" />
                <text x={paddingX - 6} y={y + 3} fill="#52525B" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Scale Weight line (thin, with dashes) */}
          <path d={scalePath} fill="none" stroke="#52525B" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Scale Weight Points */}
          {sorted.map((r, i) => (
            <circle
              key={`dot-scale-${i}`}
              cx={getX(i)}
              cy={getY(r.scaleWeightKg)}
              r="2.5"
              fill="#18181C"
              stroke="#71717A"
              strokeWidth="1"
            />
          ))}

          {/* EMA line (smooth, solid emerald) */}
          <path d={emaPath} fill="none" stroke="#10B981" strokeWidth="2" />

          {/* EMA Points */}
          {sorted.map((r, i) => (
            <circle
              key={`dot-ema-${i}`}
              cx={getX(i)}
              cy={getY(r.emaWeightKg || r.scaleWeightKg)}
              r={hoveredIndex === i ? '4' : '2.5'}
              fill="#10B981"
              stroke="#09090B"
              strokeWidth="1.5"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Hover indicator */}
          {hoveredIndex !== null && sorted[hoveredIndex] && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={paddingY}
                x2={getX(hoveredIndex)}
                y2={svgHeight - paddingY}
                stroke="#3F3F46"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Hovered point telemetry tooltip */}
        {hoveredIndex !== null && sorted[hoveredIndex] && (
          <div className="absolute top-2 right-2 bg-[#121215]/95 border border-[#27272A] p-2 rounded-[4px] text-[10px] font-mono z-10 shadow-lg">
            <div className="text-[#A1A1AA]">{sorted[hoveredIndex].date}</div>
            <div className="text-[#FAFAFA]">Báscula: <span className="text-[#E4E4E7] font-semibold">{sorted[hoveredIndex].scaleWeightKg.toFixed(1)} kg</span></div>
            <div className="text-[#10B981]">EMA 7D: <span className="font-semibold">{sorted[hoveredIndex].emaWeightKg?.toFixed(2)} kg</span></div>
            {sorted[hoveredIndex].notes && (
              <div className="text-[#52525B] text-[9px] mt-0.5 max-w-[180px] truncate">{sorted[hoveredIndex].notes}</div>
            )}
          </div>
        )}
      </div>

      {/* Micro Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
          <div className="bg-[#121215] border border-[#27272A] rounded-[6px] w-full max-w-sm p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A] mb-3">
              <span className="text-xs uppercase font-mono text-[#FAFAFA] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#10B981]" />
                Registrar Peso de Báscula
              </span>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[#52525B] hover:text-[#FAFAFA] font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">
                  Peso de hoy en ayunas (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ej. 76.5"
                  value={scaleInput}
                  onChange={(e) => setScaleInput(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-mono px-3 py-1.5 text-sm rounded-[4px] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#A1A1AA] block mb-1">
                  Nota de contexto (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Post-comida con sodio, 8h de sueño"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FAFAFA] text-[#FAFAFA] font-sans px-3 py-1.5 text-xs rounded-[4px] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="bg-[#18181C] hover:bg-[#27272A] text-[#A1A1AA] px-3 py-1 text-xs rounded-[4px] font-mono border border-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-semibold px-4 py-1 text-xs rounded-[4px] font-mono transition-colors"
                >
                  Guardar Telemetría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
