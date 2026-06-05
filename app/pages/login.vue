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
          <input id="auth-name" v-model="name" placeholder="Jordan Lee" />
        </div>
        <div class="field">
          <label for="auth-email">Email</label>
          <input id="auth-email" v-model="email" type="email" />
        </div>
        <div class="field">
          <label for="auth-password">Password</label>
          <input
            id="auth-password"
            v-model="password"
            type="password"
            @keyup.enter="handleAuth"
          />
        </div>

        <div
          v-if="authError"
          style="
            color: oklch(0.55 0.16 25);
            font-size: 13px;
            margin-top: 4px;
            padding: 8px 12px;
            background: oklch(0.97 0.03 25);
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
import { ref, onMounted } from "vue";
import { useAnimations } from "~/composables/useAnimations";
import { gsap } from "gsap";

definePageMeta({ layout: "auth" });

const { animateIn } = useAnimations();

const mode = ref<"login" | "signup">("login");
const email = ref("");
const password = ref("");
const name = ref("");
const authError = ref("");

async function handleAuth() {
  authError.value = "";
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
