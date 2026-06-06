<template>
  <div class="auth-layout">
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
      <div class="auth-quote">
        <h2>A calmer home,<br />kept together.</h2>
        <p>
          Shared chores, smart inventory, and a shopping list that fills itself
          when you run low.
        </p>
      </div>
      <div class="auth-feats">
        <div class="auth-feat">
          <span class="feat-ic"><v-icon>mdi-broom</v-icon></span>
          Room-by-room tasks with weekly points
        </div>
        <div class="auth-feat">
          <span class="feat-ic"><v-icon>mdi-auto-fix</v-icon></span>
          Inventory that auto-builds your shopping list
        </div>
        <div class="auth-feat">
          <span class="feat-ic"><v-icon>mdi-account-group</v-icon></span>
          One household, everyone in sync
        </div>
      </div>
    </div>

    <div class="auth-form-wrap">
      <div class="auth-form">
        <div class="seg auth-seg" style="width: 100%">
          <button
            :class="{ on: mode === 'login' }"
            style="flex: 1; justify-content: center"
            @click="mode = 'login'"
          >
            Log in
          </button>
          <button
            :class="{ on: mode === 'signup' }"
            style="flex: 1; justify-content: center"
            @click="mode = 'signup'"
          >
            Sign up
          </button>
        </div>

        <h1>{{ mode === "login" ? "Welcome back" : "Create your account" }}</h1>
        <p class="lead">
          {{
            mode === "login"
              ? "Log in to your household dashboard."
              : "Start a household or join one with an invite."
          }}
        </p>

        <div v-if="mode === 'signup'" class="field">
          <label for="auth-name">Full name</label>
          <input
            id="auth-name"
            v-model="name"
            placeholder="Jordan Lee"
            :class="{ 'field-error': errors.name }"
            @blur="touchField('name')"
            @input="revalidateIfTouched('name')"
          />
          <Transition name="field-msg">
            <span v-if="errors.name" class="field-msg">{{ errors.name }}</span>
          </Transition>
        </div>
        <div class="field">
          <label for="auth-email">Email</label>
          <input
            id="auth-email"
            v-model="email"
            type="email"
            :class="{ 'field-error': errors.email }"
            @blur="touchField('email')"
            @input="revalidateIfTouched('email')"
          />
          <Transition name="field-msg">
            <span v-if="errors.email" class="field-msg">{{
              errors.email
            }}</span>
          </Transition>
        </div>
        <div class="field">
          <label for="auth-password">Password</label>
          <input
            id="auth-password"
            v-model="password"
            type="password"
            :class="{ 'field-error': errors.password }"
            @blur="touchField('password')"
            @input="revalidateIfTouched('password')"
            @keyup.enter="handleAuth"
          />
          <Transition name="field-msg">
            <span v-if="errors.password" class="field-msg">{{
              errors.password
            }}</span>
          </Transition>
          <div v-if="mode === 'signup'" class="pw-hints">
            <span :class="{ met: pwChecks.length }">8+ characters</span>
            <span :class="{ met: pwChecks.upper }">1 uppercase</span>
            <span :class="{ met: pwChecks.number }">1 number</span>
            <span :class="{ met: pwChecks.symbol }">1 symbol</span>
          </div>
        </div>

        <div
          v-if="authError"
          style="
            color: #bd413f;
            font-size: 13px;
            margin-top: 4px;
            padding: 8px 12px;
            background: #ffeeeb;
            border-radius: 8px;
          "
        >
          {{ authError }}
        </div>

        <button
          class="btn btn-primary"
          style="width: 100%; height: 46px; margin-top: 8px"
          @click="handleAuth"
        >
          {{ mode === "login" ? "Log in" : "Create account" }}
          <v-icon style="font-size: 17px">mdi-arrow-right</v-icon>
        </button>

        <div class="auth-switch">
          {{ mode === "login" ? "New here? " : "Already have an account? " }}
          <button @click="mode = mode === 'login' ? 'signup' : 'login'">
            {{ mode === "login" ? "Create an account" : "Log in" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { z } from "zod";
import { useAnimations } from "~/composables/useAnimations";
import { gsap } from "gsap";

definePageMeta({ layout: "auth" });

const { animateIn } = useAnimations();

const mode = ref<"login" | "signup">("login");
const email = ref("");
const password = ref("");
const name = ref("");
const authError = ref("");
const touched = ref<Record<string, boolean>>({});
const errors = ref<Record<string, string>>({});

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least 1 uppercase letter")
  .regex(/[0-9]/, "At least 1 number")
  .regex(/[^A-Za-z0-9]/, "At least 1 symbol");

const pwChecks = computed(() => ({
  length: password.value.length >= 8,
  upper: /[A-Z]/.test(password.value),
  number: /[0-9]/.test(password.value),
  symbol: /[^A-Za-z0-9]/.test(password.value),
}));

function validateFields(): boolean {
  const errs: Record<string, string> = {};

  if (mode.value === "signup") {
    if (!name.value.trim()) errs.name = "Name is required";
  }

  const emailResult = z
    .string()
    .email("Invalid email address")
    .safeParse(email.value);
  if (!emailResult.success) errs.email = emailResult.error.issues[0]!.message;

  if (mode.value === "signup") {
    const pwResult = passwordSchema.safeParse(password.value);
    if (!pwResult.success) errs.password = pwResult.error.issues[0]!.message;
  } else if (!password.value) {
    errs.password = "Password is required";
  }

  errors.value = errs;
  return Object.keys(errs).length === 0;
}

function touchField(field: string) {
  touched.value[field] = true;
  validateFields();
}

function revalidateIfTouched(field: string) {
  if (touched.value[field]) validateFields();
}

async function handleAuth() {
  authError.value = "";
  touched.value = { name: true, email: true, password: true };
  if (!validateFields()) return;

  const endpoint =
    mode.value === "login" ? "/api/auth/login" : "/api/auth/register";
  const body =
    mode.value === "login"
      ? { email: email.value, password: password.value }
      : { name: name.value, email: email.value, password: password.value };
  try {
    await $fetch(endpoint, { method: "POST", body });
    await Promise.all([
      gsap.to(".auth-form-wrap", {
        opacity: 0,
        y: -28,
        scale: 0.97,
        duration: 0.38,
        ease: "power2.in",
      }),
      gsap.to(".auth-art", {
        opacity: 0,
        x: -20,
        duration: 0.32,
        delay: 0.04,
        ease: "power2.in",
      }),
    ]);
    await navigateTo("/dashboard");
  } catch (err: unknown) {
    authError.value =
      (err as { statusMessage?: string })?.statusMessage ??
      "Authentication failed";
  }
}

onMounted(() => {
  animateIn(document.querySelector(".auth-form"), { y: 20, duration: 0.4 });
  gsap.from(".auth-art .auth-quote", {
    opacity: 0,
    x: -20,
    duration: 0.5,
    delay: 0.1,
  });
  gsap.from(".auth-feats .auth-feat", {
    opacity: 0,
    x: -12,
    stagger: 0.08,
    duration: 0.35,
    delay: 0.2,
  });
});
</script>

<style scoped>
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
