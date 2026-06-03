<template>
  <div>
    <nav class="hist-sub-tabs">
      <NuxtLink
        to="/history/purchases"
        class="hist-sub-tab"
        :class="{
          active:
            route.path.endsWith('/purchases') || route.path === '/history',
        }"
      >
        <v-icon style="font-size: 16px">mdi-receipt-outline</v-icon>
        Purchases
      </NuxtLink>
      <NuxtLink
        to="/history/weeks"
        class="hist-sub-tab"
        :class="{ active: route.path.endsWith('/weeks') }"
      >
        <v-icon style="font-size: 16px">mdi-calendar-week</v-icon>
        Weeks
      </NuxtLink>
    </nav>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

definePageMeta({ middleware: "auth" });

const route = useRoute();
</script>
