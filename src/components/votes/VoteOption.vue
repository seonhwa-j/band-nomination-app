<script setup lang="ts">
import { voteTypeToOption } from "../../data/voteOptions";
import type { VoteType } from "../../types/vote";

const props = defineProps<{
  vote: VoteType;
  active?: boolean;
  label?: string;
}>();
</script>

<template>
  <span class="vote-dot" :class="[`vote-dot--${voteTypeToOption(vote).tone}`, { 'is-active': active }]">
    <span aria-hidden="true">{{ voteTypeToOption(vote).emoji }}</span>
    <small v-if="label">{{ label }}</small>
  </span>
</template>
