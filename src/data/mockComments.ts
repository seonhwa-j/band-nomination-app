import type { SongComment } from "../types/comment";

export const mockComments: SongComment[] = [
  {
    id: "comment-1",
    songId: "song-001",
    userId: "bass",
    text: "이번엔 진짜 합주까지 가보자. 베이스 라인도 좋음.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "comment-2",
    songId: "song-001",
    userId: "drum",
    text: "그루브 괜찮고 공연 오프닝으로도 좋아 보여요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
  },
  {
    id: "comment-3",
    songId: "song-015",
    userId: "vocal",
    text: "이 곡은 분위기 전환용으로 꼭 넣고 싶어요.",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];
