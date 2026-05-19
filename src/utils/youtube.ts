export const getYouTubeEmbedUrl = (url: string) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : "";
};

export const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? "";
};

export const isYouTubeUrl = (url: string) => Boolean(getYouTubeId(url));
