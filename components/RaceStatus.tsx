import React from 'react';
import { GameState } from '../types';

interface RaceStatusProps {
  gameState: GameState;
  timeToNextRace: number;
  raceTime: number;
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const formatRaceTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    return totalSeconds.toFixed(2);
}

const RaceStatus: React.FC<RaceStatusProps> = ({ gameState, timeToNextRace, raceTime }) => {
  const renderStatus = () => {
    switch (gameState) {
      case GameState.Waiting:
        return (
          <>
            <div className="text-lg text-gray-400">Next race starts in:</div>
            <div className="text-5xl font-bold text-cyan-400 tracking-wider">{formatTime(timeToNextRace)}</div>
          </>
        );
      case GameState.Racing:
        return (
          <>
            <div className="text-lg text-gray-400">Race Time:</div>
            <div className="flex items-center space-x-4">
               <div className="text-5xl font-bold text-red-500 tracking-wider">{formatRaceTime(raceTime)}s</div>
               <div className="px-3 py-1 text-sm font-bold text-white bg-red-600 rounded-full pulse-live">LIVE</div>
            </div>
          </>
        );
      case GameState.Finished:
        return (
          <>
            <div className="text-lg text-gray-400">Race Finished!</div>
            <div className="text-5xl font-bold text-green-400">Results are in</div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full text-center p-4 bg-gray-900/50 rounded-t-lg">
        {renderStatus()}
    </div>
  );
};

export default RaceStatus;
