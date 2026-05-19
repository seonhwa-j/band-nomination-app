import { positiveVotes } from "../data/voteOptions";
import { unvotedFilters } from "./unvotedFilters";
import type { RoleVoteKey, RoleVotes, VoteType } from "../types/vote";

const isPositive = (vote: VoteType) => positiveVotes.includes(vote);

export type ActiveCheck = {
  active: boolean;
  completed: number;
  required: number;
  missing: string[];
};

const groupReady = (votes: RoleVotes, keys: RoleVoteKey[]) => keys.some((key) => isPositive(votes[key]));

export const evaluateActiveStatus = (votes: RoleVotes): ActiveCheck => {
  const requiredGroups = unvotedFilters.filter((filter) => filter.key !== "ALL");
  const missing = requiredGroups.filter((filter) => !groupReady(votes, filter.keys)).map((filter) => filter.label);

  return {
    active: missing.length === 0,
    completed: requiredGroups.length - missing.length,
    required: requiredGroups.length,
    missing,
  };
};
