import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { AppStateData } from '../types';

export function useAppState(): AppStateData {
  const [state, setState] = useState<AppStateData>(() => dataService.getState());

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setState({ ...dataService.getState() });
    });
    return unsubscribe;
  }, []);

  return state;
}
