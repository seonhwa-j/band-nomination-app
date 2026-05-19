import { positiveVotes } from "../data/voteOptions";
import type { RoleVotes, VoteType } from "../types/vote";

const isPositive = (vote: VoteType) => positiveVotes.includes(vote);
const isUnused = (vote: VoteType) => vote === "NONE";

export type ActiveCheck = {
  active: boolean;
  completed: number;
  required: number;
  missing: string[];
};

export const evaluateActiveStatus = (votes: RoleVotes): ActiveCheck => {
  const missing: string[] = [];
  let completed = 0;
  let required = 0;

  const requirePositive = (label: string, vote: VoteType, optional = false) => {
    if (optional && isUnused(vote)) return;
    required += 1;
    if (isPositive(vote)) {
      completed += 1;
    } else {
      missing.push(label);
    }
  };

  requirePositive("보컬", votes.vocal);
  requirePositive("드럼", votes.drum);
  requirePositive("베이스", votes.bass);
  requirePositive("키보드1", votes.seulKeyboard1, true);
  requirePositive("키보드2", votes.lilacKeyboard2, true);
  requirePositive("코러스", votes.lilacChorus, true);

  const guitar1Ready = isPositive(votes.devilGuitar1) || isPositive(votes.sunnyGuitar1);
  const guitar2Ready = isPositive(votes.devilGuitar2) || isPositive(votes.sunnyGuitar2);
  const sameMemberOnly =
    (isPositive(votes.devilGuitar1) && isPositive(votes.devilGuitar2) && !isPositive(votes.sunnyGuitar1) && !isPositive(votes.sunnyGuitar2)) ||
    (isPositive(votes.sunnyGuitar1) && isPositive(votes.sunnyGuitar2) && !isPositive(votes.devilGuitar1) && !isPositive(votes.devilGuitar2));

  required += 2;
  if (guitar1Ready && guitar2Ready && !sameMemberOnly) {
    completed += 2;
  } else {
    if (!guitar1Ready) missing.push("기타1");
    if (!guitar2Ready) missing.push("기타2");
    if (sameMemberOnly) missing.push("기타 멤버 2명 배정");
  }

  return {
    active: missing.length === 0,
    completed,
    required,
    missing,
  };
};
