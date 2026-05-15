export interface LyricLine {
  time: number;
  text: string;
}

export interface UserProfile {
  userId: string;
  nickname: string;
  avatarUrl: string;
}

export interface TrackData {
  trackName?: string;
  artist?: string;
  audioUrl?: string;
  lyrics?: string;
  matchedSongDetail?: {
    name: string;
    ar?: { name: string }[];
    al?: { picUrl: string };
  };
}

export interface RecommendationData {
  reasoning?: string;
  reasoningSteps?: { step: string; detail: string }[];
  tracks: TrackData[];
}
