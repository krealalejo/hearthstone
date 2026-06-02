<template>
  <div class="app-shell">
    <AppSidebar @open-profile="profileOpen = true" />
    <div class="main-col">
      <AppTopbar />
      <div class="mobile-top">
        <span class="brand-mark">
          <v-icon>mdi-home</v-icon>
        </span>
        <span class="mt-title">{{ mobileTitle }}</span>
        <span class="mt-spacer" />
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

const store = useHomeStore();
const route = useRoute();
const profileOpen = ref(false);

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Hearth",
  inventory: "Inventory",
  shopping: "Shopping",
  history: "History",
  household: "Household",
};

const mobileTitle = computed(() => {
  const view = (route.name as string) ?? "dashboard";
  return VIEW_TITLES[view] ?? "Hearth";
});
</script>
