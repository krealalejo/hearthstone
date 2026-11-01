<template>
  <div class="app-shell">
    <AppSidebar @open-profile="profileOpen = true" />
    <div class="main-col">
      <AppTopbar />
      <div class="mobile-top">
        <span class="brand-mark">
          <img src="/favicon.png" alt="Hearthstone" />
        </span>
        <span class="mt-title">Hearthstone</span>
        <span class="mt-spacer" />
        <NotificationBell />
        <button
          class="btn btn-ghost btn-icon"
          :title="isDark ? $t('a11y.lightMode') : $t('a11y.darkMode')"
          :aria-label="isDark ? $t('a11y.lightMode') : $t('a11y.darkMode')"
          @click="toggle($event.currentTarget as Element)"
        >
          <v-icon style="font-size: 18px">{{
            isDark ? "mdi-weather-sunny" : "mdi-weather-night"
          }}</v-icon>
        </button>
        <AppAvatar
          :member="store.me"
          size="md"
          role="button"
          tabindex="0"
          :aria-label="$t('a11y.openProfile')"
          style="cursor: pointer"
          @click="profileOpen = true"
          @keydown.enter="profileOpen = true"
        />
      </div>
      <div class="page-content">
        <slot />
      </div>
    </div>
    <AppTabBar @open-profile="profileOpen = true" />
    <v-dialog v-model="profileOpen" max-width="480" class="qh-dialog">
      <ProfileModal @close="profileOpen = false" />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useHomeStore } from "~/stores/home";
import { useBootstrap } from "~/composables/useBootstrap";
import { useColorMode } from "~/composables/useColorMode";

const { isDark, toggle } = useColorMode();
const store = useHomeStore();
const profileOpen = ref(false);

useBootstrap();
</script>
