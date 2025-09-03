import { useState, useEffect, useRef } from 'react';
import { RACE_INTERVAL } from '../constants';

export const useScheduler = (onRaceStart: () => void, canSchedule: boolean) => {
  const [timeToNextRace, setTimeToNextRace] = useState(RACE_INTERVAL);
  // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRaceStartRef = useRef(onRaceStart);
  onRaceStartRef.current = onRaceStart;

  useEffect(() => {
    if (!canSchedule) {
      if(timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    // Set a timeout to start the race when timer hits zero
    const raceTimeout = setTimeout(() => {
        onRaceStartRef.current();
        setTimeToNextRace(RACE_INTERVAL);
    }, timeToNextRace);

    // Set an interval to update the countdown display
    timerRef.current = setInterval(() => {
      setTimeToNextRace(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      if(timerRef.current) clearInterval(timerRef.current);
      clearTimeout(raceTimeout);
    };
  }, [canSchedule, timeToNextRace]);

  return { timeToNextRace };
};