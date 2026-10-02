import type { Adhkar, Mission, Quote } from './types';
import adhkarJson from './adhkar.generated.json';
import quotesJson from './quotes.generated.json';
import missionsJson from './missions.generated.json';

export const QUOTES = quotesJson as Quote[];
export const MISSIONS = missionsJson as Mission[];

export const ADHKAR = adhkarJson as Adhkar[];
export const quoteById = (id: string): Quote | undefined => QUOTES.find((q) => q.id === id);
export const missionById = (id: string): Mission | undefined => MISSIONS.find((m) => m.id === id);

export * from './types';
