// Supabase Edge Function placeholder.
// Later: validate ACTIVE transition, extract YouTube video id, call YouTube Data API playlistItems.insert.

export const handler = async (request: Request) => {
  const payload = await request.json();

  return new Response(JSON.stringify({ ok: true, received: payload }), {
    headers: { "content-type": "application/json" },
  });
};
