import { useState, useCallback, useRef, useEffect } from 'react';
import type { Horse, RaceHorse, RaceState } from '../types';
import { TRACK_LENGTH, TICK_RATE } from '../constants';

const initialState: RaceState = {
  horses: [],
  time: 0,
  isFinished: false,
};

export const useRaceEngine = () => {
  const [raceState, setRaceState] = useState<RaceState>(initialState);
  const [isRunning, setIsRunning] = useState(false);
  // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
  const raceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRace = useCallback(() => {
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startRace = useCallback((participants: Horse[]) => {
    stopRace();
    setRaceState({
      horses: participants.map((h, index) => ({
        ...h,
        position: 0,
        currentSpeed: 0,
        currentStamina: h.stamina,
        currentSprintCharge: 0,
        status: 'running',
        finishTime: null,
        rank: index + 1,
      })),
      time: 0,
      isFinished: false,
    });
    setIsRunning(true);
  }, [stopRace]);
  
  useEffect(() => {
    if (!isRunning) return;

    raceIntervalRef.current = setInterval(() => {
      setRaceState(prevState => {
        if (prevState.isFinished) {
            stopRace();
            return prevState;
        }

        const newTime = prevState.time + TICK_RATE;
        let finishedCount = 0;

        const updatedHorses = prevState.horses.map(horse => {
          if (horse.status === 'finished' || horse.status === 'fallen') {
            if(horse.status === 'finished') finishedCount++;
            return horse;
          }

          // FIX: Explicitly type `newStatus` to prevent incorrect type inference narrowing.
          let newStatus: RaceHorse['status'] = horse.status;
          let newSpeed = horse.currentSpeed;
          let newStamina = horse.currentStamina;
          let newSprintCharge = horse.currentSprintCharge;

          // Stamina effects
          const staminaFactor = Math.max(0.2, newStamina / horse.stamina);
          const targetSpeed = horse.maxSpeed * staminaFactor;
          
          // Acceleration
          if (newSpeed < targetSpeed) {
            newSpeed = Math.min(targetSpeed, newSpeed + horse.acceleration);
          } else {
            newSpeed = Math.max(targetSpeed, newSpeed - horse.acceleration / 2);
          }

          // Stamina drain/recovery
          if (newSpeed > horse.maxSpeed * 0.7) {
            newStamina -= (newSpeed / horse.maxSpeed) * 0.3;
          } else {
            newStamina += 0.1;
          }
          newStamina = Math.max(0, Math.min(horse.stamina, newStamina));
          
          // Sprint logic
          if (newStatus === 'sprinting') {
             newSpeed *= horse.sprintSpeed;
             newStamina -= 1.5; // High stamina cost for sprinting
             if (newTime > (horse.finishTime ?? 0) + horse.sprintDuration * TICK_RATE) { // finishTime is used to store sprint start time
                 newStatus = 'running';
             }
          } else {
             newSprintCharge = Math.min(100, newSprintCharge + 0.5);
             // Chance to sprint
             if (newSprintCharge >= 100 && Math.random() < 0.02) {
                 newStatus = 'sprinting';
                 newSprintCharge = 0;
                 horse.finishTime = newTime; // temporary storage for sprint start time
             }
          }
          
          // Stumble logic
          if (newStatus === 'stumbled') {
              newSpeed *= 0.5;
              if (newTime > (horse.finishTime ?? 0) + 2000) { // finishTime used to store stumble start
                  newStatus = 'running';
              }
          } else if (Math.random() < 0.001 * (1 - horse.agility / 120)) { // agility reduces chance
              newStatus = 'stumbled';
              horse.finishTime = newTime; // temp store stumble start
          }

          // Update position
          let newPosition = horse.position + newSpeed * (TICK_RATE / 1000);

          // Finish line check
          if (newPosition >= TRACK_LENGTH) {
            newPosition = TRACK_LENGTH;
            newStatus = 'finished';
            horse.finishTime = newTime;
            finishedCount++;
          }
          
          return { ...horse, position: newPosition, currentSpeed: newSpeed, currentStamina: newStamina, status: newStatus, currentSprintCharge: newSprintCharge, finishTime: horse.finishTime };
        });

        const isRaceFinished = finishedCount === prevState.horses.length;
        if(isRaceFinished) {
            stopRace();
        }
        
        return {
          ...prevState,
          horses: updatedHorses,
          time: newTime,
          isFinished: isRaceFinished,
        };
      });
    }, TICK_RATE);

    return () => stopRace();
  }, [isRunning, stopRace]);

  return { raceState, startRace, isRunning };
};