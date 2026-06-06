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
      {{ $t("topbar.week") }} {{ store.weekNo }} · 2026
    </div>
    <button
      v-if="route.name === 'dashboard'"
      class="btn btn-ghost btn-sm"
      @click="store.resetWeek()"
    >
      <v-icon style="font-size: 15px">mdi-refresh</v-icon>
      {{ $t("topbar.newWeek") }}
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
const { t } = useI18n();

const TITLES = computed(() => ({
  dashboard: { h: "", s: t("topbar.dashSub") },
  inventory: { h: t("nav.inventory"), s: t("topbar.inventorySub") },
  shopping: { h: t("nav.shopping"), s: t("topbar.shoppingSub") },
  "history-purchases": {
    h: t("nav.purchases") + " " + t("nav.history"),
    s: t("topbar.histPurchasesSub"),
  },
  "history-weeks": { h: t("history.weeksTitle"), s: t("topbar.histWeeksSub") },
  household: { h: t("nav.household"), s: t("topbar.householdSub") },
}));

const title = computed(() => {
  const view = route.name as string;
  if (view === "dashboard")
    return t("topbar.hiName", { name: store.me.name.split(" ")[0] });
  return TITLES.value[view as keyof typeof TITLES.value]?.h ?? "";
});

const subtitle = computed(
  () => TITLES.value[route.name as keyof typeof TITLES.value]?.s ?? "",
);
</script>
