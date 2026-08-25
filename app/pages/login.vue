<template>
  <div class="auth-layout">
    <button
      class="btn btn-ghost btn-icon theme-toggle"
      :title="isDark ? $t('a11y.lightMode') : $t('a11y.darkMode')"
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
          <div class="brand-sub">{{ $t("login.brandSub") }}</div>
        </div>
      </div>
      <div class="auth-quote">
        <h2 style="white-space: pre-line">{{ $t("login.headline") }}</h2>
        <p>{{ $t("login.tagline") }}</p>
      </div>
      <div class="auth-feats">
        <div class="auth-feat">
          <span class="feat-ic"><v-icon>mdi-broom</v-icon></span>
          {{ $t("login.feat1") }}
        </div>
        <div class="auth-feat">
          <span class="feat-ic"><v-icon>mdi-auto-fix</v-icon></span>
          {{ $t("login.feat2") }}
        </div>
        <div class="auth-feat">
          <span class="feat-ic"><v-icon>mdi-account-group</v-icon></span>
          {{ $t("login.feat3") }}
        </div>
      </div>
    </div>

    <div class="auth-form-wrap">
      <div class="auth-form">
        <div class="seg auth-seg" style="width: 100%">
          <button
            :class="{ on: mode === 'login' }"
            style="flex: 1; justify-content: center"
            @click="switchMode('login')"
          >
            {{ $t("login.tabLogin") }}
          </button>
          <button
            :class="{ on: mode === 'signup' }"
            style="flex: 1; justify-content: center"
            @click="switchMode('signup')"
          >
            {{ $t("login.tabSignup") }}
          </button>
        </div>

        <div class="auth-fields-wrap">
          <Transition
            :css="false"
            @before-leave="onBeforeLeave"
            @leave="onLeave"
            @enter="onEnter"
          >
            <div :key="mode" class="auth-fields">
              <h1>
                {{
                  mode === "login"
                    ? $t("login.welcomeBack")
                    : $t("login.createAccount")
                }}
              </h1>
              <p class="lead">
                {{
                  mode === "login"
                    ? $t("login.loginLead")
                    : $t("login.signupLead")
                }}
              </p>

              <div v-if="mode === 'signup'" class="field">
                <label for="auth-name">{{ $t("login.fieldName") }}</label>
                <input
                  id="auth-name"
                  v-model="name"
                  :placeholder="$t('login.namePlaceholder')"
                  :class="{ 'field-error': errors.name }"
                  @blur="touchField('name')"
                  @input="revalidateIfTouched('name')"
                />
                <Transition name="field-msg">
                  <span v-if="errors.name" class="field-msg">{{
                    errors.name
                  }}</span>
                </Transition>
              </div>
              <div class="field">
                <label for="auth-email">{{ $t("login.fieldEmail") }}</label>
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
                <label for="auth-password">{{ $t("login.fieldPassword") }}</label>
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
                  <span :class="{ met: pwChecks.length }">{{ $t("login.pw8chars") }}</span>
                  <span :class="{ met: pwChecks.upper }">{{ $t("login.pwUpper") }}</span>
                  <span :class="{ met: pwChecks.number }">{{ $t("login.pwNumber") }}</span>
                  <span :class="{ met: pwChecks.symbol }">{{ $t("login.pwSymbol") }}</span>
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
                {{ mode === "login" ? $t("login.btnLogin") : $t("login.btnCreate") }}
                <v-icon style="font-size: 17px">mdi-arrow-right</v-icon>
              </button>

              <div
                v-if="mode === 'login'"
                style="text-align: center; margin-top: 10px"
              >
                <button class="forgot-link" @click="forgotOpen = true">
                  {{ $t("login.forgotLink") }}
                </button>
              </div>

              <div class="auth-divider"><span>{{ $t("login.or") }}</span></div>

              <a
                href="/api/auth/google"
                class="btn btn-ghost"
                style="
                  width: 100%;
                  height: 46px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                "
              >
                <v-icon style="font-size: 18px">mdi-google</v-icon>
                {{ $t("login.google") }}
              </a>
            </div>
          </Transition>
        </div>

        <div class="auth-switch">
          {{ mode === "login" ? $t("login.switchNew") : $t("login.switchHave") }}
          <button @click="switchMode(mode === 'login' ? 'signup' : 'login')">
            {{
              mode === "login"
                ? $t("login.switchToSignup")
                : $t("login.switchToLogin")
            }}
          </button>
        </div>

        <div class="auth-legal">
          <NuxtLink to="/privacy">{{ $t("login.privacy") }}</NuxtLink>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="forgotOpen" class="modal-backdrop" @click.self="closeForgot">
          <div
            class="modal-card"
            role="dialog"
            :aria-labelledby="forgotDone ? 'forgot-title-done' : 'forgot-title'"
            aria-modal="true"
          >
            <div v-if="forgotDone" class="modal-done">
              <v-icon
                style="font-size: 36px; color: #2d6a4f; margin-bottom: 10px"
                >mdi-email-check-outline</v-icon
              >
              <h2 id="forgot-title-done">{{ $t("login.forgotDoneTitle") }}</h2>
              <p>{{ $t("login.forgotDoneBody") }}</p>
              <button
                class="btn btn-primary"
                style="width: 100%; height: 42px; margin-top: 16px"
                @click="closeForgot"
              >
                {{ $t("login.forgotDone") }}
              </button>
            </div>
            <template v-else>
              <div class="modal-header">
                <h2 id="forgot-title">{{ $t("login.forgotTitle") }}</h2>
                <button
                  class="btn btn-ghost btn-icon"
                  :aria-label="$t('a11y.close')"
                  @click="closeForgot"
                >
                  <v-icon style="font-size: 18px">mdi-close</v-icon>
                </button>
              </div>
              <p
                style="
                  font-size: 14px;
                  color: var(--ink);
                  opacity: 0.7;
                  margin-bottom: 20px;
                "
              >
                {{ $t("login.forgotBody") }}
              </p>
              <div class="field">
                <label for="forgot-email">{{ $t("login.fieldEmail") }}</label>
                <input
                  id="forgot-email"
                  v-model="forgotEmail"
                  type="email"
                  :class="{ 'field-error': forgotEmailError }"
                  @keyup.enter="sendForgot"
                />
                <Transition name="field-msg">
                  <span v-if="forgotEmailError" class="field-msg">{{
                    forgotEmailError
                  }}</span>
                </Transition>
              </div>
              <div
                v-if="forgotApiError"
                style="
                  color: #bd413f;
                  font-size: 13px;
                  margin-top: 4px;
                  padding: 8px 12px;
                  background: #ffeeeb;
                  border-radius: 8px;
                "
              >
                {{ forgotApiError }}
              </div>
              <button
                class="btn btn-primary"
                style="width: 100%; height: 42px; margin-top: 16px"
                :disabled="forgotLoading"
                @click="sendForgot"
              >
                {{
                  forgotLoading ? $t("login.forgotSending") : $t("login.forgotSend")
                }}
                <v-icon style="font-size: 17px">mdi-arrow-right</v-icon>
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { z } from "zod";
import { useAnimations } from "~/composables/useAnimations";
import { useColorMode } from "~/composables/useColorMode";
import { gsap } from "gsap";

definePageMeta({ layout: "auth" });

const { animateIn } = useAnimations();
const { t } = useI18n();
const { isDark, toggle } = useColorMode();

const mode = ref<"login" | "signup">("login");
const switchDir = ref<1 | -1>(1);

function switchMode(next: "login" | "signup") {
  switchDir.value = next === "signup" ? 1 : -1;
  errors.value = {};
  touched.value = {};
  authError.value = "";
  mode.value = next;
}

function onBeforeLeave(el: Element) {
  const wrap = (el as HTMLElement).parentElement!;
  wrap.style.height = wrap.offsetHeight + "px";
}

function onLeave(el: Element, done: () => void) {
  const h = el as HTMLElement;
  h.style.position = "absolute";
  h.style.top = "0";
  h.style.left = "0";
  h.style.width = "100%";
  h.style.zIndex = "1";
  gsap.to(el, {
    opacity: 0,
    duration: 0.18,
    ease: "power2.in",
    onComplete: done,
  });
}

function onEnter(el: Element, done: () => void) {
  const wrap = (el as HTMLElement).parentElement!;
  gsap.set(el, { opacity: 0 });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const newH = (el as HTMLElement).scrollHeight;
      gsap.to(wrap, { height: newH, duration: 0.28, ease: "power2.out" });
      gsap.to(el, {
        opacity: 1,
        duration: 0.24,
        delay: 0.14,
        ease: "power2.out",
        onComplete: () => {
          wrap.style.height = "auto";
          done();
        },
      });
    });
  });
}
const email = ref("");
const password = ref("");
const name = ref("");
const authError = ref("");
const touched = ref<Record<string, boolean>>({});
const errors = ref<Record<string, string>>({});

const passwordSchema = z
  .string()
  .min(8, t("login.errPw8"))
  .regex(/[A-Z]/, t("login.errPwUpper"))
  .regex(/\d/, t("login.errPwNumber"))
  .regex(/[^A-Za-z0-9]/, t("login.errPwSymbol"));

const pwChecks = computed(() => ({
  length: password.value.length >= 8,
  upper: /[A-Z]/.test(password.value),
  number: /\d/.test(password.value),
  symbol: /[^A-Za-z0-9]/.test(password.value),
}));

function validateFields(): boolean {
  const errs: Record<string, string> = {};

  if (mode.value === "signup") {
    if (!name.value.trim()) errs.name = t("login.errName");
  }

  const emailResult = z
    .string()
    .email(t("login.errEmail"))
    .safeParse(email.value);
  if (!emailResult.success) errs.email = emailResult.error.issues[0]!.message;

  if (mode.value === "signup") {
    const pwResult = passwordSchema.safeParse(password.value);
    if (!pwResult.success) errs.password = pwResult.error.issues[0]!.message;
  } else if (!password.value) {
    errs.password = t("login.errPasswordRequired");
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
      t("login.authFailed");
  }
}

const forgotOpen = ref(false);
const forgotEmail = ref("");
const forgotEmailError = ref("");
const forgotApiError = ref("");
const forgotLoading = ref(false);
const forgotDone = ref(false);

function closeForgot() {
  forgotOpen.value = false;
  forgotEmail.value = "";
  forgotEmailError.value = "";
  forgotApiError.value = "";
  forgotDone.value = false;
}

async function sendForgot() {
  forgotEmailError.value = "";
  forgotApiError.value = "";
  const r = z
    .string()
    .email(t("login.errEmail"))
    .safeParse(forgotEmail.value);
  if (!r.success) {
    forgotEmailError.value = r.error.issues[0]!.message;
    return;
  }
  forgotLoading.value = true;
  try {
    await $fetch("/api/auth/forgot-password", {
      method: "POST",
      body: { email: forgotEmail.value },
    });
    forgotDone.value = true;
  } catch {
    forgotApiError.value = t("login.forgotError");
  } finally {
    forgotLoading.value = false;
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
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0;
  color: var(--ink);
  opacity: 0.5;
  font-size: 12px;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--hairline);
}

.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.auth-fields-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.auth-fields {
  width: 100%;
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

.auth-legal {
  text-align: center;
  margin-top: 14px;
  font-size: 12px;
}

.auth-legal a {
  color: var(--ink);
  opacity: 0.4;
  text-decoration: none;
  transition: opacity 0.15s;
}

.auth-legal a:hover {
  opacity: 0.75;
}

.forgot-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s;
}

.forgot-link:hover {
  opacity: 1;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-card {
  border: none;
  margin: 0;
  background: var(--surface);
  border-radius: 16px;
  padding: 28px 28px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.18));
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.modal-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: translateY(12px) scale(0.97);
  opacity: 0;
}
</style>
