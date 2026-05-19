import type { Song } from "../types/song";
import type { BandPart } from "../types/member";
import type { RoleVoteKey, RoleVotes } from "../types/vote";

export type UnvotedFilterKey = "ALL" | BandPart;

type FilterMode = "anyNone" | "allNone";

export type UnvotedFilter = {
  key: UnvotedFilterKey;
  label: string;
  icon: string;
  keys: RoleVoteKey[];
  mode: FilterMode;
};

export const unvotedFilters: UnvotedFilter[] = [
  { key: "ALL", label: "전체", icon: "ALL", keys: [], mode: "anyNone" },
  { key: "vocal", label: "묘묘", icon: "VO", keys: ["vocal"], mode: "anyNone" },
  { key: "drum", label: "제제", icon: "DR", keys: ["drum"], mode: "anyNone" },
  { key: "bass", label: "삼베", icon: "BA", keys: ["bass"], mode: "anyNone" },
  { key: "devil", label: "앙마", icon: "AG", keys: ["devilGuitar1", "devilGuitar2"], mode: "allNone" },
  { key: "sunny", label: "사니", icon: "SN", keys: ["sunnyGuitar1", "sunnyGuitar2"], mode: "allNone" },
  { key: "keyboard", label: "슬이", icon: "KY", keys: ["seulKeyboard1", "lilacKeyboard2"], mode: "anyNone" },
  { key: "chorus", label: "라일락", icon: "CH", keys: ["lilacChorus"], mode: "anyNone" },
];

const isNone = (votes: RoleVotes, key: RoleVoteKey) => !votes[key] || votes[key] === "NONE";

export const isSongUnvotedForFilter = (song: Song, filterKey: UnvotedFilterKey) => {
  if (filterKey === "ALL") return true;

  const filter = unvotedFilters.find((item) => item.key === filterKey);
  if (!filter) return true;

  return filter.mode === "allNone" ? filter.keys.every((key) => isNone(song.votes, key)) : filter.keys.some((key) => isNone(song.votes, key));
};

export const getUnvotedFilterCounts = (songs: Song[]) =>
  Object.fromEntries(unvotedFilters.map((filter) => [filter.key, filter.key === "ALL" ? songs.length : songs.filter((song) => isSongUnvotedForFilter(song, filter.key)).length])) as Record<UnvotedFilterKey, number>;

export const getUnvotedNames = (song: Song) => unvotedFilters.filter((filter) => filter.key !== "ALL" && isSongUnvotedForFilter(song, filter.key)).map((filter) => filter.label);

export const formatUnvotedSummary = (song: Song) => {
  const names = getUnvotedNames(song);
  if (!names.length) return "";
  if (names.length >= 3) return `대기 중: ${names[0]} 외 ${names.length - 1}명`;
  return `미투표: ${names.join(", ")}`;
};
