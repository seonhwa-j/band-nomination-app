<script setup lang="ts">
import { computed, ref } from "vue";
import InviteCodeGate from "./components/auth/InviteCodeGate.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import FilterBar from "./components/songs/FilterBar.vue";
import SongCard from "./components/songs/SongCard.vue";
import { useAuth } from "./composables/useAuth";
import { useNomination } from "./composables/useNomination";
import type { AuthLoginPayload } from "./types/member";
import type { Song } from "./types/song";

const auth = useAuth();
const nomination = useNomination();
const expandedSongId = ref("");
const addPanelOpen = ref(false);
const editingSongId = ref("");
const newSong = ref({
  title: "",
  artist: "",
  youtubeLink: "",
});
const lastParsedYoutubeLink = ref("");
let youtubeLinkLookupTimer: ReturnType<typeof setTimeout> | undefined;

const currentMember = computed(() => auth.currentMember.value);
const currentMemberId = computed(() => currentMember.value.id);
const currentSupabaseUserId = computed(() => currentMember.value.supabaseUserId ?? "");
const currentMemberAliases = computed(() =>
  Array.from(
    new Set(
      [
        currentMember.value.id,
        currentMember.value.name,
        currentMember.value.part,
        currentMember.value.role,
        currentMember.value.avatar,
        ...(currentMember.value.aliases ?? []),
      ].filter(Boolean),
    ),
  ),
);

const handleEnter = async (code: string, payload: AuthLoginPayload) => {
  await auth.enter(code, payload);
};

const resetSongForm = () => {
  newSong.value = { title: "", artist: "", youtubeLink: "" };
  lastParsedYoutubeLink.value = "";
  editingSongId.value = "";
};

const getYoutubeVideoId = (value: string) => {
  const trimmed = value.trim();
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (!hostname.endsWith("youtube.com") && hostname !== "youtube-nocookie.com") return "";

    if (url.pathname === "/watch") return url.searchParams.get("v") ?? "";
    const pathMatch = url.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
    return pathMatch?.[1] ?? "";
  } catch {
    const match = trimmed.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? "";
  }
};

const normalizeYoutubeVideoUrl = (value: string) => {
  const videoId = getYoutubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
};

const cleanYoutubeTitle = (value: string) =>
  value
    .replace(/\[[^\]]*]/g, "")
    .replace(/\([^)]*(?:official|audio|video|mv|lyrics?|live|cover|visualizer|performance)[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const parseSongInfoFromYoutubeTitle = (value: string) => {
  const cleaned = cleanYoutubeTitle(value);
  const parts = cleaned.split(/\s+-\s+|\s+\u2013\s+|\s+\u2014\s+/).map((part) => part.trim());

  if (parts.length >= 2) {
    return {
      artist: parts[0],
      title: parts.slice(1).join(" - "),
    };
  }

  return {
    artist: "",
    title: cleaned,
  };
};

const applyParsedYoutubeTitle = (youtubeTitle: string) => {
  const parsed = parseSongInfoFromYoutubeTitle(youtubeTitle);
  if (parsed.title) newSong.value.title = parsed.title;
  if (parsed.artist) newSong.value.artist = parsed.artist;
};

const fetchYoutubeOEmbedTitle = async (youtubeUrl: string) => {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`);
    if (!response.ok) return "";

    const data = (await response.json()) as { title?: string };
    return data.title ?? "";
  } catch {
    return "";
  }
};

const handleYoutubeLinkInput = () => {
  const youtubeUrl = normalizeYoutubeVideoUrl(newSong.value.youtubeLink.trim());
  if (!youtubeUrl || youtubeUrl === lastParsedYoutubeLink.value) return;

  if (youtubeLinkLookupTimer) clearTimeout(youtubeLinkLookupTimer);
  youtubeLinkLookupTimer = setTimeout(async () => {
    lastParsedYoutubeLink.value = youtubeUrl;
    const title = await fetchYoutubeOEmbedTitle(youtubeUrl);
    if (title) applyParsedYoutubeTitle(title);
  }, 250);
};

const submitSong = async () => {
  if (!newSong.value.title.trim() || !newSong.value.artist.trim()) return;

  const payload = {
    title: newSong.value.title.trim(),
    artist: newSong.value.artist.trim(),
    youtubeLink: newSong.value.youtubeLink.trim(),
  };

  if (editingSongId.value) {
    nomination.updateSong(editingSongId.value, currentMemberId.value, payload);
  } else {
    const saved = await nomination.addSong(payload, currentMember.value);
    if (!saved) return;
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
  const ownerKeys = [song.createdBy, ...(song.createdByAliases ?? [])].filter((key): key is string => Boolean(key));
  const canManageByOwnerId = Boolean(song.ownerId && currentSupabaseUserId.value && song.ownerId === currentSupabaseUserId.value);
  if (!canManageByOwnerId && !ownerKeys.some((ownerKey) => currentMemberAliases.value.includes(ownerKey))) return;

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

const deleteSongAsCurrentMember = async (songId: string) => {
  const deleted = await nomination.deleteSong(songId, currentMemberId.value, currentSupabaseUserId.value);
  if (deleted && expandedSongId.value === songId) expandedSongId.value = "";
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
          <div class="toolbar-row">
            <input v-model="nomination.query.value" class="search-input" placeholder="곡 또는 아티스트 검색" />
            <select v-model="nomination.sortOrder.value" class="sort-select" aria-label="정렬">
              <option value="LATEST">최신 순</option>
              <option value="AGREE">좋아요 많은 순</option>
            </select>
          </div>
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
          :current-supabase-user-id="currentSupabaseUserId"
          :current-user-aliases="currentMemberAliases"
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
            <input v-model="newSong.youtubeLink" @input="handleYoutubeLinkInput" @change="handleYoutubeLinkInput" />
          </label>
          <button class="primary-action" type="submit">{{ editingSongId ? "저장하기" : "추가하기" }}</button>
        </form>
      </section>
    </div>
  </div>
</template>
