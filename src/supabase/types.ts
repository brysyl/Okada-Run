export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  coins: number;
  distance: number;
  created_at: string;
}

export type NewScore = Omit<LeaderboardEntry, 'id' | 'created_at'>;
