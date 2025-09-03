export type Weather = 'Sunny' | 'Overcast' | 'Rainy' | 'Windy';
export type TrackCondition = 'Dry' | 'Good' | 'Wet' | 'Muddy';
export type HorseForm = 'Excellent' | 'Good' | 'Average' | 'Poor';
export type Pacing = 'Front Runner' | 'Mid-pack' | 'Closer';
export type HorseArchetype = 'Sprinter' | 'Stayer' | 'Balanced' | 'All-Rounder';

export interface Horse {
  id: number;
  name: string;
  color: string;
  // Stats
  maxSpeed: number; // base speed
  stamina: number; // determines how long max speed can be maintained
  sprintSpeed: number; // speed during a sprint
  sprintDuration: number; // how long a sprint lasts in ticks
  sprintCharge: number; // builds up to 100 for a sprint
  acceleration: number; // how quickly it reaches max speed
  agility: number; // affects chances of stumbling
  grit: number; // hidden stat for will to win
  // Preferences
  favorableWeather: Weather;
  unfavorableWeather: Weather;
  favorableTrack: TrackCondition;
  unfavorableTrack: TrackCondition;
  // Strategy
  pacing: Pacing;
  // Race-specific state
  racesRun: number;
}

// A horse that has been selected for the next race and assigned a daily form
export interface UpcomingHorse extends Horse {
  form: HorseForm;
}

export interface RaceHorse extends Horse {
  position: number; // 0-100
  currentSpeed: number;
  currentStamina: number;
  currentSprintCharge: number;
  // Added 'spooked' and 'dnf' for random events and not finishing.
  status: 'running' | 'sprinting' | 'stumbled' | 'finished' | 'fallen' | 'exhausted' | 'boxedin' | 'perfectstride' | 'spooked' | 'dnf';
  statusStartTime: number;
  finishTime: number | null;
  rank: number;
  form: HorseForm;
}

export interface RaceState {
  horses: RaceHorse[];
  time: number;
  isFinished: boolean;
}

export interface RaceResultHorse {
    horseId: number;
    name: string;
    finishTime: number | null; // Can be null for DNF
    maxSpeed: number;
    stamina: number;
    agility: number;
    grit: number;
    pacing: Pacing;
    form: HorseForm;
}

export interface RaceResult {
  id: string;
  weather: Weather;
  trackCondition: TrackCondition;
  horses: RaceResultHorse[];
}

export enum GameState {
  Waiting = 'WAITING',
  Racing = 'RACING',
  Finished = 'FINISHED',
}