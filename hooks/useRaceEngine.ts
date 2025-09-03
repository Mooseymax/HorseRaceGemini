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
  const lastEventMessageTimeRef = useRef(0);
  const lastLeadChangeMessageTimeRef = useRef(0);
  const leaderRef = useRef<number | null>(null);

  const postAnnouncerMessage = useCallback((message: string, priority = false) => {
    const now = Date.now();
    const isLeadChange = message.includes('takes the lead!');

    if (isLeadChange) {
      if (now - lastLeadChangeMessageTimeRef.current < 5000) return; // 5s cooldown for lead changes
    } else if (!priority) {
      if (now - lastEventMessageTimeRef.current < 4000) return; // 4s cooldown for other events
    }

    if (announcerTimeoutRef.current) {
        clearTimeout(announcerTimeoutRef.current);
    }

    setAnnouncerMessage(message);

    // Update the correct cooldown timer. A lead change should not block other events.
    if (isLeadChange) {
        lastLeadChangeMessageTimeRef.current = now;
    } else {
        // Priority and non-priority events update the event timer
        lastEventMessageTimeRef.current = now;
    }

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
        let dnfCount = 0;
        let horsesToUpdate = [...prevState.horses];

        // --- "ACT OF GOD" RANDOM EVENTS ---
        const ACT_OF_GOD_CHANCE = 0.0016; // Increased from 0.0004 for more frequent events
        if (Math.random() < ACT_OF_GOD_CHANCE) {
          const activeHorses = horsesToUpdate.filter(h => h.status === 'running' || h.status === 'sprinting');
          if (activeHorses.length > 0) {
            const unluckyHorseIndex = horsesToUpdate.findIndex(h => h.id === activeHorses[Math.floor(Math.random() * activeHorses.length)].id);
            if (unluckyHorseIndex !== -1) {
              const unluckyHorse = horsesToUpdate[unluckyHorseIndex];
              let eventMessage = '';
              let newStatus: RaceHorse['status'] = 'stumbled';
              if (trackCondition === 'Muddy') {
                eventMessage = `${unluckyHorse.name} gets bogged down in the mud!`;
              } else {
                switch (weather) {
                  case 'Rainy':
                    eventMessage = `A crash of lightning spooks ${unluckyHorse.name}!`;
                    newStatus = 'spooked';
                    break;
                  case 'Windy':
                    eventMessage = `A huge gust of wind throws ${unluckyHorse.name} off stride!`;
                    break;
                  case 'Sunny':
                    eventMessage = `${unluckyHorse.name} is blinded by a sudden sun glare!`;
                    break;
                  default:
                    eventMessage = `${unluckyHorse.name} hits a patch of rough turf!`;
                    break;
                }
              }

              const DNF_FROM_EVENT_CHANCE = 0.20; // 20% chance an 'Act of God' event causes a DNF
              if (Math.random() < DNF_FROM_EVENT_CHANCE) {
                let dnfMessage = `Oh no! ${unluckyHorse.name} has been forced out of the race!`;
                 if (weather === 'Rainy') {
                    dnfMessage = `The lightning was too much for ${unluckyHorse.name}, who has bolted off the track!`;
                }
                unluckyHorse.status = 'dnf';
                postAnnouncerMessage(dnfMessage, true);
              } else {
                unluckyHorse.status = newStatus;
                unluckyHorse.statusStartTime = newTime;
                postAnnouncerMessage(eventMessage, true);
              }
            }
          }
        }
        
        const sortedByPosition = [...horsesToUpdate].sort((a,b) => b.position - a.position);

        let updatedHorses = horsesToUpdate.map(horse => {
          if (horse.status === 'finished' || horse.status === 'dnf') {
            if (horse.status === 'finished') finishedCount++;
            if (horse.status === 'dnf') dnfCount++;
            return horse;
          }

          let newStatus: RaceHorse['status'] = horse.status;
          let newSpeed = horse.currentSpeed;
          let newStamina = horse.currentStamina;
          const raceProgress = horse.position / TRACK_LENGTH;

          // --- MODIFIERS ---
          const form = HORSE_FORMS.find(f => f.name === horse.form);
          const formMultiplier = form ? form.multiplier : 1.0;

          let speedModifier = 1.0;
          let agilityModifier = 1.0;
          if (horse.favorableWeather === weather) speedModifier += 0.05;
          if (horse.unfavorableWeather === weather) { speedModifier -= 0.05; agilityModifier -= 0.25; }
          if (horse.favorableTrack === trackCondition) speedModifier += 0.05;
          if (horse.unfavorableTrack === trackCondition) { speedModifier -= 0.05; agilityModifier -= 0.25; }
          
          if (raceProgress > 0.85 && horse.grit > 60) {
            const rival = prevState.horses.find(h => h.id !== horse.id && h.status !== 'finished' && Math.abs(h.position - horse.position) < 8);
            if (rival) {
                speedModifier += (horse.grit - 60) / 400;
                if (Math.random() < 0.01) postAnnouncerMessage(`${horse.name} is digging deep!`);
            }
          }

          // --- TARGET SPEED & PACING ---
          let paceTargetPercent = 0.85; 
          switch(horse.pacing) {
            case 'Front Runner': paceTargetPercent = raceProgress < 0.5 ? 1.05 : 0.75; break;
            case 'Closer': paceTargetPercent = raceProgress < 0.75 ? 0.70 : 1.20; break;
            case 'Mid-pack': paceTargetPercent = 0.85 + (raceProgress * 0.1); break;
          }
          
          if (newStatus === 'exhausted') paceTargetPercent *= 0.6;
          if (newStatus === 'stumbled') paceTargetPercent *= 0.5;
          if (newStatus === 'spooked') paceTargetPercent *= 0.4;
          if (newStatus === 'boxedin') paceTargetPercent *= 0.85;
          if (newStatus === 'perfectstride') paceTargetPercent *= 1.1;

          // Horse has fallen, stop it completely for a while
          if (newStatus === 'fallen') {
            newSpeed = 0;
          } else {
            const targetSpeed = horse.maxSpeed * paceTargetPercent * speedModifier * formMultiplier;
            if (newSpeed < targetSpeed) {
              newSpeed = Math.min(targetSpeed, newSpeed + horse.acceleration);
            } else {
              newSpeed = Math.max(targetSpeed, newSpeed - horse.acceleration / 2);
            }
          }
          
          // --- STAMINA & DYNAMIC EVENTS ---
          if (newStatus !== 'perfectstride') {
              const drainFactor = (newSpeed / horse.maxSpeed);
              if (drainFactor > 0.7) {
                newStamina -= (drainFactor * drainFactor) * 0.4;
              } else {
                newStamina += 0.15;
              }
          }
          
          const surgeChance = 0.0005 + (horse.grit > 80 ? 0.001 : 0);
          if (newStamina < horse.stamina * 0.3 && Math.random() < surgeChance) {
              newStamina += horse.stamina * 0.25;
              postAnnouncerMessage(`${horse.name} gets a second wind!`, true);
          }

          if (newStamina < 10 && horse.grit > 75) newStamina += (horse.grit - 75) / 500;
          newStamina = Math.max(0, Math.min(horse.stamina, newStamina));

          if (newStamina <= 0 && newStatus !== 'exhausted') {
            newStatus = 'exhausted';
            postAnnouncerMessage(`${horse.name} is exhausted!`);
          } else if (newStamina > horse.stamina * 0.1 && newStatus === 'exhausted') {
            newStatus = 'running';
          }

          // --- STATUS CHANGES (RECOVERY & MISHAPS) ---
          if ((newStatus === 'stumbled' || newStatus === 'perfectstride') && newTime > horse.statusStartTime + 2000) newStatus = 'running';
          if (newStatus === 'spooked' && newTime > horse.statusStartTime + 3000) newStatus = 'running';
          if (newStatus === 'boxedin' && newTime > horse.statusStartTime + 1500) newStatus = 'running';
          if (newStatus === 'fallen' && newTime > horse.statusStartTime + 4000) newStatus = 'running'; // Recovery from fall
          
          if (newStatus === 'running') {
              // Stumble / Fall / DNF Chain
              const effectiveAgility = horse.agility * agilityModifier;
              const stumbleChance = 0.0015 * (1 - effectiveAgility / 100);
              if (Math.random() < stumbleChance) {
                if (Math.random() < 0.15) { // 15% of stumbles are falls
                  newStatus = 'fallen';
                  horse.statusStartTime = newTime;
                  postAnnouncerMessage(`${horse.name} takes a heavy fall!`, true);
                  if (Math.random() < 0.25) { // 25% of falls are DNF
                    newStatus = 'dnf';
                    postAnnouncerMessage(`${horse.name} is out of the race!`, true);
                  }
                } else {
                  newStatus = 'stumbled';
                  horse.statusStartTime = newTime;
                  postAnnouncerMessage(`${horse.name} has stumbled!`, true);
                }
              }
              // Other events
              else if (Math.random() < 0.001) {
                  const rank = sortedByPosition.findIndex(h => h.id === horse.id) + 1;
                  if (rank > 2 && rank < HORSES_IN_RACE - 1) {
                      newStatus = 'boxedin';
                      horse.statusStartTime = newTime;
                      postAnnouncerMessage(`${horse.name} is boxed in by the pack!`);
                  }
              }
              else if (Math.random() < 0.0008) {
                  newStatus = 'perfectstride';
                  horse.statusStartTime = newTime;
                  postAnnouncerMessage(`${horse.name} hits a perfect stride!`);
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
        
        const currentSortedHorses = [...updatedHorses].sort((a,b) => b.position - a.position);
        updatedHorses = updatedHorses.map(h => {
            const rank = currentSortedHorses.findIndex(sh => sh.id === h.id) + 1;
            return {...h, rank};
        });
        
        const sortedLiveHorses = updatedHorses.filter(h => h.status !== 'finished' && h.status !== 'fallen' && h.status !== 'dnf');
        if (sortedLiveHorses.length > 0) {
            const currentLeaderId = sortedLiveHorses[0].id;
            if (leaderRef.current !== currentLeaderId) {
                leaderRef.current = currentLeaderId;
                postAnnouncerMessage(`${sortedLiveHorses[0].name} takes the lead!`);
            }
        }

        const isRaceFinished = (finishedCount + dnfCount) >= prevState.horses.length;
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