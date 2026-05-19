<script setup lang="ts">
import { computed, ref } from "vue";
import InviteCodeGate from "./components/auth/InviteCodeGate.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import SongCard from "./components/songs/SongCard.vue";
import { useAuth } from "./composables/useAuth";
import { useNomination } from "./composables/useNomination";

const auth = useAuth();
const nomination = useNomination();
const expandedSongId = ref("song-001");
const addPanelOpen = ref(false);
const newSong = ref({
  title: "",
  artist: "",
  youtubeLink: "",
});

const currentMemberId = computed(() => auth.currentMember.value.id);

const handleEnter = (code: string, memberId: string) => {
  auth.enter(code, memberId);
};

const submitSong = () => {
  if (!newSong.value.title.trim() || !newSong.value.artist.trim()) return;
  nomination.addSong({
    title: newSong.value.title.trim(),
    artist: newSong.value.artist.trim(),
    youtubeLink: newSong.value.youtubeLink.trim(),
  });
  newSong.value = { title: "", artist: "", youtubeLink: "" };
  addPanelOpen.value = false;
};

const addCommentAsCurrentMember = (songId: string, text: string) => {
  nomination.addComment(songId, currentMemberId.value, text);
};
</script>

<template>
  <InviteCodeGate v-if="!auth.entered.value" :members="auth.members" @enter="handleEnter" />

  <div v-else class="app-shell">
    <AppHeader :member="auth.currentMember.value" :stats="nomination.stats.value" @leave="auth.leave" />

    <main class="app-main">
      <section class="hero-panel">
        <p class="eyebrow">Nominees List</p>
        <h1>Static Stereo 선곡</h1>
        <p>AGREE가 많은 곡부터 정렬되고, 파트 슬롯이 모두 채워지면 ACTIVE로 전환됩니다.</p>
        <div class="hero-stats">
          <span
            ><b>{{ nomination.stats.value.active }}</b> ACTIVE</span
          >
          <span
            ><b>{{ nomination.stats.value.pending }}</b> PENDING</span
          >
        </div>
      </section>

      <section class="list-toolbar">
        <div class="segmented-control" aria-label="상태 필터">
          <button v-for="filter in ['ALL', 'ACTIVE', 'PENDING']" :key="filter" type="button" :class="{ 'is-active': nomination.activeFilter.value === filter }" @click="nomination.activeFilter.value = filter as 'ALL' | 'ACTIVE' | 'PENDING'">
            {{ filter }}
          </button>
        </div>
        <input v-model="nomination.query.value" class="search-input" placeholder="곡 또는 가수 검색" />
      </section>

      <TransitionGroup name="song-sort" tag="section" class="song-list" aria-label="추천곡 목록">
        <SongCard
          v-for="song in nomination.filteredSongs.value"
          :key="song.id"
          :song="song"
          :expanded="expandedSongId === song.id"
          :comments="nomination.getCommentsBySong(song.id)"
          :current-user-id="currentMemberId"
          @toggle="expandedSongId = expandedSongId === $event ? '' : $event"
          @vote="nomination.updateVote"
          @add-comment="addCommentAsCurrentMember"
          @update-comment="nomination.updateComment"
          @delete-comment="nomination.deleteComment"
        />
      </TransitionGroup>
    </main>

    <button class="fab" type="button" aria-label="곡 추가" @click="addPanelOpen = true">+</button>

    <div v-if="addPanelOpen" class="sheet-backdrop" @click.self="addPanelOpen = false">
      <section class="bottom-sheet">
        <header>
          <h2>곡 추천</h2>
          <button type="button" aria-label="닫기" @click="addPanelOpen = false">×</button>
        </header>
        <form class="song-form" @submit.prevent="submitSong">
          <label>
            <span>제목</span>
            <input v-model="newSong.title" required />
          </label>
          <label>
            <span>가수</span>
            <input v-model="newSong.artist" required />
          </label>
          <label>
            <span>YouTube Link</span>
            <input v-model="newSong.youtubeLink" />
          </label>
          <button class="primary-action" type="submit">추가하기</button>
        </form>
      </section>
    </div>
  </div>
</template>
