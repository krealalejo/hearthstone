<template>
  <nav class="tabbar">
    <button
      v-for="nav in NAV"
      :key="nav.id"
      class="tab"
      :class="{ active: route.name === nav.id }"
      @click="router.push('/' + nav.id)"
    >
      <v-icon class="tab-icon">{{
        route.name === nav.id ? nav.iconFill : nav.icon
      }}</v-icon>
      <span v-if="badges[nav.id]" class="tab-badge">{{ badges[nav.id] }}</span>
      {{ nav.label.split(" ")[0] }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHomeStore } from "~/stores/home";

const store = useHomeStore();
const route = useRoute();
const router = useRouter();

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "mdi-view-dashboard-outline",
    iconFill: "mdi-view-dashboard",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "mdi-package-variant-closed",
    iconFill: "mdi-package-variant",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "mdi-cart-outline",
    iconFill: "mdi-cart",
  },
  {
    id: "history",
    label: "History",
    icon: "mdi-receipt-outline",
    iconFill: "mdi-receipt",
  },
  {
    id: "household",
    label: "Household",
    icon: "mdi-account-group-outline",
    iconFill: "mdi-account-group",
  },
];

const badges = computed<Record<string, number | undefined>>(() => ({
  inventory: store.lowCount || undefined,
  shopping: store.shopCount || undefined,
}));
</script>
