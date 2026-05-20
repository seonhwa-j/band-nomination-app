import type { RoleVotes } from "./vote";

export type SongStatus = "ACTIVE" | "PENDING";

export type Song = {
  id: string;
  title: string;
  artist: string;
  youtubeLink: string;
  status: SongStatus;
  createdAt?: string | null;
  createdBy?: string | null;
  createdByAliases?: string[];
  note?: string | null;
  extraNote?: string | null;
  votes: RoleVotes;
  agreeScore?: number;
};
