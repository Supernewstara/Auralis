import ncm from "NeteaseCloudMusicApi";

export async function fetchAllLikedSongs(uid: number | string, cookie: string) {
  console.log(`[Taste Brain - Ingestion] Fetching like list for UID: ${uid}`);
  const likeRes = await ncm.likelist({ uid, cookie });
  const ids = (likeRes.body?.ids as number[]) || [];
  
  if (ids.length === 0) {
    throw new Error("No liked songs found");
  }

  console.log(`[Taste Brain - Ingestion] Total liked songs: ${ids.length}`);
  let allSongs: any[] = [];
  
  // We should definitely chunk them to avoid timeouts, 200 per batch
  const BATCH_SIZE = 200;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batchIds = ids.slice(i, i + BATCH_SIZE);
    try {
      const detailsRes = await ncm.song_detail({ ids: batchIds.join(','), cookie });
      const songs = (detailsRes.body?.songs as any[]) || [];
      allSongs = allSongs.concat(songs);
      console.log(`[Taste Brain - Ingestion] Fetched ${allSongs.length} / ${ids.length} songs`);
      
      // small delay to prevent rate limit
      await new Promise(res => setTimeout(res, 300));
    } catch (err: any) {
      console.warn(`[Taste Brain - Ingestion] Failed to fetch batch ${i}-${i + BATCH_SIZE}:`, err.message);
    }
  }

  return allSongs;
}
