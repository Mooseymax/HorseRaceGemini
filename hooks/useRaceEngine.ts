import { useState, useCallback, useRef, useEffect } from 'react';
import type { Horse, RaceHorse, RaceState, Weather, TrackCondition, UpcomingHorse } from '../types';
import { TRACK_LENGTH, TICK_RATE, HORSES_IN_RACE, HORSE_FORMS } from '../constants';

const initialState: RaceState = {
  horses: [],
  time: 0,
  isFinished: false,
};

export const useRaceEngine = () => {
  const [raceState, setRaceState] = useState<RaceState>(initialState);
  const [isRunning, setIsRunning] = useState(false);
  const [announcerMessage, setAnnouncerMessage] = useState('');
  
  const raceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const raceConditionsRef = useRef<{ weather: Weather, trackCondition: TrackCondition }>({ weather: 'Sunny', trackCondition: 'Dry'});
  const announcerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageTimeRef = useRef(0);
  const leaderRef = useRef<number | null>(null);

  const postAnnouncerMessage = useCallback((message: string, priority = false) => {
    const now = Date.now();
    if (!priority && now - lastMessageTimeRef.current < 4000) return; // 4s cooldown for non-priority

    if (announcerTimeoutRef.current) {
        clearTimeout(announcerTimeoutRef.current);
    }

    setAnnouncerMessage(message);
    lastMessageTimeRef.current = now;

    announcerTimeoutRef.current = setTimeout(() => {
        setAnnouncerMessage('');
    }, 3500); // Message displayed for 3.5s
  }, []);

  const stopRace = useCallback(() => {
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
     if (announcerTimeoutRef.current) {
      clearTimeout(announcerTimeoutRef.current);
    }
    setIsRunning(false);
  }, []);

  const startRace = useCallback((participants: UpcomingHorse[], weather: Weather, trackCondition: TrackCondition) => {
    stopRace();
    leaderRef.current = null;
    raceConditionsRef.current = { weather, trackCondition };
    setAnnouncerMessage('And they\'re off!');
    announcerTimeoutRef.current = setTimeout(() => setAnnouncerMessage(''), 3000);

    setRaceState({
      horses: participants.map((h, index) => ({
        ...h,
        position: 0,
        currentSpeed: 0,
        currentStamina: h.stamina,
        currentSprintCharge: 0,
        status: 'running',
        statusStartTime: 0,
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
        
        const { weather, trackCondition } = raceConditionsRef.current;
        const newTime = prevState.time + TICK_RATE;
        let finishedCount = 0;

        let updatedHorses = prevState.horses.map(horse => {
          if (horse.status === 'finished' || horse.status === 'fallen') {
            if(horse.status === 'finished') finishedCount++;
            return horse;
          }

          let newStatus: RaceHorse['status'] = horse.status;
          let newSpeed = horse.currentSpeed;
          let newStamina = horse.currentStamina;
          
          // Check for exhaustion
          if (newStamina <= 0 && newStatus !== 'exhausted') {
            newStatus = 'exhausted';
            postAnnouncerMessage(`${horse.name} is exhausted!`);
          } else if (newStamina > horse.stamina * 0.1 && newStatus === 'exhausted') {
            newStatus = 'running'; // Can recover from exhaustion
          }

          // --- MODIFIERS ---
          const form = HORSE_FORMS.find(f => f.name === horse.form);
          const formMultiplier = form ? form.multiplier : 1.0;

          let speedModifier = 1.0;
          let agilityModifier = 1.0;
          if (horse.favorableWeather === weather) speedModifier += 0.03;
          if (horse.unfavorableWeather === weather) { speedModifier -= 0.03; agilityModifier -= 0.15; }
          if (horse.favorableTrack === trackCondition) speedModifier += 0.03;
          if (horse.unfavorableTrack === trackCondition) { speedModifier -= 0.03; agilityModifier -= 0.15; }
          
          // --- TARGET SPEED & PACING ---
          let paceTargetPercent = 0.85; // Default for Mid-pack
          const raceProgress = horse.position / TRACK_LENGTH;

          switch(horse.pacing) {
            case 'Front Runner':
              paceTargetPercent = raceProgress < 0.6 ? 0.98 : 0.80;
              break;
            case 'Closer':
              paceTargetPercent = raceProgress < 0.7 ? 0.75 : 1.10; // The 1.10 encourages a final sprint
              break;
            case 'Mid-pack':
              paceTargetPercent = 0.85 + (raceProgress * 0.1); // Gently ramp up
              break;
          }
          
          // Exhaustion penalty
          if (newStatus === 'exhausted') {
            paceTargetPercent *= 0.6; // 40% speed penalty
          }
          
          const targetSpeed = horse.maxSpeed * paceTargetPercent * speedModifier * formMultiplier;
          
          // --- ACCELERATION ---
          if (newSpeed < targetSpeed) {
            newSpeed = Math.min(targetSpeed, newSpeed + horse.acceleration);
          } else {
            newSpeed = Math.max(targetSpeed, newSpeed - horse.acceleration / 2);
          }
          
          // --- STAMINA DRAIN/RECOVERY ---
          const drainFactor = (newSpeed / horse.maxSpeed);
          if (drainFactor > 0.7) {
            newStamina -= (drainFactor * drainFactor) * 0.4; // Faster speeds drain exponentially more
          } else {
            newStamina += 0.15; // Recover stamina when slow
          }

          // Grit can help resist exhaustion
          if (newStamina < 10 && horse.grit > 75) {
            newStamina += (horse.grit - 75) / 500;
          }
          newStamina = Math.max(0, Math.min(horse.stamina, newStamina));

          // --- STATUS CHANGES (STUMBLE, SPRINT) ---
          if (newStatus === 'stumbled') {
              newSpeed *= 0.5;
              if (newTime > horse.statusStartTime + 2000) newStatus = 'running';
          } else if (newStatus !== 'exhausted') { // Can't stumble or sprint if exhausted
              const effectiveAgility = horse.agility * agilityModifier;
              const stumbleChance = 0.0015 * (1 - effectiveAgility / 100);
              if (Math.random() < stumbleChance) {
                  newStatus = 'stumbled';
                  postAnnouncerMessage(`${horse.name} has stumbled!`, true);
                  horse.statusStartTime = newTime;
              }
          }
          
          let newPosition = horse.position + newSpeed * (TICK_RATE / 1000);

          if (newPosition >= TRACK_LENGTH) {
            newPosition = TRACK_LENGTH;
            newStatus = 'finished';
            horse.finishTime = newTime;
            finishedCount++;
            postAnnouncerMessage(`${horse.name} has finished the race!`, true);
          }
          
          return { ...horse, position: newPosition, currentSpeed: newSpeed, currentStamina: newStamina, status: newStatus, finishTime: horse.finishTime };
        });
        
        const sortedHorses = [...updatedHorses].sort((a,b) => b.position - a.position);
        updatedHorses = updatedHorses.map(h => {
            const rank = sortedHorses.findIndex(sh => sh.id === h.id) + 1;
            return {...h, rank};
        });
        
        const sortedLiveHorses = updatedHorses.filter(h => h.status !== 'finished');
        if (sortedLiveHorses.length > 0) {
            const currentLeaderId = sortedLiveHorses[0].id;
            if (leaderRef.current !== currentLeaderId) {
                leaderRef.current = currentLeaderId;
                postAnnouncerMessage(`${sortedLiveHorses[0].name} takes the lead!`);
            }
        }

        const isRaceFinished = finishedCount === prevState.horses.length;
        if(isRaceFinished) {
            stopRace();
        }
        
        return { ...prevState, horses: updatedHorses, time: newTime, isFinished: isRaceFinished };
      });
    }, TICK_RATE);

    return () => stopRace();
  }, [isRunning, stopRace, postAnnouncerMessage]);

  return { raceState, startRace, isRunning, announcerMessage };
};