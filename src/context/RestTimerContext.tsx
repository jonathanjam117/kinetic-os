import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { playTickSound, playTimerCompletePing } from '../services/audioFeedback';

interface RestTimerContextType {
  isActive: boolean;
  isRunning: boolean;
  timeLeft: number;
  totalSeconds: number;
  exerciseName?: string;
  audioEnabled: boolean;
  startRest: (seconds: number, exerciseName?: string) => void;
  adjustTime: (deltaSeconds: number) => void;
  setFixedPreset: (seconds: number) => void;
  skipRest: () => void;
  togglePause: () => void;
  toggleAudio: () => void;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(90);
  const [exerciseName, setExerciseName] = useState<string | undefined>(undefined);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Interval reference
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (audioEnabled) {
              playTimerCompletePing();
            }
            setIsRunning(false);
            return 0;
          }
          if (audioEnabled && prev <= 4 && prev > 1) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, audioEnabled]);

  const startRest = (seconds: number, exName?: string) => {
    const validSecs = Math.max(5, seconds || 90);
    setTimeLeft(validSecs);
    setTotalSeconds(validSecs);
    setExerciseName(exName);
    setIsActive(true);
    setIsRunning(true);
  };

  const adjustTime = (deltaSeconds: number) => {
    setTimeLeft((prev) => {
      const next = Math.max(0, prev + deltaSeconds);
      if (next > totalSeconds) setTotalSeconds(next);
      return next;
    });
    if (!isRunning) setIsRunning(true);
  };

  const setFixedPreset = (seconds: number) => {
    setTimeLeft(seconds);
    setTotalSeconds(seconds);
    setIsRunning(true);
    setIsActive(true);
  };

  const skipRest = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setIsActive(false);
  };

  const togglePause = () => {
    if (timeLeft > 0) {
      setIsRunning((prev) => !prev);
    }
  };

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  return (
    <RestTimerContext.Provider
      value={{
        isActive,
        isRunning,
        timeLeft,
        totalSeconds,
        exerciseName,
        audioEnabled,
        startRest,
        adjustTime,
        setFixedPreset,
        skipRest,
        togglePause,
        toggleAudio,
      }}
    >
      {children}
    </RestTimerContext.Provider>
  );
};

export function useRestTimer(): RestTimerContextType {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
}
