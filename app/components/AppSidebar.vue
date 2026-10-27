<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark"
        ><img src="/favicon.png" alt="Hearthstone"
      /></span>
      <div>
        <div class="brand-name">Hearthstone</div>
        <div class="brand-sub">{{ $t("login.brandSub") }}</div>
      </div>
    </div>

    <button
      type="button"
      class="plain-button hh-switch"
      @click="router.push('/household')"
    >
      <v-icon style="color: var(--accent-ink); font-size: 17px"
        >mdi-home</v-icon
      >
      <span style="flex: 1; min-width: 0">
        <span class="hh-name">{{ store.household.name }}</span>
        <span class="hh-count">
          {{ store.activeMembers.length }} {{ $t("nav.members") }}
        </span>
      </span>
      <v-icon style="color: var(--ink-3); font-size: 15px"
        >mdi-unfold-more-horizontal</v-icon
      >
    </button>

    <div class="nav-label">{{ $t("nav.menu") }}</div>
    <template v-for="nav in NAV" :key="nav.id">
      <button
        type="button"
        class="plain-button nav-item"
        :aria-expanded="nav.children ? expandedId === nav.id : undefined"
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
      </button>
      <div v-if="nav.children && expandedId === nav.id" class="nav-children">
        <button
          v-for="child in nav.children"
          :key="child.id"
          type="button"
          class="plain-button nav-sub"
          :class="{ active: route.name === child.id }"
          @click="router.push(child.path)"
        >
          {{ child.label }}
        </button>
      </div>
    </template>

    <div class="sidebar-foot">
      <button
        type="button"
        class="plain-button me-card"
        :aria-label="$t('a11y.openProfile')"
        @click="emit('open-profile')"
      >
        <AppAvatar :member="store.me" size="md" />
        <span style="flex: 1; min-width: 0">
          <span class="me-name">{{ store.me.name }}</span>
          <span class="me-role">
            {{
              $t("household.level", { n: levelInfo(store.me.totalXp).level })
            }}
            · {{ store.me.totalXp.toLocaleString() }} XP
          </span>
        </span>
        <v-icon style="color: var(--ink-3); font-size: 18px">mdi-cog</v-icon>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHomeStore } from "~/stores/home";
import { levelInfo } from "~/utils/home";

const emit = defineEmits<{ "open-profile": [] }>();
const store = useHomeStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

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

const NAV = computed(() => [
  { id: "dashboard", label: t("nav.dashboard"), icon: "mdi-view-dashboard" },
  { id: "inventory", label: t("nav.inventory"), icon: "mdi-package-variant" },
  { id: "shopping", label: t("nav.shopping"), icon: "mdi-cart" },
  { id: "todos", label: t("nav.todos"), icon: "mdi-checkbox-marked-outline" },
  {
    id: "history",
    label: t("nav.history"),
    icon: "mdi-receipt-text-outline",
    path: "/history/purchases",
    children: [
      {
        id: "history-purchases",
        label: t("history.purchasesTab"),
        path: "/history/purchases",
      },
      {
        id: "history-weeks",
        label: t("history.weeksTab"),
        path: "/history/weeks",
      },
    ],
  },
  { id: "household", label: t("nav.household"), icon: "mdi-account-group" },
]);

function onNavClick(nav: (typeof NAV.value)[number]) {
  const { id } = nav;
  if (nav.children) {
    expandedId.value = expandedId.value === id ? null : id;
    if (expandedId.value) router.push(nav.path ?? "/" + id);
  } else {
    router.push(nav.path ?? "/" + id);
  }
}

const badges = computed<Record<string, number | undefined>>(() => ({
  inventory: store.lowCount || undefined,
  shopping: store.shopCount || undefined,
  todos: store.todoCount || undefined,
}));
</script>
