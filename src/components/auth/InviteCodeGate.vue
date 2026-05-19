<script setup lang="ts">
import { ref } from "vue";
import type { BandPart, Member } from "../../types/member";

defineProps<{
  members: Member[];
}>();

const emit = defineEmits<{
  enter: [code: string, payload: { part: BandPart }];
}>();

const code = ref("");
const part = ref<BandPart>("vocal");
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
  emit("enter", code.value, { part: part.value });
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
          <span>파트</span>
          <select v-model="part">
            <option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }} · {{ member.role }}</option>
          </select>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-action" type="submit">시작하기</button>
      </form>
    </section>
  </main>
</template>
