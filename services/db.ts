import type { Horse, RaceResult } from '../types';

const HORSES_KEY = 'gemini_horse_racing_stable';
const RESULTS_KEY = 'gemini_horse_racing_results';

// --- Horse Data ---
export const saveHorses = (horses: Horse[]): void => {
  try {
    localStorage.setItem(HORSES_KEY, JSON.stringify(horses));
  } catch (error) {
    console.error("Failed to save horses to localStorage", error);
  }
};

export const loadHorses = (): Horse[] => {
  try {
    const horsesJson = localStorage.getItem(HORSES_KEY);
    return horsesJson ? JSON.parse(horsesJson) : [];
  } catch (error) {
    console.error("Failed to load horses from localStorage", error);
    return [];
  }
};

// --- Race Result Data ---
export const saveRaceResults = (results: RaceResult[]): void => {
  try {
    // Keep only the last 50 results to prevent localStorage from getting too big
    const recentResults = results.slice(0, 50);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(recentResults));
  } catch (error) {
    console.error("Failed to save race results to localStorage", error);
  }
};

export const loadRaceResults = (): RaceResult[] => {
    try {
        const resultsJson = localStorage.getItem(RESULTS_KEY);
        return resultsJson ? JSON.parse(resultsJson) : [];
    } catch (error) {
        console.error("Failed to load race results from localStorage", error);
        return [];
    }
};
