type ActiveSongPayload = {
  song_id: string;
  title: string;
  artist: string;
  youtube_link: string;
  status: "ACTIVE" | "PENDING";
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

const getYouTubeId = (url: string) => url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? "";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = (await request.json()) as ActiveSongPayload;
  const playlistId = Deno.env.get("YOUTUBE_PLAYLIST_ID");
  const accessToken = Deno.env.get("YOUTUBE_ACCESS_TOKEN");
  const videoId = getYouTubeId(payload.youtube_link);

  if (payload.status !== "ACTIVE" || !videoId) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "not_active_or_missing_video" }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  if (!playlistId || !accessToken) {
    return new Response(JSON.stringify({ ok: true, dryRun: true, videoId }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const youtubeResponse = await fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    }),
  });

  const result = await youtubeResponse.json();

  return new Response(JSON.stringify({ ok: youtubeResponse.ok, videoId, result }), {
    status: youtubeResponse.ok ? 200 : youtubeResponse.status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
