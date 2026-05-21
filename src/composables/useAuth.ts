import { computed, onMounted, ref } from "vue";
import { members } from "../data/members";
import { supabase } from "../lib/supabase";
import type { AuthUser, BandPart } from "../types/member";

const inviteCode = import.meta.env.VITE_INVITE_CODE || "STATICSTEREO2026";
const storageKey = "nomination-user";

const fallbackUser: AuthUser = {
  id: "guest",
  name: "Guest",
  part: "vocal",
  role: "Vocal",
  avatar: "GU",
};

const getPartMeta = (part: BandPart) => members.find((member) => member.id === part) ?? members[0];
const getStableUserId = (part: BandPart) => part;
const getSupabaseCredentials = (part: BandPart) => {
  const key = part.toUpperCase();
  return {
    email: import.meta.env[`VITE_SUPABASE_AUTH_${key}_EMAIL`] || "",
    password: import.meta.env[`VITE_SUPABASE_AUTH_${key}_PASSWORD`] || "",
  };
};

const normalizeUser = (user: AuthUser): AuthUser => ({
  ...user,
  id: getStableUserId(user.part),
  aliases: Array.from(new Set([...(user.aliases ?? []), user.id, user.name, user.part].filter(Boolean))),
});

const parseStoredUser = () => {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    const user = normalizeUser(JSON.parse(stored) as AuthUser);
    localStorage.setItem(storageKey, JSON.stringify(user));
    return user;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
};

export const useAuth = () => {
  const user = ref<AuthUser | null>(parseStoredUser());
  const entered = computed(() => Boolean(user.value));
  const currentMember = computed(() => user.value ?? fallbackUser);

  onMounted(async () => {
    if (!supabase || !user.value) return;

    const { data } = await supabase.auth.getSession();
    const sessionUserId = data.session?.user.id ?? null;
    if (!sessionUserId || user.value.supabaseUserId !== sessionUserId) {
      user.value = null;
      localStorage.removeItem(storageKey);
      localStorage.removeItem("nomination-member");
    }
  });

  const enter = async (code: string, payload: { part: BandPart }) => {
    if (code.trim() !== inviteCode) return false;

    if (!supabase) {
      window.alert("Supabase is not configured. Please check your environment variables.");
      return false;
    }

    const credentials = getSupabaseCredentials(payload.part);
    if (!credentials.email || !credentials.password) {
      window.alert(`Supabase Auth credentials are missing for ${payload.part}. Please check your .env file.`);
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      console.error("Supabase Auth Login Error:", error);
      window.alert(`Supabase login failed.\n\n${error.message}`);
      return false;
    }

    const partMeta = getPartMeta(payload.part);
    const nextUser: AuthUser = {
      id: getStableUserId(payload.part),
      name: partMeta.name,
      part: payload.part,
      role: partMeta.role,
      avatar: partMeta.avatar,
      aliases: [partMeta.id, partMeta.name, partMeta.role, partMeta.avatar],
      supabaseUserId: data.user.id,
    };

    user.value = nextUser;
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
    localStorage.removeItem("nomination-member");
    return true;
  };

  const leave = async () => {
    if (supabase) await supabase.auth.signOut();
    user.value = null;
    localStorage.removeItem(storageKey);
    localStorage.removeItem("nomination-member");
  };

  return {
    members,
    currentMember,
    entered,
    enter,
    leave,
  };
};
