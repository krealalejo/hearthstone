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
          :title="isDark ? 'Light mode' : 'Dark mode'"
          @click="toggle($event.currentTarget as Element)"
        >
          <v-icon style="font-size: 18px">{{
            isDark ? "mdi-weather-sunny" : "mdi-weather-night"
          }}</v-icon>
        </button>
        <AppAvatar
          :member="store.me"
          size="md"
          style="cursor: pointer"
          @click="profileOpen = true"
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
const store = useHomeStore();
const route = useRoute();
const profileOpen = ref(false);

useBootstrap();

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Hearthstone",
  inventory: "Inventory",
  shopping: "Shopping",
  "history-purchases": "History",
  "history-weeks": "History",
  household: "Household",
};

const mobileTitle = computed(() => {
  const view = (route.name as string) ?? "dashboard";
  return VIEW_TITLES[view] ?? "Hearth";
});
</script>
