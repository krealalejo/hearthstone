<template>
  <div class="topbar">
    <div>
      <h1>{{ title }}</h1>
      <div class="sub">{{ subtitle }}</div>
    </div>
    <div class="topbar-spacer" />
    <div class="week-pill">
      <v-icon style="color: var(--accent-ink); font-size: 15px"
        >mdi-calendar-week</v-icon
      >
      Week {{ store.weekNo }} · 2026
    </div>
    <button
      v-if="route.name === 'dashboard'"
      class="btn btn-ghost btn-sm"
      @click="store.resetWeek()"
    >
      <v-icon style="font-size: 15px">mdi-refresh</v-icon>
      New week
    </button>
    <button
      class="btn btn-ghost btn-icon"
      :title="isDark ? 'Light mode' : 'Dark mode'"
      @click="toggle($event.currentTarget as Element)"
    >
      <v-icon style="font-size: 18px">{{
        isDark ? "mdi-weather-sunny" : "mdi-weather-night"
      }}</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useHomeStore } from "~/stores/home";
import { useColorMode } from "~/composables/useColorMode";

const store = useHomeStore();
const route = useRoute();
const { isDark, toggle } = useColorMode();

const TITLES: Record<string, { h: string; s: string }> = {
  dashboard: { h: "", s: "Here's what your home needs this week" },
  inventory: { h: "Inventory", s: "Track stock across food, cleaning & more" },
  shopping: { h: "Shopping List", s: "Auto-filled when stock runs low" },
  "history-purchases": {
    h: "Purchase History",
    s: "Every finalized shopping trip",
  },
  "history-weeks": { h: "Week Recap", s: "Tasks, purchases & more by week" },
  household: { h: "Household", s: "Members, invites & sharing" },
};

const title = computed(() => {
  const view = route.name as string;
  if (view === "dashboard") return `Hi, ${store.me.name.split(" ")[0]}`;
  return TITLES[view]?.h ?? "";
});

const subtitle = computed(() => TITLES[route.name as string]?.s ?? "");
</script>
