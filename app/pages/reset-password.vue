<template>
  <div class="auth-layout">
    <button
      class="btn btn-ghost btn-icon theme-toggle"
      :title="isDark ? 'Light mode' : 'Dark mode'"
      @click="toggle($event.currentTarget as Element)"
    >
      <v-icon style="font-size: 18px">{{
        isDark ? "mdi-weather-sunny" : "mdi-weather-night"
      }}</v-icon>
    </button>

    <div class="auth-art">
      <span class="glow" />
      <span class="glow two" />
      <div class="auth-brand">
        <span class="brand-mark"
          ><img src="/favicon.png" alt="Hearthstone"
        /></span>
        <div>
          <div class="brand-name">Hearthstone</div>
          <div class="brand-sub">calm home, shared</div>
        </div>
      </div>
    </div>

    <div class="auth-form-wrap">
      <div class="auth-form">
        <div v-if="done" class="reset-done">
          <v-icon style="font-size: 40px; color: #2d6a4f; margin-bottom: 12px"
            >mdi-check-circle-outline</v-icon
          >
          <h1>Password updated</h1>
          <p class="lead">You can now log in with your new password.</p>
          <NuxtLink
            to="/login"
            class="btn btn-primary"
            style="
              width: 100%;
              height: 46px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-top: 16px;
            "
          >
            Go to login
            <v-icon style="font-size: 17px">mdi-arrow-right</v-icon>
          </NuxtLink>
        </div>

        <template v-else>
          <h1>Set new password</h1>
          <p class="lead">Enter a new password for your account.</p>

          <div class="field" style="margin-top: 20px">
            <label for="rp-password">New password</label>
            <input
              id="rp-password"
              v-model="password"
              type="password"
              :class="{ 'field-error': errors.password }"
              @blur="
                touched.password = true;
                validate();
              "
              @input="if (touched.password) validate();"
            />
            <Transition name="field-msg">
              <span v-if="errors.password" class="field-msg">{{
                errors.password
              }}</span>
            </Transition>
            <div class="pw-hints">
              <span :class="{ met: pwChecks.length }">8+ characters</span>
              <span :class="{ met: pwChecks.upper }">1 uppercase</span>
              <span :class="{ met: pwChecks.number }">1 number</span>
              <span :class="{ met: pwChecks.symbol }">1 symbol</span>
            </div>
          </div>

          <div
            v-if="apiError"
            style="
              color: #bd413f;
              font-size: 13px;
              margin-top: 4px;
              padding: 8px 12px;
              background: #ffeeeb;
              border-radius: 8px;
            "
          >
            {{ apiError }}
          </div>

          <button
            class="btn btn-primary"
            style="width: 100%; height: 46px; margin-top: 16px"
            :disabled="loading"
            @click="submit"
          >
            {{ loading ? "Saving…" : "Set password" }}
            <v-icon style="font-size: 17px">mdi-arrow-right</v-icon>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { z } from "zod";
import { useColorMode } from "~/composables/useColorMode";

definePageMeta({ layout: "auth" });

const { isDark, toggle } = useColorMode();
const route = useRoute();

const password = ref("");
const loading = ref(false);
const done = ref(false);
const apiError = ref("");
const touched = ref({ password: false });
const errors = ref<Record<string, string>>({});

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least 1 uppercase letter")
  .regex(/\d/, "At least 1 number")
  .regex(/[^A-Za-z0-9]/, "At least 1 symbol");

const pwChecks = computed(() => ({
  length: password.value.length >= 8,
  upper: /[A-Z]/.test(password.value),
  number: /\d/.test(password.value),
  symbol: /[^A-Za-z0-9]/.test(password.value),
}));

function validate() {
  const r = passwordSchema.safeParse(password.value);
  errors.value.password = r.success ? "" : r.error.issues[0]!.message;
  return r.success;
}

async function submit() {
  touched.value.password = true;
  if (!validate()) return;

  const token = route.query.token as string;
  if (!token) {
    apiError.value = "Reset link is invalid";
    return;
  }

  loading.value = true;
  apiError.value = "";
  try {
    await $fetch("/api/auth/reset-password", {
      method: "POST",
      body: { token, password: password.value },
    });
    done.value = true;
  } catch (err: unknown) {
    apiError.value =
      (err as { statusMessage?: string })?.statusMessage ??
      "Something went wrong";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.reset-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0;
}

.field-msg {
  display: block;
  font-size: 12px;
  color: #bd413f;
  margin-top: 3px;
  overflow: hidden;
}

.field-msg-enter-active,
.field-msg-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    max-height 0.18s ease;
  max-height: 40px;
}

.field-msg-enter-from,
.field-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}

input.field-error {
  border-color: #bd413f;
  outline-color: #bd413f;
}

.pw-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.pw-hints span {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--hairline);
  color: var(--ink);
  opacity: 0.55;
  transition:
    opacity 0.15s,
    background 0.15s;
}

.pw-hints span.met {
  background: #d4edda;
  color: #1a5c2a;
  opacity: 1;
}
</style>
