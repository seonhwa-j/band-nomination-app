<script setup lang="ts">
defineProps<{
  status: "ACTIVE" | "PENDING";
}>();
</script>

<template>
  <span class="status-badge" :class="`status-badge--${status.toLowerCase()}`">{{ status }}</span>
</template>
