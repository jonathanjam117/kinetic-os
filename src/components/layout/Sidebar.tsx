import React from 'react';
import {
  Activity,
  Dumbbell,
  Utensils,
  FlaskConical,
  Settings,
  Scale,
} from 'lucide-react';
import type { BiometricProfile, FitnessGoal } from '../../types';
import { Badge } from '../common/Badge';

interface SidebarProps {
  currentTab: 'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings') => void;
  biometrics: BiometricProfile;
  hasActiveWorkout: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  biometrics,
  hasActiveWorkout,
}) => {
  const navItems: {
    id: 'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings';
    label: string;
    code: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Command Center',
      code: 'MOD_A',
      icon: Activity,
      badge: 'LIVE',
    },
    {
      id: 'training',
      label: 'Entrenamiento',
      code: 'MOD_B',
      icon: Dumbbell,
      badge: hasActiveWorkout ? 'ACTIVO' : undefined,
    },
    {
      id: 'nutrition',
      label: 'Nutrición Precisión',
      code: 'MOD_C',
      icon: Utensils,
    },
    {
      id: 'supplements',
      label: 'Auditor Suplementos',
      code: 'MOD_D',
      icon: FlaskConical,
    },
    {
      id: 'settings',
      label: 'Sync & Backup',
      code: 'SYS_0',
      icon: Settings,
    },
  ];

  const goalLabels: Record<FitnessGoal, string> = {
    cut: 'Déficit / Cut',
    maintenance: 'Mantenimiento',
    bulk: 'Superávit / Bulk',
  };

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 bg-[#09090B] border-r border-[#27272A] p-4 select-none h-screen sticky top-0 shrink-0">
      {/* Top: Brand & System Header */}
      <div>
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#27272A] mb-5">
          <div className="w-7 h-7 rounded-[4px] bg-[#121215] border border-[#27272A] flex items-center justify-center text-[#FAFAFA] font-mono font-bold text-xs tracking-tighter">
            K//
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm tracking-tight text-[#FAFAFA]">
                KINETIC // OS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse"></span>
            </div>
            <span className="text-[10px] font-mono text-[#52525B] tracking-wider block">
              PERSONAL SPORTS TELEMETRY
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[4px] border text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-[#18181C] text-[#FAFAFA] border-[#3F3F46]'
                    : 'bg-transparent text-[#A1A1AA] border-transparent hover:bg-[#121215] hover:text-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 stroke-[1.5] ${
                      isActive ? 'text-[#FAFAFA]' : 'text-[#52525B]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <Badge
                      variant={item.badge === 'ACTIVO' ? 'amber' : 'emerald'}
                      size="xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <span className="text-[9px] text-[#52525B] font-mono">{item.code}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Active Biometric Snapshot Pill */}
      <div className="pt-4 border-t border-[#27272A] space-y-3">
        <div className="bg-[#121215] border border-[#27272A] p-3 rounded-[6px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-mono text-[#52525B] flex items-center gap-1">
              <Scale className="w-3 h-3" />
              Perfil Biométrico
            </span>
            <span className="text-[10px] font-mono text-[#10B981] uppercase font-semibold">
              {goalLabels[biometrics.goal]}
            </span>
          </div>

          <div className="flex justify-between items-baseline font-mono text-xs">
            <span className="text-[#FAFAFA] font-bold">{biometrics.weightKg} kg</span>
            <span className="text-[#52525B]">|</span>
            <span className="text-[#A1A1AA]">{biometrics.heightCm} cm</span>
            <span className="text-[#52525B]">|</span>
            <span className="text-[#A1A1AA]">{biometrics.age}a</span>
          </div>

          <div className="mt-2 pt-2 border-t border-[#27272A]/70 flex justify-between text-[10px] font-mono text-[#52525B]">
            <span>Creatina Fija:</span>
            <span className="text-[#FAFAFA] font-medium">{(biometrics.weightKg * 0.1).toFixed(1)}g / día</span>
          </div>
        </div>

        <div className="text-[9px] font-mono text-[#52525B] flex items-center justify-between px-1">
          <span>v1.0.4-PROD</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            LOCAL-FIRST READY
          </span>
        </div>
      </div>
    </aside>
  );
};
