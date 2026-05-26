import { computed, onMounted, onUnmounted, ref } from "vue";
import { members } from "../data/members";
import { supabase, supabaseConfig } from "../lib/supabase";
import type { AuthChangeEvent, Session, Subscription } from "@supabase/supabase-js";
import type { AuthLoginPayload, AuthUser, BandPart } from "../types/member";

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

type MemberAuthRow = {
  member_id: BandPart;
  users?: { username?: string | null; role?: string | null; profile_picture?: string | null } | null;
};

const isBandPart = (value: string | undefined): value is BandPart => members.some((member) => member.id === value);

const verifyPassword = async (email: string, password: string) => {
  const response = await fetch(`${supabaseConfig.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return response.ok;
};

export const useAuth = () => {
  const user = ref<AuthUser | null>(parseStoredUser());
  const entered = computed(() => Boolean(user.value));
  const currentMember = computed(() => user.value ?? fallbackUser);
  let authSubscription: Subscription | null = null;

  const setUserFromSession = async (session: Session | null) => {
    if (!supabase || !session?.user) {
      user.value = null;
      localStorage.removeItem(storageKey);
      localStorage.removeItem("nomination-member");
      return false;
    }

    const { data, error } = await supabase
      .from("member_auth")
      .select("member_id,users(username,role,profile_picture)")
      .eq("auth_user_id", session.user.id)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("Supabase member auth lookup error:", error);
      window.alert("Member profile lookup failed. Please check the Supabase member_auth table and RLS policy.");
      await supabase.auth.signOut();
      return false;
    }

    const row = data as MemberAuthRow | null;
    const metadataPart = session.user.user_metadata?.member_id ?? session.user.user_metadata?.part ?? session.user.app_metadata?.member_id ?? session.user.app_metadata?.part;
    const part = row?.member_id ?? (isBandPart(metadataPart) ? metadataPart : undefined);

    if (!part) {
      window.alert("This email is not registered as a band member. Please ask the admin to add it to Supabase.");
      await supabase.auth.signOut();
      return false;
    }

    const partMeta = getPartMeta(part);
    const nextUser = normalizeUser({
      id: getStableUserId(part),
      name: row?.users?.username || partMeta.name,
      part,
      role: row?.users?.role || partMeta.role,
      avatar: row?.users?.profile_picture || partMeta.avatar,
      email: session.user.email ?? "",
      aliases: [partMeta.id, partMeta.name, partMeta.role, partMeta.avatar, session.user.email ?? ""],
      supabaseUserId: session.user.id,
    });

    user.value = nextUser;
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
    localStorage.removeItem("nomination-member");
    return true;
  };

  onMounted(async () => {
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    if (data.session) await setUserFromSession(data.session);
    else if (user.value) await setUserFromSession(null);

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      window.setTimeout(() => {
        void setUserFromSession(session);
      }, 0);
    });
    authSubscription = listener.subscription;
  });

  onUnmounted(() => {
    authSubscription?.unsubscribe();
    authSubscription = null;
  });

  const enter = async (payload: AuthLoginPayload) => {
    if (!supabase) {
      window.alert("Supabase is not configured. Please check your environment variables.");
      return false;
    }

    const email = payload.email.trim().toLowerCase();
    if (!email) {
      window.alert("Please enter your member email.");
      return false;
    }

    if (!payload.password.trim()) {
      window.alert("Please enter your password.");
      return false;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password,
    });

    if (error) {
      console.error("Supabase password login error:", error);
      window.alert(`Login failed.\n\n${error.message}`);
      return false;
    }

    return true;
  };

  const changePassword = async (currentPassword: string, nextPassword: string) => {
    if (!supabase) return { ok: false, message: "Supabase is not configured." };

    const trimmedCurrent = currentPassword.trim();
    const trimmedNext = nextPassword.trim();
    if (!trimmedCurrent || !trimmedNext) return { ok: false, message: "Please enter both passwords." };
    if (trimmedNext.length < 8) return { ok: false, message: "New password must be at least 8 characters." };

    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) return { ok: false, message: "Current session has no email. Please log in again." };

    const currentPasswordIsValid = await verifyPassword(email, trimmedCurrent);
    if (!currentPasswordIsValid) return { ok: false, message: "Current password is incorrect." };

    const { error } = await supabase.auth.updateUser({ password: trimmedNext });
    if (error) return { ok: false, message: error.message };

    return { ok: true, message: "Password changed." };
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
    changePassword,
    leave,
  };
};
