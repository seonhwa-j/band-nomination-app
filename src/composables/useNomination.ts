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
  users?: { username?: string | null; role?: string | null; profile_picture?: string | null } | { username?: string | null; role?: string | null; profile_picture?: string | null }[] | null;
  status: Song["status"];
  note: string | null;
  created_at: string | null;
  owner_id?: string | null;
};

const rowToSong = (row: SongRow): Song => {
  const userRows = Array.isArray(row.users) ? row.users : row.users ? [row.users] : [];

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    youtubeLink: row.youtube_link || "",
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.added_by,
    createdByAliases: Array.from(new Set(userRows.flatMap((user) => [user.username, user.role, user.profile_picture]).filter(Boolean) as string[])),
    ownerId: row.owner_id ?? null,
    note: row.note,
    extraNote: null,
    votes: emptyVotes(),
  };
};

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

    const { data, error } = await supabase.from("songs").select("id,title,artist,youtube_link,added_by,status,note,created_at,owner_id,users(username,role,profile_picture)").order("created_at", { ascending: false });
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

  const addSong = async (payload: Pick<Song, "title" | "artist" | "youtubeLink">, user: AuthUser) => {
    const createdAt = new Date().toISOString();

    try {
      if (!supabase) throw new Error("Supabase is not configured. Song was not saved.");

      const { error: userError } = await supabase
        .from("users")
        .upsert({ id: user.id, username: user.name, role: user.role, profile_picture: user.avatar }, { onConflict: "id" });

      if (userError) throw userError;

      const { data, error } = await supabase
        .from("songs")
        .insert([{ title: payload.title, artist: payload.artist, youtube_link: payload.youtubeLink, added_by: user.id, status: "PENDING", created_at: createdAt }])
        .select("id,title,artist,youtube_link,added_by,status,note,created_at,owner_id")
        .single();

      if (error || !data) throw error ?? new Error("No inserted song returned from Supabase.");

      mergeSong(rowToSong({ ...(data as SongRow), created_at: (data as SongRow).created_at || createdAt }));
      return true;
    } catch (error) {
      const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
      console.error("Supabase Insert Error: ", error);
      console.error("Supabase Insert Error Code: ", supabaseError?.code);
      console.error("Supabase Insert Error Message: ", error instanceof Error ? error.message : supabaseError?.message);
      console.error("Supabase Insert Error Details: ", supabaseError?.details);
      console.error("Supabase Insert Error Hint: ", supabaseError?.hint);
      console.error("Supabase Insert Error Type: ", error instanceof TypeError ? "Network or invalid Supabase URL" : supabaseError?.code === "23503" ? "Foreign key constraint" : supabaseError?.code === "42501" ? "RLS or permission policy" : "Database or configuration");
      window.alert(`곡 저장에 실패했습니다.\n\n${supabaseError?.message ?? "Supabase 연결, RLS 정책, songs 테이블 설정을 확인해주세요."}\n${supabaseError?.details ?? ""}\n${supabaseError?.hint ?? ""}`);
      return false;
    }
  };

  const updateSong = async (
    songId: string,
    userId: string,
    payload: Pick<Song, "title" | "artist" | "youtubeLink"> & Partial<Pick<Song, "note">>,
  ) => {
    const song = songs.value.find((item) => item.id === songId);
    if (!song || !userId) return false;

    try {
      if (!supabase) throw new Error("Supabase is not configured. Song was not updated.");

      const updatePayload: { title: string; artist: string; youtube_link: string; note?: string | null } = {
        title: payload.title,
        artist: payload.artist,
        youtube_link: payload.youtubeLink,
      };

      if ("note" in payload) updatePayload.note = payload.note ?? null;

      const { data, error } = await supabase
        .from("songs")
        .update(updatePayload)
        .eq("id", songId)
        .select("id,title,artist,youtube_link,added_by,status,note,created_at,owner_id,users(username,role,profile_picture)")
        .single();

      if (error || !data) throw error ?? new Error("No updated song returned from Supabase.");

      const updatedSong = rowToSong(data as SongRow);
      songs.value = songs.value.map((item) =>
        item.id === songId
          ? {
              ...item,
              title: updatedSong.title,
              artist: updatedSong.artist,
              youtubeLink: updatedSong.youtubeLink,
              note: updatedSong.note,
              status: updatedSong.status,
              createdAt: updatedSong.createdAt ?? item.createdAt,
            }
          : item,
      );
      return true;
    } catch (error) {
      const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
      console.error("Supabase Update Error: ", error);
      console.error("Supabase Update Error Code: ", supabaseError?.code);
      console.error("Supabase Update Error Message: ", error instanceof Error ? error.message : supabaseError?.message);
      console.error("Supabase Update Error Details: ", supabaseError?.details);
      console.error("Supabase Update Error Hint: ", supabaseError?.hint);
      window.alert(`Song update failed.\n\n${supabaseError?.message ?? "Please check Supabase connection, RLS policy, and songs table settings."}\n${supabaseError?.details ?? ""}\n${supabaseError?.hint ?? ""}`);
      return false;
    }
  };

  const deleteSong = async (songId: string, userId: string, supabaseUserId: string) => {
    const targetSongId = String(songId ?? "").trim();
    const song = songs.value.find((item) => item.id === targetSongId);
    if (!song || !userId) return false;

    try {
      if (!supabase) throw new Error("Supabase is not configured. Song was not deleted.");

      const isRemoteSongId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetSongId);
      if (!isRemoteSongId) {
        songs.value = songs.value.filter((item) => item.id !== targetSongId);
        comments.value = comments.value.filter((comment) => comment.songId !== targetSongId);
        return true;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("Supabase login session is missing or expired. Please enter again and try deleting the song.");
      }

      if (authData.user.id !== supabaseUserId) {
        throw new Error("The saved app user does not match the current Supabase login session. Please enter again and try deleting the song.");
      }

      if (song.ownerId && song.ownerId !== authData.user.id) {
        throw new Error("Only the Supabase account that added this song can delete it.");
      }

      const { data, error } = await supabase.from("songs").delete().eq("id", targetSongId).select("id").maybeSingle();
      if (error) throw error;
      if (!data?.id) {
        console.error("Supabase Delete Error: No matching row deleted.", {
          songId: targetSongId,
          userId,
          localSong: song,
        });
        throw new Error("No song was deleted from Supabase. The row may not exist, the ID may not match, or RLS may be blocking delete access.");
      }

      songs.value = songs.value.filter((item) => item.id !== targetSongId);
      comments.value = comments.value.filter((comment) => comment.songId !== targetSongId);
      return true;
    } catch (error) {
      const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
      console.error("Supabase Delete Error: ", error);
      console.error("Supabase Delete Error Code: ", supabaseError?.code);
      console.error("Supabase Delete Error Message: ", error instanceof Error ? error.message : supabaseError?.message);
      console.error("Supabase Delete Error Details: ", supabaseError?.details);
      console.error("Supabase Delete Error Hint: ", supabaseError?.hint);
      window.alert(`Song delete failed.\n\n${supabaseError?.message ?? "Please check Supabase connection, RLS policy, and songs table settings."}\n${supabaseError?.details ?? ""}\n${supabaseError?.hint ?? ""}`);
      return false;
    }
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
