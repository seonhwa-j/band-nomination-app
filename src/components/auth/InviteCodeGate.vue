<script setup lang="ts">
import { ref } from "vue";
import type { AuthLoginPayload } from "../../types/member";

const emit = defineEmits<{
  enter: [payload: AuthLoginPayload];
}>();

const email = ref("");
const password = ref("");
const error = ref("");

const submit = () => {
  error.value = "";
  if (!email.value.trim()) {
    error.value = "Please enter your email.";
    return;
  }
  if (!password.value.trim()) {
    error.value = "Please enter your password.";
    return;
  }
  emit("enter", { email: email.value, password: password.value });
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
      <p class="eyebrow">Static Stereo Members</p>
      <h1>NOMINATION</h1>

      <form class="gate-form" @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input v-model="email" autocomplete="email" type="email" placeholder="member@email.com" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" autocomplete="current-password" type="password" placeholder="Temporary or personal password" />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-action" type="submit">Log in</button>
      </form>
    </section>
  </main>
</template>
