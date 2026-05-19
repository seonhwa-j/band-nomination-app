<script setup lang="ts">
import { unvotedFilters, type UnvotedFilterKey } from "../../utils/unvotedFilters";

defineProps<{
  activeFilter: UnvotedFilterKey;
  counts: Record<UnvotedFilterKey, number>;
}>();

defineEmits<{
  change: [filter: UnvotedFilterKey];
}>();
</script>

<template>
  <nav class="filter-bar" aria-label="미투표 파트 필터">
    <button
      v-for="filter in unvotedFilters"
      :key="filter.key"
      type="button"
      class="filter-chip"
      :class="{ 'is-active': activeFilter === filter.key }"
      @click="$emit('change', filter.key)"
    >
      <span class="filter-chip__icon">{{ filter.icon }}</span>
      <span>{{ filter.label }}</span>
      <b>{{ counts[filter.key] }}</b>
    </button>
  </nav>
</template>
