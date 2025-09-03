import React, { useState, useEffect, useCallback } from 'react';
import { useStableMaster } from './hooks/useStableMaster';
import { useScheduler } from './hooks/useScheduler';
import { useRaceEngine } from './hooks/useRaceEngine';
import RaceTrack from './components/RaceTrack';
import Leaderboard from './components/Leaderboard';
import RaceStatus from './components/RaceStatus';
import { GameState } from './types';
import type { Horse, RaceResult } from './types';
import { saveRaceResults, loadRaceResults } from './services/db';

const App: React.FC = () => {
  const { horses, retireAndReplenishHorses, updateHorseStats } = useStableMaster();
  const [gameState, setGameState] = useState<GameState>(GameState.Waiting);
  const [currentRaceHorses, setCurrentRaceHorses] = useState<Horse[]>([]);
  const [allRaceResults, setAllRaceResults] = useState<RaceResult[]>([]);

  useEffect(() => {
    const loadedResults = loadRaceResults();
    setAllRaceResults(loadedResults);
  }, []);

  const { raceState, startRace, isRunning } = useRaceEngine();

  const handleStartRace = useCallback(() => {
    if (horses.length >= 8) {
      const shuffled = [...horses].sort(() => 0.5 - Math.random());
      const selectedHorses = shuffled.slice(0, 8);
      setCurrentRaceHorses(selectedHorses);
      startRace(selectedHorses);
      setGameState(GameState.Racing);
    }
  }, [horses, startRace]);

  const { timeToNextRace } = useScheduler(handleStartRace, !isRunning);
  
  useEffect(() => {
    if (raceState.isFinished) {
      setGameState(GameState.Finished);
      
      const finishedHorses = raceState.horses.filter(h => h.finishTime !== null);
      
      const result: RaceResult = {
        id: new Date().toISOString(),
        horses: finishedHorses.map(h => ({
          horseId: h.id,
          name: h.name,
          finalPosition: h.position,
          finishTime: h.finishTime!,
        })).sort((a, b) => a.finishTime - b.finishTime),
      };

      setAllRaceResults(prev => {
        const newResults = [result, ...prev];
        saveRaceResults(newResults);
        return newResults;
      });

      const updatedHorses = updateHorseStats(finishedHorses.map(h => h.id));
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
          <RaceTrack horses={raceState.horses} isRunning={isRunning} />
        </div>

        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <Leaderboard
            horses={raceState.horses}
            gameState={gameState}
            raceResults={raceState.isFinished ? allRaceResults[0] : undefined}
          />
        </aside>
      </main>
    </div>
  );
};

export default App;
