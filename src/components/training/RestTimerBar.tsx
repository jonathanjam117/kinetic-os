import React from 'react';
import { Timer, Plus, Minus, X, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useRestTimer } from '../../context/RestTimerContext';

export const RestTimerBar: React.FC = () => {
  const {
    isActive,
    isRunning,
    timeLeft,
    totalSeconds,
    exerciseName,
    audioEnabled,
    adjustTime,
    setFixedPreset,
    skipRest,
    togglePause,
    toggleAudio,
  } = useRestTimer();

  if (!isActive) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg select-none">
      <div className="bg-[#121215]/95 backdrop-blur-md border border-[#27272A] rounded-[6px] shadow-2xl p-2.5 overflow-hidden">
        {/* Minimal progress bar */}
        <div className="w-full bg-[#18181C] h-1 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              timeLeft === 0 ? 'bg-[#10B981]' : timeLeft <= 10 ? 'bg-[#F59E0B]' : 'bg-[#FAFAFA]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Timer Display & Context */}
          <div className="flex items-center gap-2">
            <Timer
              className={`w-4 h-4 ${
                timeLeft === 0
                  ? 'text-[#10B981]'
                  : isRunning
                  ? 'text-[#FAFAFA] animate-subtle-pulse'
                  : 'text-[#F59E0B]'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-[#52525B] truncate max-w-[140px]">
                {exerciseName ? exerciseName : 'Descanso Intra-Serie'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-xl font-mono font-bold tracking-tight ${
                    timeLeft === 0
                      ? 'text-[#10B981]'
                      : isRunning
                      ? 'text-[#FAFAFA]'
                      : 'text-[#F59E0B]'
                  }`}
                >
                  {formattedTime}
                </span>
                {!isRunning && timeLeft > 0 && (
                  <span className="text-[9px] font-mono text-[#F59E0B] uppercase">PAUSADO</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustTime(-15)}
              className="bg-[#18181C] hover:bg-[#27272A] text-[#A1A1AA] border border-[#27272A] px-1.5 py-1 text-[11px] font-mono rounded-[4px] flex items-center"
              title="Restar 15s"
            >
              <Minus className="w-3 h-3" />15s
            </button>
            <button
              onClick={() => adjustTime(15)}
              className="bg-[#18181C] hover:bg-[#27272A] text-[#A1A1AA] border border-[#27272A] px-1.5 py-1 text-[11px] font-mono rounded-[4px] flex items-center"
              title="Sumar 15s"
            >
              <Plus className="w-3 h-3" />15s
            </button>

            <button
              onClick={() => setFixedPreset(90)}
              className={`border px-1.5 py-1 text-[11px] font-mono rounded-[4px] ${
                totalSeconds === 90
                  ? 'bg-[#27272A] text-[#FAFAFA] border-[#3F3F46]'
                  : 'bg-[#18181C] text-[#A1A1AA] border-[#27272A]'
              }`}
            >
              90s
            </button>
            <button
              onClick={() => setFixedPreset(120)}
              className={`border px-1.5 py-1 text-[11px] font-mono rounded-[4px] ${
                totalSeconds === 120
                  ? 'bg-[#27272A] text-[#FAFAFA] border-[#3F3F46]'
                  : 'bg-[#18181C] text-[#A1A1AA] border-[#27272A]'
              }`}
            >
              120s
            </button>
          </div>

          {/* Controls: Play/Pause, Audio & Skip */}
          <div className="flex items-center gap-1 border-l border-[#27272A] pl-2">
            <button
              onClick={togglePause}
              className="text-[#52525B] hover:text-[#FAFAFA] p-1 transition-colors"
              title={isRunning ? 'Pausar Descanso' : 'Reanudar Descanso'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleAudio}
              className="text-[#52525B] hover:text-[#FAFAFA] p-1 transition-colors"
              title={audioEnabled ? 'Silenciar Beep' : 'Activar Sonido'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={skipRest}
              className="bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-[#FAFAFA] px-2 py-1 text-[11px] font-mono rounded-[4px] flex items-center gap-1"
              title="Saltar descanso"
            >
              <span>Skip</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
