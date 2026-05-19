<script setup lang="ts">
import { computed } from "vue";
import CommentComposer from "../comments/CommentComposer.vue";
import CommentTimeline from "../comments/CommentTimeline.vue";
import VoteRoleGrid from "../votes/VoteRoleGrid.vue";
import SongStatusBadge from "./SongStatusBadge.vue";
import SongVoteSummary from "./SongVoteSummary.vue";
import YouTubePreview from "./YouTubePreview.vue";
import { evaluateActiveStatus } from "../../utils/activeRules";
import { isYouTubeUrl } from "../../utils/youtube";
import type { SongComment } from "../../types/comment";
import type { Song } from "../../types/song";
import type { RoleVoteKey, VoteType } from "../../types/vote";

const props = defineProps<{
  song: Song;
  expanded: boolean;
  comments: SongComment[];
  currentUserId: string;
}>();

defineEmits<{
  toggle: [songId: string];
  vote: [songId: string, key: RoleVoteKey, vote: VoteType];
  addComment: [songId: string, text: string];
  updateComment: [commentId: string, text: string];
  deleteComment: [commentId: string];
}>();

const activeCheck = computed(() => evaluateActiveStatus(props.song.votes));
const status = computed(() => (activeCheck.value.active ? "ACTIVE" : props.song.status));
</script>

<template>
  <article class="song-card" :class="{ 'song-card--active': status === 'ACTIVE', 'is-expanded': expanded }">
    <button class="song-card__summary" type="button" @click="$emit('toggle', song.id)">
      <span class="song-thumb" :class="{ 'has-link': isYouTubeUrl(song.youtubeLink) }">
        <span aria-hidden="true">▶</span>
      </span>
      <span class="song-card__main">
        <strong>{{ song.title }}</strong>
        <small>{{ song.artist }}</small>
      </span>
      <span class="song-card__side">
        <SongStatusBadge :status="status" />
        <span class="chevron" aria-hidden="true">{{ expanded ? "⌃" : "⌄" }}</span>
      </span>
    </button>

    <div class="song-card__meta">
      <SongVoteSummary :votes="song.votes" />
      <span>{{ activeCheck.completed }}/{{ activeCheck.required }} slots</span>
    </div>

    <section v-if="expanded" class="song-detail">
      <YouTubePreview :link="song.youtubeLink" />
      <a v-if="isYouTubeUrl(song.youtubeLink)" class="youtube-link" :href="song.youtubeLink" target="_blank" rel="noreferrer">
        YouTube Link
      </a>

      <div v-if="song.note || song.extraNote" class="song-note">
        <strong>난상토론</strong>
        <p v-if="song.note">{{ song.note }}</p>
        <p v-if="song.extraNote">{{ song.extraNote }}</p>
      </div>

      <div v-if="activeCheck.missing.length" class="missing-slots">
        <strong>남은 슬롯</strong>
        <span v-for="slot in activeCheck.missing" :key="slot">{{ slot }}</span>
      </div>

      <VoteRoleGrid :song-id="song.id" :votes="song.votes" @change="(...args) => $emit('vote', ...args)" />
      <CommentTimeline
        :comments="comments"
        :current-user-id="currentUserId"
        @update="(...args) => $emit('updateComment', ...args)"
        @delete="$emit('deleteComment', $event)"
      />
      <CommentComposer @submit="$emit('addComment', song.id, $event)" />
    </section>
  </article>
</template>
