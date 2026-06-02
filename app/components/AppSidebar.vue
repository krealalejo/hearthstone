<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark"><v-icon>mdi-home</v-icon></span>
      <div>
        <div class="brand-name">Hearth</div>
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
    <div
      v-for="nav in NAV"
      :key="nav.id"
      class="nav-item"
      :class="{ active: route.name === nav.id }"
      @click="router.push('/' + nav.id)"
    >
      <v-icon style="font-size: 20px; width: 22px; text-align: center">{{
        nav.icon
      }}</v-icon>
      {{ nav.label }}
      <span v-if="badges[nav.id]" class="nav-badge">{{ badges[nav.id] }}</span>
    </div>

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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHomeStore, levelInfo } from "~/stores/home";

const emit = defineEmits<{ "open-profile": [] }>();
const store = useHomeStore();
const route = useRoute();
const router = useRouter();

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "mdi-view-dashboard" },
  { id: "inventory", label: "Inventory", icon: "mdi-package-variant" },
  { id: "shopping", label: "Shopping List", icon: "mdi-cart" },
  { id: "history", label: "History", icon: "mdi-receipt" },
  { id: "household", label: "Household", icon: "mdi-account-group" },
];

const badges = computed<Record<string, number | undefined>>(() => ({
  inventory: store.lowCount || undefined,
  shopping: store.shopCount || undefined,
}));
</script>
