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
  // Race-specific state
  racesRun: number;
}

export interface RaceHorse extends Horse {
  position: number; // 0-100
  currentSpeed: number;
  currentStamina: number;
  currentSprintCharge: number;
  status: 'running' | 'sprinting' | 'stumbled' | 'finished' | 'fallen';
  finishTime: number | null;
  rank: number;
}

export interface RaceState {
  horses: RaceHorse[];
  time: number;
  isFinished: boolean;
}

export interface RaceResult {
  id: string;
  horses: {
    horseId: number;
    name: string;
    finishTime: number;
    finalPosition: number;
  }[];
}

export enum GameState {
  Waiting = 'WAITING',
  Racing = 'RACING',
  Finished = 'FINISHED',
}
