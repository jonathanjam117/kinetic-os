import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { RestTimerProvider } from './context/RestTimerContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { TrainingModule } from './components/training/TrainingModule';
import { NutritionModule } from './components/nutrition/NutritionModule';
import { SupplementModule } from './components/supplements/SupplementModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { RestTimerBar } from './components/training/RestTimerBar';
import { getTodayDateString } from './services/dataService';

function AppContent() {
  const state = useAppState();
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'training' | 'nutrition' | 'supplements' | 'settings'
  >('dashboard');

  const todayStr = getTodayDateString();
  const todayNutrition = state.dailyNutrition[todayStr] || {
    date: todayStr,
    waterIntakeMl: 0,
    entries: [],
  };
  const todayChecklist = state.dailyChecklist[todayStr] || {
    date: todayStr,
    creatineChecked: false,
    creatineGrams: Number((state.biometrics.weightKg * 0.1).toFixed(1)),
    proteinChecked: false,
    hydrationChecked: false,
    sleepRecoveryChecked: false,
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col md:flex-row antialiased selection:bg-[#27272A] selection:text-[#FAFAFA]">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        biometrics={state.biometrics}
        hasActiveWorkout={Boolean(state.activeWorkoutSession)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header
          biometrics={state.biometrics}
          hasActiveWorkout={Boolean(state.activeWorkoutSession)}
          syncSettings={state.syncSettings}
          onNavigateToWorkout={() => setCurrentTab('training')}
          onNavigateToSettings={() => setCurrentTab('settings')}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <CommandCenter
              biometrics={state.biometrics}
              routines={state.routines}
              dailyNutrition={todayNutrition}
              weightRecords={state.weightHistory}
              dailyChecklist={todayChecklist}
              activeWorkout={state.activeWorkoutSession}
              onNavigateToModule={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'training' && (
            <TrainingModule
              routines={state.routines}
              activeWorkout={state.activeWorkoutSession}
              workoutHistoryCount={state.workoutHistory.length}
            />
          )}

          {currentTab === 'nutrition' && (
            <NutritionModule
              biometrics={state.biometrics}
              foodDatabase={state.foodDatabase}
              dailyNutrition={todayNutrition}
            />
          )}

          {currentTab === 'supplements' && (
            <SupplementModule
              biometrics={state.biometrics}
              marketProducts={state.marketProducts}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsModule syncSettings={state.syncSettings} />
          )}
        </main>
      </div>

      {/* Global Rest Timer Bar (Floats above all tabs, uninterrupted) */}
      <RestTimerBar />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasActiveWorkout={Boolean(state.activeWorkoutSession)}
      />
    </div>
  );
}

export function App() {
  return (
    <RestTimerProvider>
      <AppContent />
    </RestTimerProvider>
  );
}

export default App;
