import { computed, onMounted, onUnmounted, ref } from "vue";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { mockComments } from "../data/mockComments";
import { mockSongs } from "../data/mockSongs";
import { supabase } from "../lib/supabase";
import { positiveVotes } from "../data/voteOptions";
import { evaluateActiveStatus } from "../utils/activeRules";
import { getUnvotedFilterCounts, isSongUnvotedForFilter, type UnvotedFilterKey } from "../utils/unvotedFilters";
import type { AuthUser } from "../types/member";
import type { SongComment } from "../types/comment";
import type { Song } from "../types/song";
import type { RoleVoteKey, VoteType } from "../types/vote";

const emptyVotes = (): Song["votes"] => ({
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
});

type SongRow = {
  id: string;
  title: string;
  artist: string;
  youtube_link: string | null;
  added_by: string | null;
  status: Song["status"];
  note: string | null;
  created_at: string | null;
};

const rowToSong = (row: SongRow): Song => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  youtubeLink: row.youtube_link || "",
  status: row.status,
  createdAt: row.created_at,
  createdBy: row.added_by,
  note: row.note,
  extraNote: null,
  votes: emptyVotes(),
});

type SortOrder = "LATEST" | "AGREE";

const getLatestSortValue = (song: Song) => {
  if (song.createdAt) {
    const timestamp = new Date(song.createdAt).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  const numericId = Number(song.id.match(/\d+/)?.[0] ?? 0);
  return Number.isNaN(numericId) ? 0 : numericId;
};

export const useNomination = () => {
  const songs = ref<Song[]>(mockSongs);
  const comments = ref<SongComment[]>(mockComments);
  const activeFilter = ref<"ALL" | "ACTIVE" | "PENDING">("ALL");
  const unvotedFilter = ref<UnvotedFilterKey>("ALL");
  const sortOrder = ref<SortOrder>("LATEST");
  const query = ref("");
  let songsChannel: RealtimeChannel | null = null;

  const mergeSong = (song: Song) => {
    const existingIndex = songs.value.findIndex((item) => item.id === song.id);
    songs.value =
      existingIndex === -1
        ? [song, ...songs.value]
        : songs.value.map((item) => (item.id === song.id ? { ...item, ...song, votes: item.votes } : item));
  };

  const loadRemoteSongs = async () => {
    if (!supabase) return;

    const { data, error } = await supabase.from("songs").select("id,title,artist,youtube_link,added_by,status,note,created_at").order("created_at", { ascending: false });
    if (error || !data) return;

    data.forEach((row) => mergeSong(rowToSong(row as SongRow)));
  };

  const subscribeToRemoteSongs = () => {
    if (!supabase || songsChannel) return;

    songsChannel = supabase
      .channel("songs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "songs" }, (payload) => mergeSong(rowToSong(payload.new as SongRow)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "songs" }, (payload) => mergeSong(rowToSong(payload.new as SongRow)))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "songs" }, (payload) => {
        const deletedId = (payload.old as Pick<SongRow, "id">).id;
        songs.value = songs.value.filter((song) => song.id !== deletedId);
      })
      .subscribe();
  };

  onMounted(() => {
    if (supabase) songs.value = [];
    loadRemoteSongs();
    subscribeToRemoteSongs();
  });

  onUnmounted(() => {
    if (!supabase || !songsChannel) return;
    supabase.removeChannel(songsChannel);
    songsChannel = null;
  });

  const decoratedSongs = computed(() =>
    songs.value.map((song) => {
      const check = evaluateActiveStatus(song.votes);
      const agreeScore = Object.values(song.votes).filter((vote) => positiveVotes.includes(vote)).length;
      return {
        ...song,
        status: check.active ? ("ACTIVE" as const) : ("PENDING" as const),
        activeCheck: check,
        agreeScore,
      };
    }),
  );

  const filteredSongs = computed(() => {
    const keyword = query.value.trim().toLowerCase();

    return decoratedSongs.value
      .filter((song) => {
        const matchesStatus = activeFilter.value === "ALL" || song.status === activeFilter.value;
        const matchesUnvoted = unvotedFilter.value === "ALL" || isSongUnvotedForFilter(song, unvotedFilter.value);
        const matchesQuery = !keyword || `${song.title} ${song.artist}`.toLowerCase().includes(keyword);
        return matchesStatus && matchesUnvoted && matchesQuery;
      })
      .sort((a, b) => {
        if (sortOrder.value === "LATEST") return getLatestSortValue(b) - getLatestSortValue(a);
        if ((b.agreeScore ?? 0) !== (a.agreeScore ?? 0)) return (b.agreeScore ?? 0) - (a.agreeScore ?? 0);
        if (a.status !== b.status) return a.status === "ACTIVE" ? -1 : 1;
        return a.title.localeCompare(b.title, "ko");
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

  const unvotedCounts = computed(() => getUnvotedFilterCounts(decoratedSongs.value));

  const setUnvotedFilter = (filter: UnvotedFilterKey) => {
    unvotedFilter.value = unvotedFilter.value === filter || filter === "ALL" ? "ALL" : filter;
  };

  const updateVote = (songId: string, key: RoleVoteKey, vote: VoteType) => {
    const song = songs.value.find((item) => item.id === songId);
    if (!song) return;

    song.votes = { ...song.votes, [key]: vote };
    song.status = evaluateActiveStatus(song.votes).active ? "ACTIVE" : "PENDING";
  };

  const addSong = async (payload: Pick<Song, "title" | "artist" | "youtubeLink">, userId: string) => {
    const createdAt = new Date().toISOString();

    if (supabase) {
      const { data, error } = await supabase
        .from("songs")
        .insert({ title: payload.title, artist: payload.artist, youtube_link: payload.youtubeLink, added_by: userId, created_at: createdAt })
        .select("id,title,artist,youtube_link,added_by,status,note,created_at")
        .single();

      if (!error && data) mergeSong(rowToSong({ ...(data as SongRow), created_at: (data as SongRow).created_at || createdAt }));
      return;
    }

    const song: Song = {
      id: `song-${Date.now()}`,
      status: "PENDING",
      createdBy: userId,
      createdAt,
      note: null,
      extraNote: null,
      ...payload,
      votes: emptyVotes(),
    };

    songs.value = [song, ...songs.value];
  };

  const updateSong = (songId: string, userId: string, payload: Pick<Song, "title" | "artist" | "youtubeLink">) => {
    songs.value = songs.value.map((song) =>
      song.id === songId && song.createdBy === userId
        ? {
            ...song,
            title: payload.title,
            artist: payload.artist,
            youtubeLink: payload.youtubeLink,
          }
        : song,
    );
  };

  const deleteSong = (songId: string, userId: string) => {
    const song = songs.value.find((item) => item.id === songId);
    if (!song || song.createdBy !== userId) return;

    songs.value = songs.value.filter((item) => item.id !== songId);
    comments.value = comments.value.filter((comment) => comment.songId !== songId);
  };

  const addComment = (songId: string, user: AuthUser, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    comments.value = [
      ...comments.value,
      {
        id: `comment-${Date.now()}`,
        songId,
        userId: user.id,
        userName: user.name,
        userPart: user.role,
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
    unvotedFilter,
    sortOrder,
    unvotedCounts,
    query,
    stats,
    setUnvotedFilter,
    updateVote,
    addSong,
    updateSong,
    deleteSong,
    addComment,
    updateComment,
    deleteComment,
    getCommentsBySong,
  };
};
