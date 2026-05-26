import type { BandPart } from "../types/member";
import type { RoleVoteKey } from "../types/vote";

export const roleVoteMeta: Array<{
  key: RoleVoteKey;
  memberId: BandPart;
  memberName: string;
  roleName: string;
  compact: string;
}> = [
  { key: "vocal", memberId: "vocal", memberName: "묘묘", roleName: "보컬", compact: "VO" },
  { key: "drum", memberId: "drum", memberName: "제제", roleName: "드럼", compact: "DR" },
  { key: "bass", memberId: "bass", memberName: "삼베", roleName: "베이스", compact: "BA" },
  { key: "devilGuitar1", memberId: "devil", memberName: "앙마", roleName: "기타 1", compact: "AG1" },
  { key: "devilGuitar2", memberId: "devil", memberName: "앙마", roleName: "기타 2", compact: "AG2" },
  { key: "sunnyGuitar1", memberId: "sunny", memberName: "사니", roleName: "기타 1", compact: "SN1" },
  { key: "sunnyGuitar2", memberId: "sunny", memberName: "사니", roleName: "기타 2", compact: "SN2" },
  { key: "seulKeyboard1", memberId: "keyboard", memberName: "슬이", roleName: "건반 1", compact: "K1" },
  { key: "lilacKeyboard2", memberId: "chorus", memberName: "라일락", roleName: "건반 2", compact: "K2" },
  { key: "lilacChorus", memberId: "chorus", memberName: "라일락", roleName: "코러스", compact: "CH" },
];
