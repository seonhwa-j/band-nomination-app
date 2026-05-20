<script setup lang="ts">
import { computed, ref } from "vue";
import InviteCodeGate from "./components/auth/InviteCodeGate.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import FilterBar from "./components/songs/FilterBar.vue";
import SongCard from "./components/songs/SongCard.vue";
import { useAuth } from "./composables/useAuth";
import { useNomination } from "./composables/useNomination";
import type { BandPart } from "./types/member";
import type { Song } from "./types/song";

const auth = useAuth();
const nomination = useNomination();
const expandedSongId = ref("song-001");
const addPanelOpen = ref(false);
const editingSongId = ref("");
const newSong = ref({
  title: "",
  artist: "",
  youtubeLink: "",
});

const currentMember = computed(() => auth.currentMember.value);
const currentMemberId = computed(() => currentMember.value.id);

const handleEnter = (code: string, payload: { part: BandPart }) => {
  auth.enter(code, payload);
};

const resetSongForm = () => {
  newSong.value = { title: "", artist: "", youtubeLink: "" };
  editingSongId.value = "";
};

const submitSong = () => {
  if (!newSong.value.title.trim() || !newSong.value.artist.trim()) return;

  const payload = {
    title: newSong.value.title.trim(),
    artist: newSong.value.artist.trim(),
    youtubeLink: newSong.value.youtubeLink.trim(),
  };

  if (editingSongId.value) {
    nomination.updateSong(editingSongId.value, currentMemberId.value, payload);
  } else {
    nomination.addSong(payload, currentMemberId.value);
  }

  resetSongForm();
  addPanelOpen.value = false;
};

const addCommentAsCurrentMember = (songId: string, text: string) => {
  nomination.addComment(songId, currentMember.value, text);
};

const openAddSongPanel = () => {
  resetSongForm();
  addPanelOpen.value = true;
};

const openEditSongPanel = (song: Song) => {
  if (song.createdBy !== currentMemberId.value) return;

  editingSongId.value = song.id;
  newSong.value = {
    title: song.title,
    artist: song.artist,
    youtubeLink: song.youtubeLink,
  };
  addPanelOpen.value = true;
};

const closeSongPanel = () => {
  addPanelOpen.value = false;
  resetSongForm();
};

const deleteSongAsCurrentMember = (songId: string) => {
  nomination.deleteSong(songId, currentMemberId.value);
  if (expandedSongId.value === songId) expandedSongId.value = "";
};
</script>

<template>
  <InviteCodeGate v-if="!auth.entered.value" :members="auth.members" @enter="handleEnter" />

  <div v-else class="app-shell">
    <AppHeader :member="currentMember" :stats="nomination.stats.value" />

    <main class="app-main">
      <section class="hero-panel">
        <p class="eyebrow">Nominees List</p>
        <h1>Static Stereo 선곡장</h1>
        <p>좋아요/해봐요가 많은 곡부터 정렬되고, 모든 파트가 준비되면 ACTIVE로 전환됩니다.</p>
        <div class="hero-stats">
          <span><b>{{ nomination.stats.value.active }}</b> ACTIVE</span>
          <span><b>{{ nomination.stats.value.pending }}</b> PENDING</span>
        </div>
      </section>

      <section class="sticky-controls">
        <section class="list-toolbar">
          <div class="segmented-control" aria-label="상태 필터">
            <button
              v-for="filter in ['ALL', 'ACTIVE', 'PENDING']"
              :key="filter"
              type="button"
              :class="{ 'is-active': nomination.activeFilter.value === filter }"
              @click="nomination.activeFilter.value = filter as 'ALL' | 'ACTIVE' | 'PENDING'"
            >
              {{ filter }}
            </button>
          </div>
          <input v-model="nomination.query.value" class="search-input" placeholder="곡 또는 아티스트 검색" />
        </section>

        <FilterBar :active-filter="nomination.unvotedFilter.value" :counts="nomination.unvotedCounts.value" @change="nomination.setUnvotedFilter" />
      </section>

      <TransitionGroup name="song-sort" tag="section" class="song-list" aria-label="추천곡 목록">
        <SongCard
          v-for="song in nomination.filteredSongs.value"
          :key="song.id"
          :song="song"
          :expanded="expandedSongId === song.id"
          :comments="nomination.getCommentsBySong(song.id)"
          :current-user-id="currentMemberId"
          :current-part="currentMember.part"
          @toggle="expandedSongId = expandedSongId === $event ? '' : $event"
          @vote="nomination.updateVote"
          @edit-song="openEditSongPanel"
          @delete-song="deleteSongAsCurrentMember"
          @add-comment="addCommentAsCurrentMember"
          @update-comment="nomination.updateComment"
          @delete-comment="nomination.deleteComment"
        />
      </TransitionGroup>
    </main>

    <button class="fab" type="button" aria-label="곡 추가" @click="openAddSongPanel">+</button>

    <div v-if="addPanelOpen" class="sheet-backdrop">
      <section class="bottom-sheet">
        <header>
          <h2>{{ editingSongId ? "곡 수정" : "곡 추천" }}</h2>
          <button type="button" aria-label="닫기" @click="closeSongPanel">×</button>
        </header>
        <form class="song-form" @submit.prevent="submitSong">
          <label>
            <span>제목</span>
            <input v-model="newSong.title" required />
          </label>
          <label>
            <span>아티스트</span>
            <input v-model="newSong.artist" required />
          </label>
          <label>
            <span>YouTube Link</span>
            <input v-model="newSong.youtubeLink" />
          </label>
          <button class="primary-action" type="submit">{{ editingSongId ? "저장하기" : "추가하기" }}</button>
        </form>
      </section>
    </div>
  </div>
</template>
