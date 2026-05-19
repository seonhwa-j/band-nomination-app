<script setup lang="ts">
import { computed } from "vue";
import { voteOptions } from "../../data/voteOptions";
import type { RoleVotes } from "../../types/vote";

const props = defineProps<{
  votes: RoleVotes;
}>();

const summary = computed(() =>
  voteOptions
    .map((option) => ({
      ...option,
      count: Object.values(props.votes).filter((vote) => vote === option.type).length,
    }))
    .filter((item) => item.count > 0),
);
</script>

<template>
  <div class="vote-summary" aria-label="투표 요약">
    <span v-for="item in summary" :key="item.type">
      <b aria-hidden="true">{{ item.emoji }}</b>
      {{ item.count }}
    </span>
  </div>
</template>
