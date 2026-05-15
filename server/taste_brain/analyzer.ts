export interface SongFeatures {
  id: number;
  name: string;
  artists: string[];
  album: string;
  publishYear: number | null;
  // TODO: We could add more features later (genre/tags) if we call NCM's song tags API
}

export interface TasteStats {
  totalSongs: number;
  topArtists: { name: string; count: number }[];
  publishYearDistribution: Record<string, number>;
}

export function extractFeatures(songs: any[]): SongFeatures[] {
  return songs.map(s => {
    let publishYear = null;
    if (s.publishTime || s.al?.pic_str) {
      // publishTime isn't always perfectly accurate, but it's okay for estimation
      const date = new Date(s.publishTime || (s.al && s.al.publishTime));
      if (!isNaN(date.getFullYear()) && date.getFullYear() > 1900) {
        publishYear = date.getFullYear();
      }
    }
    
    return {
      id: s.id,
      name: s.name,
      artists: s.ar?.map((a: any) => a.name).filter(Boolean) || [],
      album: s.al?.name || "",
      publishYear: publishYear
    };
  });
}

export function calculateStats(features: SongFeatures[]): TasteStats {
  const artistCounts: Record<string, number> = {};
  const yearDist: Record<string, number> = {};

  features.forEach(f => {
    f.artists.forEach(a => {
      artistCounts[a] = (artistCounts[a] || 0) + 1;
    });
    
    if (f.publishYear) {
      const era = `${Math.floor(f.publishYear / 10) * 10}s`;
      yearDist[era] = (yearDist[era] || 0) + 1;
    }
  });

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([name, count]) => ({ name, count }));

  return {
    totalSongs: features.length,
    topArtists,
    publishYearDistribution: yearDist
  };
}
