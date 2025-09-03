import React from 'react';
import type { RaceHorse } from '../types';
import { TRACK_LENGTH } from '../constants';

interface RaceTrackProps {
  horses: RaceHorse[];
  isRunning: boolean;
}

const FinishLine: React.FC = () => (
  <div
    className="absolute h-full w-2 right-0 top-0 bg-repeat-y"
    style={{
      backgroundImage: 'linear-gradient(white 25%, black 25%, black 50%, white 50%, white 75%, black 75%, black 100%)',
      backgroundSize: '100% 40px',
    }}
  ></div>
);

const HorseIcon: React.FC<{ horse: RaceHorse; isRunning: boolean }> = React.memo(({ horse, isRunning }) => {
  const progressPercentage = (horse.position / TRACK_LENGTH) * 100;

  return (
    <div
      className="absolute h-10 flex items-center"
      style={{
        left: `calc(${progressPercentage}% - 20px)`,
        transition: isRunning ? `left ${'0.1s'} linear` : 'none',
        willChange: 'left',
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2"
        style={{ backgroundColor: horse.color, borderColor: 'rgba(255,255,255,0.7)' }}
      >
        {horse.id}
      </div>
    </div>
  );
});

const RaceTrack: React.FC<RaceTrackProps> = ({ horses, isRunning }) => {
  return (
    <div className="flex-grow w-full flex flex-col justify-center gap-1 bg-green-900/40 p-4 rounded-b-lg relative overflow-hidden">
      {horses.length > 0 && <FinishLine />}
      {horses.map((horse, index) => (
        <div
          key={horse.id}
          className="relative h-12 bg-lime-800/50 rounded"
          style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}
        >
          <HorseIcon horse={horse} isRunning={isRunning} />
        </div>
      ))}
      {horses.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-lg">Race track is being prepared...</p>
         </div>
      )}
    </div>
  );
};

export default RaceTrack;
