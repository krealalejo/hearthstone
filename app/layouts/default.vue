<template>
  <div class="app-shell">
    <AppSidebar @open-profile="profileOpen = true" />
    <div class="main-col">
      <AppTopbar />
      <div class="mobile-top">
        <span class="brand-mark">
          <img src="/favicon.png" alt="Hearthstone" />
        </span>
        <span class="mt-title">{{ mobileTitle }}</span>
        <span class="mt-spacer" />
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
    <AppTabBar />
    <v-dialog v-model="profileOpen" max-width="480" class="qh-dialog">
      <ProfileModal @close="profileOpen = false" />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useHomeStore } from "~/stores/home";
import { useBootstrap } from "~/composables/useBootstrap";
import { useColorMode } from "~/composables/useColorMode";

const { isDark, toggle } = useColorMode();
const { t } = useI18n();
const store = useHomeStore();
const route = useRoute();
const profileOpen = ref(false);

useBootstrap();

const VIEW_TITLE_KEYS: Record<string, string> = {
  inventory: "nav.inventory",
  shopping: "nav.shopping",
  "history-purchases": "nav.history",
  "history-weeks": "nav.history",
  household: "nav.household",
};

const mobileTitle = computed(() => {
  const key = VIEW_TITLE_KEYS[(route.name as string) ?? ""];
  return key ? t(key) : "Hearthstone";
});
</script>
