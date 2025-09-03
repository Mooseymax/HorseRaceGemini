import React, { useMemo } from 'react';
import type { RaceHorse, RaceResult } from '../types';
import { GameState } from '../types';

interface LeaderboardProps {
  horses: RaceHorse[];
  gameState: GameState;
  raceResults?: RaceResult;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ horses, gameState, raceResults }) => {

  const sortedHorses = useMemo(() => {
    return [...horses].sort((a, b) => b.position - a.position);
  }, [horses]);

  const renderLeaderboard = () => {
    if (gameState === GameState.Waiting) {
      return <div className="text-center p-8 text-gray-400">Waiting for the next race to begin.</div>;
    }
    
    if (gameState === GameState.Finished && raceResults) {
      return (
        <div>
          <h3 className="text-xl font-bold text-cyan-400 text-center mb-4">Final Results</h3>
          <ul className="space-y-2">
            {raceResults.horses.map((result, index) => (
               <li key={result.horseId} className="flex items-center bg-gray-700/50 p-3 rounded-lg shadow-md">
                 <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-gray-900 mr-3 ${
                   index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-yellow-600' : 'bg-gray-500'
                 }`}>{index + 1}</span>
                 <span className="font-semibold flex-grow">{result.name}</span>
                 <span className="text-sm text-gray-300">{(result.finishTime / 1000).toFixed(2)}s</span>
               </li>
            ))}
          </ul>
        </div>
      );
    }
    
    return (
      <div className="relative">
        {sortedHorses.map((horse, index) => {
          const rank = index + 1;
          return (
            <div
              key={horse.id}
              className="absolute w-full flex items-center bg-gray-700/50 p-3 rounded-lg shadow-md transition-transform duration-500 ease-in-out"
              style={{ top: `${index * 80}px`, willChange: 'transform' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mr-4" style={{backgroundColor: horse.color}}>
                {horse.id}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-white">{horse.name}</p>
                <p className={`text-xs font-mono uppercase ${horse.status === 'sprinting' ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                  {horse.status}
                </p>
              </div>
              <div className="text-2xl font-bold text-gray-500 w-10 text-right">
                {rank}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 shadow-2xl border border-gray-700 h-full">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-gray-600 text-center text-gray-300">
        Race Standings
      </h2>
      <div className="relative" style={{ minHeight: `${HORSES_IN_RACE * 80}px` }}>
        {renderLeaderboard()}
      </div>
    </div>
  );
};

const HORSES_IN_RACE = 8; // Should match constant

export default Leaderboard;
