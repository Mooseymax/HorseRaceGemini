import { useState, useEffect, useCallback } from 'react';
import type { Horse, Weather, TrackCondition, HorseArchetype, Pacing } from '../types';
import { HORSES_IN_STABLE, MAX_RACES_BEFORE_RETIREMENT, MIN_RACES_BEFORE_RETIREMENT, ADJECTIVES, NOUNS, WEATHER_CONDITIONS, TRACK_CONDITIONS, PACING_STYLES } from '../constants';
import { loadHorses, saveHorses } from '../services/db';

let nextId = 1;

const generateRandomHorse = (): Horse => {
  const name = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
  
  // Generate non-contradictory preferences
  const weatherCopy = [...WEATHER_CONDITIONS];
  const favorableWeather = weatherCopy.splice(Math.floor(Math.random() * weatherCopy.length), 1)[0];
  const unfavorableWeather = weatherCopy[Math.floor(Math.random() * weatherCopy.length)];
  
  const trackCopy = [...TRACK_CONDITIONS];
  const favorableTrack = trackCopy.splice(Math.floor(Math.random() * trackCopy.length), 1)[0];
  const unfavorableTrack = trackCopy[Math.floor(Math.random() * trackCopy.length)];

  // Generate horse based on Archetype
  const archetypes: HorseArchetype[] = ['Sprinter', 'Stayer', 'Balanced', 'All-Rounder'];
  const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

  let maxSpeed, stamina, acceleration;

  switch(archetype) {
    case 'Sprinter':
      maxSpeed = 65 + Math.random() * 10; // 65-75 (High)
      stamina = 80 + Math.random() * 15; // 80-95 (Low)
      acceleration = 1.1 + Math.random() * 0.3; // 1.1-1.4 (High)
      break;
    case 'Stayer':
      maxSpeed = 50 + Math.random() * 10; // 50-60 (Low)
      stamina = 110 + Math.random() * 20; // 110-130 (High)
      acceleration = 0.7 + Math.random() * 0.3; // 0.7-1.0 (Low)
      break;
    case 'All-Rounder':
      maxSpeed = 58 + Math.random() * 8; // 58-66 (Mid)
      stamina = 95 + Math.random() * 20; // 95-115 (Mid)
      acceleration = 0.9 + Math.random() * 0.2; // 0.9-1.1 (Mid)
      break;
    case 'Balanced': // Default/fallback
    default:
      maxSpeed = 55 + Math.random() * 15; // 55-70
      stamina = 90 + Math.random() * 30; // 90-120
      acceleration = 0.8 + Math.random() * 0.4; // 0.8-1.2
      break;
  }

  const horse: Horse = {
    id: nextId++,
    name: name,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    maxSpeed,
    stamina,
    acceleration,
    sprintSpeed: 1.20 + Math.random() * 0.20, // 20% to 40% speed boost
    sprintDuration: 25 + Math.floor(Math.random() * 10), // 25-35 ticks (2.5-3.5 seconds)
    sprintCharge: 0,
    agility: 50 + Math.random() * 50, // 50-100
    grit: 50 + Math.random() * 50, // 50-100 (Hidden stat)
    // FIX: Corrected typo from PACING_STYYLES to PACING_STYLES
    pacing: PACING_STYLES[Math.floor(Math.random() * PACING_STYLES.length)],
    racesRun: 0,
    favorableWeather,
    unfavorableWeather,
    favorableTrack,
    unfavorableTrack,
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
