<script setup lang="ts">
import type { Member } from "../../types/member";

defineProps<{
  member: Member;
  stats: {
    total: number;
    active: number;
    pending: number;
  };
}>();

defineEmits<{
  leave: [];
}>();
</script>

<template>
  <header class="app-header">
    <div class="brand-mark" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="app-header__title">
      <strong>BAND NOMINATION</strong>
      <span>{{ stats.active }} active / {{ stats.total }} songs</span>
    </div>
    <button class="member-button" type="button" @click="$emit('leave')" :aria-label="`${member.name} 로그아웃`">
      {{ member.avatar }}
    </button>
  </header>
</template>
