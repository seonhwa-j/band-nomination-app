import type { RoleVotes } from "./vote";

export type SongStatus = "ACTIVE" | "PENDING";

export type Song = {
  id: string;
  title: string;
  artist: string;
  youtubeLink: string;
  status: SongStatus;
  createdBy?: string | null;
  note?: string | null;
  extraNote?: string | null;
  votes: RoleVotes;
  agreeScore?: number;
};
