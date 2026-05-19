import { computed, ref } from "vue";
import { members } from "../data/members";
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

const parseStoredUser = () => {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
};

export const useAuth = () => {
  const user = ref<AuthUser | null>(parseStoredUser());
  const entered = computed(() => Boolean(user.value));
  const currentMember = computed(() => user.value ?? fallbackUser);

  const enter = (code: string, payload: { part: BandPart }) => {
    if (code.trim() !== inviteCode) return false;

    const partMeta = getPartMeta(payload.part);
    const nextUser: AuthUser = {
      id: crypto.randomUUID?.() ?? `user-${Date.now()}`,
      name: partMeta.name,
      part: payload.part,
      role: partMeta.role,
      avatar: partMeta.avatar,
    };

    user.value = nextUser;
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
    localStorage.removeItem("nomination-member");
    return true;
  };

  const leave = () => {
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
