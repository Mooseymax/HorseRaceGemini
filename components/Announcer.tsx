import React from 'react';

interface AnnouncerProps {
  message: string;
}

const Announcer: React.FC<AnnouncerProps> = ({ message }) => {
  return (
    <div className="w-full h-12 flex items-center justify-center bg-gray-900/60 rounded-md mb-4 border border-gray-700 shadow-lg overflow-hidden">
      <div
        key={message} // Re-trigger animation on message change
        className={`text-lg font-semibold transition-opacity duration-300 ${message ? 'opacity-100 animate-fade-in' : 'opacity-0'}`}
        style={{ animation: message ? 'fadeIn 0.5s ease-out' : 'none' }}
      >
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
        <span className="text-cyan-300 tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default Announcer;
