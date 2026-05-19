<script setup lang="ts">
import { computed, ref } from "vue";
import { members } from "../../data/members";
import type { SongComment } from "../../types/comment";

const props = defineProps<{
  comments: SongComment[];
  currentUserId: string;
}>();

const emit = defineEmits<{
  update: [commentId: string, text: string];
  delete: [commentId: string];
}>();

const editingId = ref("");
const draft = ref("");

const sortedComments = computed(() =>
  [...props.comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
);

const getMember = (id: string) => members.find((member) => member.id === id) ?? members[0];
const formatTime = (value: string) => new Intl.RelativeTimeFormat("ko", { numeric: "auto" }).format(Math.round((new Date(value).getTime() - Date.now()) / 60000), "minute");

const startEdit = (comment: SongComment) => {
  editingId.value = comment.id;
  draft.value = comment.text;
};

const saveEdit = (commentId: string) => {
  if (!draft.value.trim()) return;
  emit("update", commentId, draft.value.trim());
  editingId.value = "";
};
</script>

<template>
  <section class="comments">
    <h3>Discussion Timeline</h3>
    <p v-if="!sortedComments.length" class="empty-note">아직 의견이 없습니다.</p>
    <article v-for="comment in sortedComments" :key="comment.id" class="comment-item">
      <span class="avatar">{{ getMember(comment.userId).avatar }}</span>
      <div class="comment-item__body">
        <div class="comment-item__meta">
          <strong>{{ getMember(comment.userId).name }}</strong>
          <time>{{ formatTime(comment.createdAt) }}</time>
        </div>
        <div v-if="editingId === comment.id" class="comment-edit">
          <input v-model="draft" @keyup.enter="saveEdit(comment.id)" />
          <button type="button" @click="saveEdit(comment.id)">저장</button>
        </div>
        <p v-else>{{ comment.text }}</p>
        <div v-if="comment.userId === currentUserId" class="comment-actions">
          <button type="button" @click="startEdit(comment)">수정</button>
          <button type="button" @click="$emit('delete', comment.id)">삭제</button>
        </div>
      </div>
    </article>
  </section>
</template>
