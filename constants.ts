import type { Weather, TrackCondition, HorseForm, Pacing } from './types';

export const TRACK_LENGTH = 1000; // a virtual length for the track
export const TICK_RATE = 100; // ms per tick, so 10 ticks per second
// NOTE: Set to 1 minute for easier testing. Revert to 5 * 60 * 1000 for production.
export const RACE_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds
export const HORSES_IN_STABLE = 16;
export const HORSES_IN_RACE = 8;
export const MAX_RACES_BEFORE_RETIREMENT = 25;
export const MIN_RACES_BEFORE_RETIREMENT = 15;

export const WEATHER_CONDITIONS: Weather[] = ['Sunny', 'Overcast', 'Rainy', 'Windy'];
export const TRACK_CONDITIONS: TrackCondition[] = ['Dry', 'Good', 'Wet', 'Muddy'];

export const PACING_STYLES: Pacing[] = ['Front Runner', 'Mid-pack', 'Closer'];

// Re-balanced multipliers to make form more impactful
export const HORSE_FORMS: { name: HorseForm; multiplier: number; weight: number; icon: string }[] = [
  { name: 'Excellent', multiplier: 1.05, weight: 1, icon: '🌟' }, // Was 1.025
  { name: 'Good', multiplier: 1.02, weight: 3, icon: '😊' },      // Was 1.01
  { name: 'Average', multiplier: 1.0, weight: 5, icon: '😐' },
  { name: 'Poor', multiplier: 0.97, weight: 2, icon: '😟' },       // Was 0.985
];

// Horse Name Generation
export const ADJECTIVES = ['Swift', 'Thunder', 'Lightning', 'Gallant', 'Starlight', 'Midnight', 'Shadow', 'Crimson', 'Golden', 'Iron', 'Wild', 'Silent', 'Majestic', 'Regal'];
export const NOUNS = ['Fury', 'Dancer', 'Comet', 'Stallion', 'Mare', 'Dream', 'Spectre', 'Glory', 'King', 'Queen', 'Prince', 'Duke', 'Baron', 'Legend'];