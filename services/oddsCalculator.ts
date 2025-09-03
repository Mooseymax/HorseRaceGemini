import type { UpcomingHorse, Weather, TrackCondition } from '../types';
import { HORSE_FORMS } from '../constants';

// Weights for different stats. Tuned to give stats significant impact.
const WEIGHTS = {
  SPEED: 1.5,
  STAMINA: 1.0,
  AGILITY: 0.8,
  GRIT: 1.2,
  // Multipliers for conditions. Switched from flat bonuses for more impact.
  FAVORABLE_MULTIPLIER: 1.1, // 10% boost
  UNFAVORABLE_MULTIPLIER: 0.9, // 10% penalty
};

// Bookmaker's margin (e.g., 1.40 = 140% overround, a 40% margin)
// Increased significantly to shorten all odds and create realistic favorite odds (e.g., 2/1).
const BOOKMAKER_MARGIN = 1.40;
// Increased max odds for more realistic long shots
const MAX_ODDS = 50; 

interface HorseWithScore extends UpcomingHorse {
  powerScore: number;
}

// Expanded list of common fractional odds for more granularity, especially for long shots.
const COMMON_ODDS = [
  { str: '1/4', val: 0.25 }, { str: '1/3', val: 0.33 }, { str: '2/5', val: 0.4 },
  { str: '1/2', val: 0.5 }, { str: '4/7', val: 0.57 }, { str: '8/13', val: 0.62 },
  { str: '4/6', val: 0.67 }, { str: '4/5', val: 0.8 }, { str: '10/11', val: 0.91 },
  { str: '1/1', val: 1.0 }, { str: '11/10', val: 1.1 }, { str: '6/5', val: 1.2 },
  { str: '5/4', val: 1.25 }, { str: '11/8', val: 1.375 }, { str: '6/4', val: 1.5 },
  { str: '7/4', val: 1.75 }, { str: '2/1', val: 2.0 }, { str: '9/4', val: 2.25 },
  { str: '5/2', val: 2.5 }, { str: '11/4', val: 2.75 }, { str: '3/1', val: 3.0 },
  { str: '10/3', val: 3.33 }, { str: '7/2', val: 3.5 }, { str: '4/1', val: 4.0 },
  { str: '9/2', val: 4.5 }, { str: '5/1', val: 5.0 }, { str: '11/2', val: 5.5 },
  { str: '6/1', val: 6.0 }, { str: '7/1', val: 7.0 }, { str: '8/1', val: 8.0 },
  { str: '9/1', val: 9.0 }, { str: '10/1', val: 10.0 }, { str: '12/1', val: 12.0 },
  { str: '14/1', val: 14.0 }, { str: '16/1', val: 16.0 }, { str: '20/1', val: 20.0 },
  { str: '25/1', val: 25.0 }, { str: '33/1', val: 33.0 }, { str: '40/1', val: 40.0 },
  { str: '50/1', val: 50.0 },
];

// Converts decimal odds to a simplified, realistic fractional string by finding the closest common odds.
const toFraction = (decimal: number): string => {
    if (decimal >= MAX_ODDS) return `${MAX_ODDS}/1`;
    if (decimal < 0.25) return '1/4';

    // Find the closest odds from the predefined list
    const closest = COMMON_ODDS.reduce((prev, curr) => 
        Math.abs(curr.val - decimal) < Math.abs(prev.val - decimal) ? curr : prev
    );

    return closest.str;
};


export const calculateOdds = (
  horses: UpcomingHorse[],
  weather: Weather,
  trackCondition: TrackCondition
): { [horseId: number]: string } => {
  if (!horses.length) return {};

  // 1. Calculate a "power score" for each horse
  const horsesWithScores: HorseWithScore[] = horses.map(horse => {
    let score =
      horse.maxSpeed * WEIGHTS.SPEED +
      horse.stamina * WEIGHTS.STAMINA +
      horse.agility * WEIGHTS.AGILITY +
      horse.grit * WEIGHTS.GRIT;

    // Apply form multiplier
    const form = HORSE_FORMS.find(f => f.name === horse.form);
    if (form) {
      score *= form.multiplier;
    }

    // Apply preference multipliers for more impact
    if (horse.favorableWeather === weather) score *= WEIGHTS.FAVORABLE_MULTIPLIER;
    if (horse.unfavorableWeather === weather) score *= WEIGHTS.UNFAVORABLE_MULTIPLIER;
    if (horse.favorableTrack === trackCondition) score *= WEIGHTS.FAVORABLE_MULTIPLIER;
    if (horse.unfavorableTrack === trackCondition) score *= WEIGHTS.UNFAVORABLE_MULTIPLIER;
    
    // **KEY CHANGE**: Amplify score differences. This exponent is less aggressive
    // to prevent extremely long odds, while the bookmaker's margin handles shortening.
    const amplifiedScore = Math.pow(score, 4);

    return { ...horse, powerScore: Math.max(1, amplifiedScore) };
  });

  // 2. Calculate the total power score of the field
  const totalPowerScore = horsesWithScores.reduce((sum, h) => sum + h.powerScore, 0);

  // 3. Determine each horse's implied probability of winning
  const horsesWithProbs = horsesWithScores.map(horse => ({
      id: horse.id,
      // Raw probability based on the share of the total power score
      prob: horse.powerScore / totalPowerScore,
  }));
  
  // 4. Adjust probabilities to include the bookmaker's margin
  // We find a normalization factor 'k' such that the sum of new probabilities equals the margin
  const sumOfProbs = horsesWithProbs.reduce((sum, h) => sum + h.prob, 0); // This will be ~1.0
  const normalizationFactor = sumOfProbs > 0 ? BOOKMAKER_MARGIN / sumOfProbs : 0;

  // FIX: Incorrect object initialization syntax. Changed `=> {}` to `= {}`.
  const oddsMap: { [horseId: number]: string } = {};
  horsesWithProbs.forEach(horse => {
      // The bookmaker's probability for this horse
      const bookieProb = horse.prob * normalizationFactor;

      // Convert the final probability to decimal odds (e.g., 0.25 -> 3/1 which is a value of 3.0)
      if (bookieProb > 0) {
        const decimalOddsValue = (1 / bookieProb) - 1;
        oddsMap[horse.id] = toFraction(Math.max(0.25, decimalOddsValue));
      } else {
        // Fallback for an impossible horse
        oddsMap[horse.id] = `${MAX_ODDS}/1`;
      }
  });

  return oddsMap;
};