<template>
  <nav class="tabbar">
    <button
      v-for="nav in NAV"
      :key="nav.id"
      class="tab"
      :class="{ active: route.name === nav.id }"
      :aria-current="route.name === nav.id ? 'page' : undefined"
      @click="router.push('/' + nav.id)"
    >
      <v-icon class="tab-icon">{{
        route.name === nav.id ? nav.iconFill : nav.icon
      }}</v-icon>
      <span v-if="badges[nav.id]" class="tab-badge">{{ badges[nav.id] }}</span>
      {{ nav.label }}
    </button>
    <button
      class="tab tab-more"
      :class="{ active: moreActive }"
      aria-haspopup="dialog"
      :aria-expanded="moreOpen"
      @click="moreOpen = !moreOpen"
    >
      <v-icon class="tab-icon">{{
        moreActive
          ? "mdi-dots-horizontal-circle"
          : "mdi-dots-horizontal-circle-outline"
      }}</v-icon>
      <span v-if="store.pendingMembers.length" class="tab-dot" />
      {{ t("tabs.more") }}
    </button>

    <v-bottom-sheet v-model="moreOpen" class="qh-scrim" :z-index="20">
      <div class="more-sheet">
        <span class="more-handle" />
        <button
          v-for="item in MORE"
          :key="item.id"
          type="button"
          class="plain-button more-item"
          :class="{ active: item.active }"
          @click="openMoreItem(item)"
        >
          <span class="more-ic"
            ><v-icon>{{ item.icon }}</v-icon></span
          >
          <span class="more-text">
            <span class="more-label">{{ item.label }}</span>
            <span class="more-sub">{{ item.sub }}</span>
          </span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          <v-icon class="more-chev">mdi-chevron-right</v-icon>
        </button>
      </div>
    </v-bottom-sheet>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHomeStore } from "~/stores/home";

const store = useHomeStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const moreOpen = ref(false);

const NAV = computed(() => [
  {
    id: "dashboard",
    label: t("tabs.home"),
    icon: "mdi-home-outline",
    iconFill: "mdi-home",
  },
  {
    id: "inventory",
    label: t("tabs.inventory"),
    icon: "mdi-package-variant-closed",
    iconFill: "mdi-package-variant",
  },
  {
    id: "shopping",
    label: t("tabs.shopping"),
    icon: "mdi-cart-outline",
    iconFill: "mdi-cart",
  },
  {
    id: "todos",
    label: t("tabs.todos"),
    icon: "mdi-checkbox-marked-outline",
    iconFill: "mdi-checkbox-marked",
  },
]);

const MORE = computed(() => [
  {
    id: "history-purchases",
    label: t("more.purchases"),
    sub: t("more.purchasesSub"),
    icon: "mdi-receipt-text-outline",
    path: "/history/purchases",
    active: route.name === "history-purchases",
    badge: 0,
  },
  {
    id: "history-weeks",
    label: t("more.weeks"),
    sub: t("more.weeksSub"),
    icon: "mdi-chart-bar",
    path: "/history/weeks",
    active: route.name === "history-weeks",
    badge: 0,
  },
  {
    id: "household",
    label: t("nav.household"),
    sub: t("more.householdSub"),
    icon: "mdi-account-group-outline",
    path: "/household",
    active: route.name === "household",
    badge: store.pendingMembers.length,
  },
  {
    id: "profile",
    label: t("more.profile"),
    sub: t("more.profileSub"),
    icon: "mdi-account-cog-outline",
    path: "/profile",
    active: route.name === "profile",
    badge: 0,
  },
]);

const moreActive = computed(() => MORE.value.some((item) => item.active));

function openMoreItem(item: (typeof MORE.value)[number]) {
  moreOpen.value = false;
  router.push(item.path);
}

watch(
  () => route.path,
  () => {
    moreOpen.value = false;
  },
);

const badges = computed<Record<string, number | undefined>>(() => ({
  shopping: store.shopCount || undefined,
  todos: store.todoCount || undefined,
}));
</script>
