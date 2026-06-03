<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark"
        ><img src="~/public/favicon.png" alt="Hearthstone"
      /></span>
      <div>
        <div class="brand-name">Hearthstone</div>
        <div class="brand-sub">calm home, shared</div>
      </div>
    </div>

    <div class="hh-switch" @click="router.push('/household')">
      <v-icon style="color: var(--accent-ink); font-size: 17px"
        >mdi-home</v-icon
      >
      <div style="flex: 1; min-width: 0">
        <div class="hh-name">{{ store.household.name }}</div>
        <div class="hh-count">{{ store.activeMembers.length }} members</div>
      </div>
      <v-icon style="color: var(--ink-3); font-size: 15px"
        >mdi-unfold-more-horizontal</v-icon
      >
    </div>

    <div class="nav-label">Menu</div>
    <template v-for="nav in NAV" :key="nav.id">
      <div
        class="nav-item"
        :class="{
          active: nav.children
            ? route.path.startsWith('/' + nav.id)
            : route.name === nav.id,
        }"
        @click="onNavClick(nav)"
      >
        <v-icon style="font-size: 20px; width: 22px; text-align: center">{{
          nav.icon
        }}</v-icon>
        {{ nav.label }}
        <span v-if="badges[nav.id]" class="nav-badge">{{
          badges[nav.id]
        }}</span>
        <v-icon
          v-if="nav.children"
          style="
            font-size: 14px;
            margin-left: auto;
            color: var(--ink-3);
            transition: transform 0.2s var(--ease);
          "
          :style="{
            transform:
              expandedId === nav.id ? 'rotate(180deg)' : 'rotate(0deg)',
          }"
          >mdi-chevron-down</v-icon
        >
      </div>
      <div v-if="nav.children && expandedId === nav.id" class="nav-children">
        <div
          v-for="child in nav.children"
          :key="child.id"
          class="nav-sub"
          :class="{ active: route.name === child.id }"
          @click="router.push(child.path)"
        >
          {{ child.label }}
        </div>
      </div>
    </template>

    <div class="sidebar-foot">
      <div class="me-card" @click="emit('open-profile')">
        <AppAvatar :member="store.me" size="md" />
        <div style="flex: 1; min-width: 0">
          <div class="me-name">{{ store.me.name }}</div>
          <div class="me-role">
            Level {{ levelInfo(store.me.totalXp).level }} ·
            {{ store.me.totalXp.toLocaleString() }} XP
          </div>
        </div>
        <v-icon style="color: var(--ink-3); font-size: 18px">mdi-cog</v-icon>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHomeStore, levelInfo } from "~/stores/home";

const emit = defineEmits<{ "open-profile": [] }>();
const store = useHomeStore();
const route = useRoute();
const router = useRouter();

const expandedId = ref<string | null>(
  route.path.startsWith("/history") ? "history" : null,
);

watch(
  () => route.path,
  (path) => {
    if (path.startsWith("/history") && expandedId.value !== "history") {
      expandedId.value = "history";
    }
  },
);

function onNavClick(nav: (typeof NAV)[number]) {
  const { id } = nav;
  if (nav.children) {
    expandedId.value = expandedId.value === id ? null : id;
    if (expandedId.value) router.push(nav.path ?? "/" + id);
  } else {
    router.push(nav.path ?? "/" + id);
  }
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "mdi-view-dashboard" },
  { id: "inventory", label: "Inventory", icon: "mdi-package-variant" },
  { id: "shopping", label: "Shopping List", icon: "mdi-cart" },
  {
    id: "history",
    label: "History",
    icon: "mdi-receipt-text-outline",
    path: "/history/purchases",
    children: [
      {
        id: "history-purchases",
        label: "Purchases",
        path: "/history/purchases",
      },
      { id: "history-weeks", label: "Weeks", path: "/history/weeks" },
    ],
  },
  { id: "household", label: "Household", icon: "mdi-account-group" },
];

const badges = computed<Record<string, number | undefined>>(() => ({
  inventory: store.lowCount || undefined,
  shopping: store.shopCount || undefined,
}));
</script>
