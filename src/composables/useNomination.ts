import { computed, ref } from "vue";
import { mockComments } from "../data/mockComments";
import { mockSongs } from "../data/mockSongs";
import { evaluateActiveStatus } from "../utils/activeRules";
import type { SongComment } from "../types/comment";
import type { Song } from "../types/song";
import type { RoleVoteKey, VoteType } from "../types/vote";

export const useNomination = () => {
  const songs = ref<Song[]>(mockSongs);
  const comments = ref<SongComment[]>(mockComments);
  const activeFilter = ref<"ALL" | "ACTIVE" | "PENDING">("ALL");
  const query = ref("");

  const decoratedSongs = computed(() =>
    songs.value.map((song) => {
      const check = evaluateActiveStatus(song.votes);
      return {
        ...song,
        status: check.active ? "ACTIVE" : song.status,
        activeCheck: check,
      };
    }),
  );

  const filteredSongs = computed(() => {
    const keyword = query.value.trim().toLowerCase();

    return decoratedSongs.value.filter((song) => {
      const matchesStatus = activeFilter.value === "ALL" || song.status === activeFilter.value;
      const matchesQuery = !keyword || `${song.title} ${song.artist}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesQuery;
    });
  });

  const stats = computed(() => {
    const active = decoratedSongs.value.filter((song) => song.status === "ACTIVE").length;
    return {
      total: songs.value.length,
      active,
      pending: songs.value.length - active,
    };
  });

  const updateVote = (songId: string, key: RoleVoteKey, vote: VoteType) => {
    const song = songs.value.find((item) => item.id === songId);
    if (!song) return;

    song.votes = { ...song.votes, [key]: vote };
    song.status = evaluateActiveStatus(song.votes).active ? "ACTIVE" : "PENDING";
  };

  const addSong = (payload: Pick<Song, "title" | "artist" | "youtubeLink">) => {
    const song: Song = {
      id: `song-${Date.now()}`,
      status: "PENDING",
      note: "앱에서 새로 추천한 곡",
      extraNote: null,
      ...payload,
      votes: {
        vocal: "NONE",
        drum: "NONE",
        bass: "NONE",
        devilGuitar1: "NONE",
        devilGuitar2: "NONE",
        sunnyGuitar1: "NONE",
        sunnyGuitar2: "NONE",
        seulKeyboard1: "NONE",
        lilacKeyboard2: "NONE",
        lilacChorus: "NONE",
      },
    };

    songs.value = [song, ...songs.value];
  };

  const addComment = (songId: string, userId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    comments.value = [
      ...comments.value,
      {
        id: `comment-${Date.now()}`,
        songId,
        userId,
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ];
  };

  const updateComment = (commentId: string, text: string) => {
    comments.value = comments.value.map((comment) =>
      comment.id === commentId ? { ...comment, text, updatedAt: new Date().toISOString() } : comment,
    );
  };

  const deleteComment = (commentId: string) => {
    comments.value = comments.value.filter((comment) => comment.id !== commentId);
  };

  const getCommentsBySong = (songId: string) => comments.value.filter((comment) => comment.songId === songId);

  return {
    songs,
    filteredSongs,
    activeFilter,
    query,
    stats,
    updateVote,
    addSong,
    addComment,
    updateComment,
    deleteComment,
    getCommentsBySong,
  };
};
