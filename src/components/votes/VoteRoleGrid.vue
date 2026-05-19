<script setup lang="ts">
import { roleVoteMeta } from "../../data/roleSlots";
import { voteOptions, voteTypeToOption } from "../../data/voteOptions";
import type { BandPart } from "../../types/member";
import type { RoleVotes, RoleVoteKey, VoteType } from "../../types/vote";
import VoteOption from "./VoteOption.vue";

defineProps<{
  songId: string;
  votes: RoleVotes;
  currentPart: BandPart;
}>();

defineEmits<{
  change: [songId: string, key: RoleVoteKey, vote: VoteType];
}>();
</script>

<template>
  <section class="vote-grid" aria-label="멤버별 투표 현황">
    <article v-for="meta in roleVoteMeta" :key="meta.key" class="role-vote" :class="{ 'role-vote--editable': meta.memberId === currentPart }">
      <div>
        <strong>{{ meta.compact }}</strong>
        <span>{{ meta.memberName }} · {{ meta.roleName }}</span>
      </div>
      <button class="role-vote__current" type="button" :disabled="meta.memberId !== currentPart" :aria-label="`${meta.memberName} ${meta.roleName} 투표`">
        <VoteOption :vote="votes[meta.key]" active />
      </button>
      <div v-if="meta.memberId === currentPart" class="role-vote__menu" role="group" :aria-label="`${meta.memberName} ${meta.roleName}`">
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
