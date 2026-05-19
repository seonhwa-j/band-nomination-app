import type { VoteLabel, VoteType } from "../types/vote";

export const voteOptions: Array<{
  type: VoteType;
  label: VoteLabel;
  shortLabel: string;
  emoji: string;
  tone: string;
}> = [
  { type: "LIKES", label: "좋아요", shortLabel: "Like", emoji: "👍", tone: "agree" },
  { type: "AGREE", label: "해봐요", shortLabel: "Try", emoji: "👌", tone: "agree" },
  { type: "MEH", label: "애매해", shortLabel: "Meh", emoji: "😐", tone: "cautious" },
  { type: "THINK", label: "시간줘", shortLabel: "Think", emoji: "🤔", tone: "cautious" },
  { type: "CANNOT", label: "못해요", shortLabel: "No", emoji: "❌", tone: "neutral" },
  { type: "NONE", label: "없음", shortLabel: "None", emoji: "🤷", tone: "neutral" },
];

export const voteLabelToType = (label: VoteLabel | null | undefined): VoteType => {
  const found = voteOptions.find((option) => option.label === label);
  return found?.type ?? "NONE";
};

export const voteTypeToOption = (type: VoteType) => voteOptions.find((option) => option.type === type) ?? voteOptions[5];

export const positiveVotes: VoteType[] = ["LIKES", "AGREE"];
