import importedSongs from "./importedSongs.json";
import { voteLabelToType } from "./voteOptions";
import type { Song } from "../types/song";
import type { RoleVoteKey, VoteLabel } from "../types/vote";

const voteKeys: RoleVoteKey[] = [
  "vocal",
  "drum",
  "bass",
  "devilGuitar1",
  "devilGuitar2",
  "sunnyGuitar1",
  "sunnyGuitar2",
  "seulKeyboard1",
  "lilacKeyboard2",
  "lilacChorus",
];

export const mockSongs: Song[] = importedSongs.map((song) => {
  const votes = Object.fromEntries(voteKeys.map((key) => [key, voteLabelToType(song.votes[key] as VoteLabel)])) as Song["votes"];

  return {
    id: song.id,
    artist: song.artist,
    title: song.title,
    youtubeLink: song.youtubeLink,
    status: song.status as Song["status"],
    note: song.note,
    extraNote: song.extraNote,
    votes,
  };
});
