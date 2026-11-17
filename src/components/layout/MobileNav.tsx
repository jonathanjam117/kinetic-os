import React from 'react';
import { Activity, Dumbbell, Utensils, FlaskConical, Settings } from 'lucide-react';

interface MobileNavProps {
  currentTab: 'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings') => void;
  hasActiveWorkout: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  hasActiveWorkout,
}) => {
  const items: {
    id: 'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hasBadge?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Cmd', icon: Activity },
    { id: 'training', label: 'Training', icon: Dumbbell, hasBadge: hasActiveWorkout },
    { id: 'nutrition', label: 'Macros', icon: Utensils },
    { id: 'supplements', label: 'Suplementos', icon: FlaskConical },
    { id: 'settings', label: 'Sync', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090B]/95 backdrop-blur-md border-t border-[#27272A] px-2 py-1.5 flex justify-around items-center">
      {items.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-[4px] text-[10px] font-mono transition-colors ${
              isActive ? 'text-[#FAFAFA]' : 'text-[#52525B] hover:text-[#A1A1AA]'
            }`}
          >
            {item.hasBadge && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#10B981] animate-subtle-pulse" />
            )}
            <Icon className={`w-4 h-4 stroke-[1.5] mb-0.5 ${isActive ? 'text-[#FAFAFA]' : 'text-[#52525B]'}`} />
            <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
