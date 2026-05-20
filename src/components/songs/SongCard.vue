<script setup lang="ts">
import { computed } from "vue";
import CommentComposer from "../comments/CommentComposer.vue";
import CommentTimeline from "../comments/CommentTimeline.vue";
import VoteRoleGrid from "../votes/VoteRoleGrid.vue";
import SongStatusBadge from "./SongStatusBadge.vue";
import SongVoteSummary from "./SongVoteSummary.vue";
import YouTubePreview from "./YouTubePreview.vue";
import { evaluateActiveStatus } from "../../utils/activeRules";
import { formatUnvotedSummary } from "../../utils/unvotedFilters";
import { isYouTubeUrl } from "../../utils/youtube";
import type { BandPart } from "../../types/member";
import type { SongComment } from "../../types/comment";
import type { Song } from "../../types/song";
import type { RoleVoteKey, VoteType } from "../../types/vote";

const props = defineProps<{
  song: Song;
  expanded: boolean;
  comments: SongComment[];
  currentUserId: string;
  currentUserAliases: string[];
  currentPart: BandPart;
}>();

const emit = defineEmits<{
  toggle: [songId: string];
  vote: [songId: string, key: RoleVoteKey, vote: VoteType];
  editSong: [song: Song];
  deleteSong: [songId: string];
  addComment: [songId: string, text: string];
  updateComment: [commentId: string, text: string];
  deleteComment: [commentId: string];
}>();

const activeCheck = computed(() => evaluateActiveStatus(props.song.votes));
const status = computed(() => (activeCheck.value.active ? "ACTIVE" : "PENDING"));
const unvotedSummary = computed(() => (status.value === "PENDING" ? formatUnvotedSummary(props.song) : ""));
const canManageSong = computed(() => {
  const ownerKeys = [props.song.createdBy, ...(props.song.createdByAliases ?? [])].filter((key): key is string => Boolean(key));
  const currentUserKeys = [props.currentUserId, ...props.currentUserAliases];
  return ownerKeys.some((ownerKey) => currentUserKeys.includes(ownerKey));
});

const handleEdit = () => {
  console.log("Edit song clicked:", props.song.id);
  emit("editSong", props.song);
};

const handleDelete = () => {
  console.log("Delete song clicked:", props.song.id);
  if (!window.confirm("정말 삭제하시겠습니까?")) return;
  emit("deleteSong", props.song.id);
};
</script>

<template>
  <article class="song-card" :class="{ 'song-card--active': status === 'ACTIVE', 'is-expanded': expanded }">
    <button class="song-card__summary" type="button" @click="$emit('toggle', song.id)">
      <span class="song-thumb" :class="{ 'has-link': isYouTubeUrl(song.youtubeLink) }">
        <span aria-hidden="true">Play</span>
      </span>
      <span class="song-card__main">
        <strong>{{ song.title }}</strong>
        <small>{{ song.artist }}</small>
        <em v-if="unvotedSummary">{{ unvotedSummary }}</em>
      </span>
      <span class="song-card__side">
        <SongStatusBadge :status="status" />
        <span class="chevron" aria-hidden="true">{{ expanded ? "↑" : "↓" }}</span>
      </span>
    </button>

    <div class="song-card__meta">
      <SongVoteSummary :votes="song.votes" />
      <span>AGREE {{ song.agreeScore ?? 0 }} · {{ activeCheck.completed }}/{{ activeCheck.required }} parts</span>
    </div>

    <section v-if="expanded" class="song-detail">
      <YouTubePreview :link="song.youtubeLink" />
      <a v-if="isYouTubeUrl(song.youtubeLink)" class="youtube-link" :href="song.youtubeLink" target="_blank" rel="noreferrer">
        YouTube에서 열기
      </a>

      <div v-if="activeCheck.missing.length" class="missing-slots">
        <strong>대기 파트</strong>
        <span v-for="slot in activeCheck.missing" :key="slot">{{ slot }}</span>
      </div>

      <div v-if="canManageSong" class="song-actions">
        <button type="button" @click.stop="handleEdit">수정</button>
        <button type="button" @click.stop="handleDelete">삭제</button>
      </div>

      <VoteRoleGrid :song-id="song.id" :votes="song.votes" :current-part="currentPart" @change="(...args) => $emit('vote', ...args)" />
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
