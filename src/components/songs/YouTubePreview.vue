<script setup lang="ts">
import { computed } from "vue";
import { getYouTubeEmbedUrl, isYouTubeUrl } from "../../utils/youtube";

const props = defineProps<{
  link: string;
}>();

const embedUrl = computed(() => getYouTubeEmbedUrl(props.link));
</script>

<template>
  <div class="youtube-preview">
    <iframe
      v-if="isYouTubeUrl(link)"
      :src="embedUrl"
      title="YouTube player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
    <div v-else class="youtube-preview__fallback">
      <strong>YouTube 링크 확인 필요</strong>
      <span>{{ link || "등록된 링크가 없습니다." }}</span>
    </div>
  </div>
</template>
