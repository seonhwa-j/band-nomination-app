<script setup lang="ts">
import { ref } from "vue";
import type { AuthLoginPayload, Member } from "../../types/member";

defineProps<{
  members: Member[];
}>();

const emit = defineEmits<{
  enter: [code: string, payload: AuthLoginPayload];
}>();

const code = ref("");
const email = ref("");
const step = ref<"code" | "profile">("code");
const error = ref("");

const verifyCode = () => {
  error.value = "";
  const expectedCode = import.meta.env.VITE_INVITE_CODE || "STATICSTEREO2026";
  if (code.value.trim() !== expectedCode) {
    error.value = "초대 코드를 다시 확인해 주세요.";
    return;
  }
  step.value = "profile";
};

const submit = () => {
  error.value = "";
  if (!email.value.trim()) {
    error.value = "이메일을 입력해 주세요.";
    return;
  }
  emit("enter", code.value, { email: email.value });
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
      <p class="eyebrow">Static Stereo 선곡장</p>
      <h1>NOMINATION</h1>

      <form v-if="step === 'code'" class="gate-form" @submit.prevent="verifyCode">
        <label>
          <span>초대 코드</span>
          <input v-model="code" autocomplete="off" placeholder="초대 코드를 입력하세요" />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-action" type="submit">다음</button>
      </form>

      <form v-else class="gate-form" @submit.prevent="submit">
        <label>
          <span>이메일</span>
          <input v-model="email" autocomplete="email" type="email" placeholder="member@email.com" />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-action" type="submit">로그인 링크 보내기</button>
      </form>
    </section>
  </main>
</template>
