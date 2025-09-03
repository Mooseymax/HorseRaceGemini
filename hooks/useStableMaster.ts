import { useState, useEffect, useCallback } from 'react';
import type { Horse } from '../types';
import { HORSES_IN_STABLE, MAX_RACES_BEFORE_RETIREMENT, MIN_RACES_BEFORE_RETIREMENT, ADJECTIVES, NOUNS } from '../constants';
import { loadHorses, saveHorses } from '../services/db';

let nextId = 1;

const generateRandomHorse = (): Horse => {
  const name = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
  const horse: Horse = {
    id: nextId++,
    name: name,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    maxSpeed: 50 + Math.random() * 20, // 50-70
    stamina: 80 + Math.random() * 40, // 80-120
    sprintSpeed: 1.2 + Math.random() * 0.4, // 20% to 60% speed boost
    sprintDuration: 30 + Math.floor(Math.random() * 20), // 30-50 ticks (3-5 seconds)
    sprintCharge: 0,
    acceleration: 0.8 + Math.random() * 0.4, // 0.8-1.2
    agility: 50 + Math.random() * 50, // 50-100
    racesRun: 0,
  };
  return horse;
};

export const useStableMaster = () => {
  const [horses, setHorses] = useState<Horse[]>([]);

  useEffect(() => {
    let stable = loadHorses();
    if (stable.length > 0) {
      nextId = Math.max(...stable.map(h => h.id)) + 1;
    } else {
      stable = Array.from({ length: HORSES_IN_STABLE }, generateRandomHorse);
    }
    setHorses(stable);
    saveHorses(stable);
  }, []);

  const updateHorseStats = useCallback((racedHorseIds: number[]): Horse[] => {
    const updatedHorses = horses.map(h => {
        if (racedHorseIds.includes(h.id)) {
            return { ...h, racesRun: h.racesRun + 1 };
        }
        return h;
    });
    setHorses(updatedHorses);
    saveHorses(updatedHorses);
    return updatedHorses;
  }, [horses]);

  const retireAndReplenishHorses = useCallback((currentHorses: Horse[]) => {
    const horsesToRetire = currentHorses.filter(h => h.racesRun >= MIN_RACES_BEFORE_RETIREMENT && (h.racesRun >= MAX_RACES_BEFORE_RETIREMENT || Math.random() < 0.2));
    
    if (horsesToRetire.length > 0) {
      let newStable = currentHorses.filter(h => !horsesToRetire.find(retired => retired.id === h.id));
      const numToGenerate = HORSES_IN_STABLE - newStable.length;
      
      for (let i = 0; i < numToGenerate; i++) {
        newStable.push(generateRandomHorse());
      }
      setHorses(newStable);
      saveHorses(newStable);
    }
  }, []);
  
  return { horses, retireAndReplenishHorses, updateHorseStats };
};
