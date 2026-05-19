<script setup lang="ts">
import { ref } from "vue";
import type { Member } from "../../types/member";

defineProps<{
  members: Member[];
}>();

const emit = defineEmits<{
  enter: [code: string, memberId: string];
}>();

const code = ref("NOMINATION2026");
const memberId = ref("vocal");
const error = ref("");

const submit = () => {
  error.value = "";
  emit("enter", code.value, memberId.value);
  window.setTimeout(() => {
    if (!localStorage.getItem("nomination-member")) {
      error.value = "초대코드를 다시 확인해주세요.";
    }
  }, 80);
};
</script>

<template>
  <main class="gate">
    <section class="gate__panel">
      <div class="brand-mark brand-mark--large" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p class="eyebrow">2026 외부공연 선곡</p>
      <h1>NOMINATION</h1>
      <form class="gate-form" @submit.prevent="submit">
        <label>
          <span>초대코드</span>
          <input v-model="code" autocomplete="off" />
        </label>
        <label>
          <span>닉네임</span>
          <select v-model="memberId">
            <option v-for="member in members" :key="member.id" :value="member.id">
              {{ member.name }} · {{ member.role }}
            </option>
          </select>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-action" type="submit">입장하기</button>
      </form>
    </section>
  </main>
</template>
