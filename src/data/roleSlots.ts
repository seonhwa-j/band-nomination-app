import type { RoleVoteKey } from "../types/vote";

export const roleVoteMeta: Array<{
  key: RoleVoteKey;
  memberId: string;
  memberName: string;
  roleName: string;
  compact: string;
}> = [
  { key: "vocal", memberId: "vocal", memberName: "보컬", roleName: "보컬", compact: "Vocal" },
  { key: "drum", memberId: "drum", memberName: "드럼", roleName: "드럼", compact: "Drum" },
  { key: "bass", memberId: "bass", memberName: "베이스", roleName: "베이스", compact: "Bass" },
  { key: "devilGuitar1", memberId: "devil", memberName: "앙마", roleName: "기타1", compact: "앙 G1" },
  { key: "devilGuitar2", memberId: "devil", memberName: "앙마", roleName: "기타2", compact: "앙 G2" },
  { key: "sunnyGuitar1", memberId: "sunny", memberName: "싸니", roleName: "기타1", compact: "싸 G1" },
  { key: "sunnyGuitar2", memberId: "sunny", memberName: "싸니", roleName: "기타2", compact: "싸 G2" },
  { key: "seulKeyboard1", memberId: "seul", memberName: "슬이", roleName: "키보드1", compact: "Key1" },
  { key: "lilacKeyboard2", memberId: "lilac", memberName: "라일락", roleName: "키보드2", compact: "Key2" },
  { key: "lilacChorus", memberId: "lilac", memberName: "라일락", roleName: "코러스", compact: "Cho" },
];
