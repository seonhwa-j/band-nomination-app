<script setup lang="ts">
import { roleVoteMeta } from "../../data/roleSlots";
import { voteOptions, voteTypeToOption } from "../../data/voteOptions";
import type { RoleVotes, RoleVoteKey, VoteType } from "../../types/vote";
import VoteOption from "./VoteOption.vue";

defineProps<{
  songId: string;
  votes: RoleVotes;
}>();

defineEmits<{
  change: [songId: string, key: RoleVoteKey, vote: VoteType];
}>();
</script>

<template>
  <section class="vote-grid" aria-label="파트별 투표">
    <article v-for="meta in roleVoteMeta" :key="meta.key" class="role-vote">
      <div>
        <strong>{{ meta.compact }}</strong>
        <span>{{ meta.memberName }} · {{ meta.roleName }}</span>
      </div>
      <button class="role-vote__current" type="button">
        <VoteOption :vote="votes[meta.key]" active />
      </button>
      <div class="role-vote__menu" role="group" :aria-label="`${meta.memberName} ${meta.roleName}`">
        <button
          v-for="option in voteOptions"
          :key="option.type"
          type="button"
          :class="{ 'is-selected': votes[meta.key] === option.type }"
          :title="option.label"
          @click="$emit('change', songId, meta.key, option.type)"
        >
          <span aria-hidden="true">{{ voteTypeToOption(option.type).emoji }}</span>
        </button>
      </div>
    </article>
  </section>
</template>
