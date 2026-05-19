<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  submit: [text: string];
}>();

const text = ref("");

const submit = () => {
  if (!text.value.trim()) return;
  emit("submit", text.value);
  text.value = "";
};
</script>

<template>
  <form class="comment-composer" @submit.prevent="submit">
    <input v-model="text" placeholder="댓글을 입력하세요" />
    <button type="submit">POST</button>
  </form>
</template>
