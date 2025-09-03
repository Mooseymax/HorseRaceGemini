import React, { useMemo } from 'react';
import type { Horse, RaceHorse, RaceResult, Weather, TrackCondition, UpcomingHorse } from '../types';
import { GameState } from '../types';
import { HORSES_IN_RACE, HORSE_FORMS } from '../constants';

interface LeaderboardProps {
  horses: RaceHorse[];
  gameState: GameState;
  raceResults?: RaceResult;
  upcomingHorses?: UpcomingHorse[];
  weather?: Weather;
  trackCondition?: TrackCondition;
}

const PreferenceIndicator: React.FC<{horse: Horse, weather?: Weather, trackCondition?: TrackCondition}> = ({horse, weather, trackCondition}) => {
    const indicators = [];
    if (weather && horse.favorableWeather === weather) {
        indicators.push({icon: '☀️', title: `Loves ${weather} weather`});
    }
    if (weather && horse.unfavorableWeather === weather) {
        indicators.push({icon: '🌧️', title: `Hates ${weather} weather`});
    }
    if (trackCondition && horse.favorableTrack === trackCondition) {
        indicators.push({icon: '👍', title: `Prefers ${trackCondition} track`});
    }
    if (trackCondition && horse.unfavorableTrack === trackCondition) {
        indicators.push({icon: '👎', title: `Dislikes ${trackCondition} track`});
    }

    if (indicators.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            {indicators.map((ind, i) => (
                <span key={i} title={ind.title} className="text-lg" aria-label={ind.title}>{ind.icon}</span>
            ))}
        </div>
    );
}

const Leaderboard: React.FC<LeaderboardProps> = ({ horses, gameState, raceResults, upcomingHorses, weather, trackCondition }) => {

  const sortedHorses = useMemo(() => {
    return [...horses].sort((a, b) => b.position - a.position);
  }, [horses]);

  const renderLeaderboard = () => {
    if (gameState === GameState.Waiting) {
      if (upcomingHorses && upcomingHorses.length > 0) {
        return (
          <div>
            <h3 className="text-xl font-bold text-cyan-400 text-center mb-4">Next To Race</h3>
            <ul className="space-y-2">
              {upcomingHorses.map(horse => {
                // FOR TESTING: This should be hidden in production.
                const formInfo = HORSE_FORMS.find(f => f.name === horse.form);
                
                return (
                  <li key={horse.id} className="flex items-center bg-gray-700/50 p-3 rounded-lg shadow-md">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mr-4 flex-shrink-0" style={{ backgroundColor: horse.color }}>
                      {horse.id}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-white">{horse.name}</p>
                      <p className="text-xs text-gray-400">
                        Spd: {horse.maxSpeed.toFixed(0)} | Sta: {horse.stamina.toFixed(0)} | Agl: {horse.agility.toFixed(0)}
                      </p>
                       <p className="text-xs text-cyan-300/80 font-medium">Style: {horse.pacing}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      {formInfo && <span className="text-lg" title={`Form: ${formInfo.name}`}>{formInfo.icon}</span>}
                      <PreferenceIndicator horse={horse} weather={weather} trackCondition={trackCondition} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      return <div className="text-center p-8 text-gray-400">Selecting horses for the next race...</div>;
    }
    
    if (gameState === GameState.Finished && raceResults) {
      return (
        <div>
          <h3 className="text-xl font-bold text-cyan-400 text-center mb-1">Final Results</h3>
          {/* FOR TESTING: The conditions below are for analysis and should be removed for the final version. */}
          <p className="text-xs text-center text-gray-400 mb-3">
            Conditions: {raceResults.weather}, {raceResults.trackCondition}
          </p>
          <ul className="space-y-2">
            {raceResults.horses.map((result, index) => (
               <li key={result.horseId} className="flex items-center bg-gray-700/50 p-3 rounded-lg shadow-md">
                 <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-gray-900 mr-3 flex-shrink-0 ${
                   index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-yellow-600' : 'bg-gray-500'
                 }`}>{index + 1}</span>
                  <div className="flex-grow">
                    <span className="font-semibold block">{result.name}</span>
                    <span className="text-xs text-gray-400">Horse #{result.horseId}</span>
                    {/* FOR TESTING: The stats below are for analysis and should be removed for the final version. */}
                    <div className="text-xs text-gray-400 mt-1 border-t border-gray-600 pt-1">
                      <p>Spd: {result.maxSpeed.toFixed(0)} | Sta: {result.stamina.toFixed(0)} | Agl: {result.agility.toFixed(0)}</p>
                      <p>Grit: {result.grit.toFixed(0)} | Form: <span className="font-semibold">{result.form}</span> | Style: <span className="font-semibold">{result.pacing}</span></p>
                    </div>
                  </div>
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
          let statusColor = 'text-gray-400';
          if (horse.status === 'sprinting') statusColor = 'text-red-400 animate-pulse';
          if (horse.status === 'exhausted') statusColor = 'text-yellow-500';

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
                <p className={`text-xs font-mono uppercase ${statusColor}`}>
                  {horse.status}
                </p>
              </div>
              <div className="text-2xl font-bold text-gray-500 w-10 text-right">
                {index + 1}
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

export default Leaderboard;