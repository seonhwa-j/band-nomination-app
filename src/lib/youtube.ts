export type PlaylistInsertPayload = {
  songId: string;
  youtubeLink: string;
  title: string;
  artist: string;
};

export const queuePlaylistInsert = async (payload: PlaylistInsertPayload) => {
  console.info("Playlist insert queued for future Supabase Edge Function", payload);
};
