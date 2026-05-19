export type VoteType = "LIKES" | "AGREE" | "MEH" | "THINK" | "CANNOT" | "NONE";

export type VoteLabel = "좋아요" | "해봐요" | "애매해" | "시간줘" | "못해요" | "없음" | "";

export type RoleVoteKey =
  | "vocal"
  | "drum"
  | "bass"
  | "devilGuitar1"
  | "devilGuitar2"
  | "sunnyGuitar1"
  | "sunnyGuitar2"
  | "seulKeyboard1"
  | "lilacKeyboard2"
  | "lilacChorus";

export type RoleVotes = Record<RoleVoteKey, VoteType>;

export type RoleSlot =
  | "vocal"
  | "drum"
  | "bass"
  | "guitar1"
  | "guitar2"
  | "keyboard1"
  | "keyboard2"
  | "chorus";
