import React, { useState, useEffect, useCallback } from 'react';
import { useStableMaster } from './hooks/useStableMaster';
import { useScheduler } from './hooks/useScheduler';
import { useRaceEngine } from './hooks/useRaceEngine';
import RaceTrack from './components/RaceTrack';
import Leaderboard from './components/Leaderboard';
import RaceStatus from './components/RaceStatus';
import Announcer from './components/Announcer';
import WeatherDisplay from './components/WeatherDisplay';
import { GameState } from './types';
import type { Horse, RaceResult, Weather, TrackCondition, UpcomingHorse, HorseForm } from './types';
import { saveRaceResults, loadRaceResults } from './services/db';
import { HORSES_IN_RACE, WEATHER_CONDITIONS, TRACK_CONDITIONS, HORSE_FORMS } from './constants';

const App: React.FC = () => {
  const { horses, retireAndReplenishHorses, updateHorseStats } = useStableMaster();
  const [gameState, setGameState] = useState<GameState>(GameState.Waiting);
  const [currentRaceHorses, setCurrentRaceHorses] = useState<UpcomingHorse[]>([]);
  const [upcomingRaceHorses, setUpcomingRaceHorses] = useState<UpcomingHorse[]>([]);
  const [allRaceResults, setAllRaceResults] = useState<RaceResult[]>([]);
  const [weather, setWeather] = useState<Weather>('Sunny');
  const [trackCondition, setTrackCondition] = useState<TrackCondition>('Dry');

  useEffect(() => {
    const loadedResults = loadRaceResults();
    setAllRaceResults(loadedResults);
  }, []);

  const { raceState, startRace, isRunning, announcerMessage } = useRaceEngine();

  const handleStartRace = useCallback(() => {
    if (upcomingRaceHorses.length >= HORSES_IN_RACE) {
      setCurrentRaceHorses(upcomingRaceHorses);
      startRace(upcomingRaceHorses, weather, trackCondition);
      setGameState(GameState.Racing);
      setUpcomingRaceHorses([]);
    }
  }, [startRace, upcomingRaceHorses, weather, trackCondition]);

  const { timeToNextRace } = useScheduler(handleStartRace, !isRunning && gameState === GameState.Waiting);
  
  // Effect to select horses, conditions, and form for the next race
  useEffect(() => {
    if (gameState === GameState.Waiting && horses.length >= HORSES_IN_RACE && upcomingRaceHorses.length === 0) {
      const newWeather = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
      const newTrackCondition = TRACK_CONDITIONS[Math.floor(Math.random() * TRACK_CONDITIONS.length)];
      setWeather(newWeather);
      setTrackCondition(newTrackCondition);

      const totalWeight = HORSE_FORMS.reduce((sum, form) => sum + form.weight, 0);
      const getRandomForm = (): HorseForm => {
        let random = Math.random() * totalWeight;
        for (const form of HORSE_FORMS) {
          if (random < form.weight) {
            return form.name;
          }
          random -= form.weight;
        }
        return 'Average'; // Fallback
      };

      const shuffled = [...horses].sort(() => 0.5 - Math.random());
      const selectedHorses = shuffled.slice(0, HORSES_IN_RACE);
      
      const horsesWithForm: UpcomingHorse[] = selectedHorses.map(horse => ({
        ...horse,
        form: getRandomForm(),
      }));

      setUpcomingRaceHorses(horsesWithForm);
    }
  }, [gameState, horses, upcomingRaceHorses]);

  useEffect(() => {
    if (raceState.isFinished) {
      setGameState(GameState.Finished);
      
      const raceParticipants = raceState.horses;
      
      const result: RaceResult = {
        id: new Date().toISOString(),
        weather: weather,
        trackCondition: trackCondition,
        horses: raceParticipants.map(h => ({
          horseId: h.id,
          name: h.name,
          finishTime: h.finishTime,
          maxSpeed: h.maxSpeed,
          stamina: h.stamina,
          agility: h.agility,
          grit: h.grit,
          pacing: h.pacing,
          form: h.form,
        })).sort((a, b) => (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity)),
      };

      setAllRaceResults(prev => {
        const newResults = [result, ...prev];
        saveRaceResults(newResults);
        return newResults;
      });

      const updatedHorses = updateHorseStats(raceParticipants.map(h => h.id));
      retireAndReplenishHorses(updatedHorses);

      const raceFinishTimer = setTimeout(() => {
        setGameState(GameState.Waiting);
        setCurrentRaceHorses([]);
      }, 15000); // 15 second post-race screen

      return () => clearTimeout(raceFinishTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceState.isFinished]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 lg:p-8 flex flex-col">
      <header className="w-full max-w-7xl mx-auto mb-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-center text-cyan-400 tracking-wider">
          Gemini Downs
        </h1>
        <p className="text-center text-gray-400">Virtual Horse Racing Simulation</p>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow flex flex-col lg:flex-row gap-8">
        <div className="flex-grow flex flex-col bg-gray-800/50 rounded-lg p-4 shadow-2xl border border-gray-700">
          <RaceStatus gameState={gameState} timeToNextRace={timeToNextRace} raceTime={raceState.time} />
          <Announcer message={announcerMessage} />
          <RaceTrack horses={raceState.horses} isRunning={isRunning} />
        </div>

        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-4">
          <WeatherDisplay weather={weather} trackCondition={trackCondition} />
          <Leaderboard
            horses={raceState.horses}
            gameState={gameState}
            raceResults={raceState.isFinished ? allRaceResults[0] : undefined}
            upcomingHorses={upcomingRaceHorses}
            weather={weather}
            trackCondition={trackCondition}
          />
        </aside>
      </main>
    </div>
  );
};

export default App;