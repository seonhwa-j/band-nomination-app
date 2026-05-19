import { computed, ref } from "vue";
import { members } from "../data/members";

const inviteCode = import.meta.env.VITE_INVITE_CODE || "NOMINATION2026";

export const useAuth = () => {
  const selectedMemberId = ref(localStorage.getItem("nomination-member") || "");
  const entered = ref(Boolean(selectedMemberId.value));

  const currentMember = computed(() => members.find((member) => member.id === selectedMemberId.value) ?? members[0]);

  const enter = (code: string, memberId: string) => {
    if (code.trim() !== inviteCode) return false;

    selectedMemberId.value = memberId;
    entered.value = true;
    localStorage.setItem("nomination-member", memberId);
    return true;
  };

  const leave = () => {
    entered.value = false;
    selectedMemberId.value = "";
    localStorage.removeItem("nomination-member");
  };

  return {
    members,
    currentMember,
    selectedMemberId,
    entered,
    enter,
    leave,
  };
};
