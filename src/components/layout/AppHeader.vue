<script setup lang="ts">
import type { AuthUser } from "../../types/member";

defineProps<{
  member: AuthUser;
  stats: {
    total: number;
    active: number;
    pending: number;
  };
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
      <strong>Static Stereo</strong>
      <span>{{ stats.active }} active / {{ stats.total }} songs</span>
    </div>
    <button class="member-button" type="button" :aria-label="`${member.name} 로그아웃`">
      {{ member.avatar }}
    </button>
  </header>
</template>
