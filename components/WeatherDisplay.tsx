import React from 'react';
import type { Weather, TrackCondition } from '../types';

interface WeatherDisplayProps {
  weather: Weather;
  trackCondition: TrackCondition;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weather, trackCondition }) => {
  const getWeatherIcon = (weather: Weather) => {
    switch (weather) {
      case 'Sunny': return '☀️';
      case 'Overcast': return '☁️';
      case 'Rainy': return '🌧️';
      case 'Windy': return '💨';
      default: return '';
    }
  };

  const getTrackIcon = (condition: TrackCondition) => {
    switch (condition) {
      case 'Dry': return '🏜️';
      case 'Good': return '🌱';
      case 'Wet': return '💧';
      case 'Muddy': return '🟫';
      default: return '';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 shadow-2xl border border-gray-700">
      <h2 className="text-lg font-bold mb-3 text-center text-gray-300 border-b border-gray-600 pb-2">
        Race Conditions
      </h2>
      <div className="flex justify-around text-center">
        <div>
          <p className="text-gray-400 text-sm">Weather</p>
          <p className="text-2xl" title={weather}>{getWeatherIcon(weather)}</p>
          <p className="text-md font-semibold text-cyan-400">{weather}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Track</p>
           <p className="text-2xl" title={trackCondition}>{getTrackIcon(trackCondition)}</p>
          <p className="text-md font-semibold text-cyan-400">{trackCondition}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;