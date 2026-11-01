<template>
  <v-menu
    v-model="open"
    location="bottom center"
    content-class="bell-menu"
    :close-on-content-click="false"
    offset="8"
  >
    <template #activator="{ props: activator }">
      <button
        v-bind="activator"
        class="btn btn-ghost btn-icon bell"
        :title="$t('notifications.open')"
        :aria-label="$t('notifications.open')"
      >
        <v-icon style="font-size: 18px">mdi-bell-outline</v-icon>
        <span v-if="store.unreadNotifications" class="nav-badge bell-badge">{{
          store.unreadNotifications
        }}</span>
      </button>
    </template>
    <div class="bell-panel">
      <div class="bell-head">{{ $t("notifications.title") }}</div>
      <div v-if="!store.notifications.length" class="bell-empty">
        {{ $t("notifications.empty") }}
      </div>
      <ul v-else class="bell-list">
        <li v-for="n in store.notifications" :key="n.id">
          <button
            class="plain-button bell-item"
            :class="{ unread: unreadIds.has(n.id) }"
            @click="openItem"
          >
            <span class="bell-title">{{
              $t("notifications.weekReminder.title")
            }}</span>
            <span class="bell-body">{{ body(n) }}</span>
            <span class="bell-date">{{ date(n.createdAt) }}</span>
          </button>
        </li>
      </ul>
      <div v-if="push.supported" class="bell-push">
        <v-switch
          :model-value="push.enabled.value"
          :label="$t('notifications.push')"
          :loading="push.busy.value"
          :disabled="push.busy.value"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="togglePush"
        />
      </div>
    </div>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useHomeStore, type AppNotification } from "~/stores/home";
import { usePushNotifications } from "~/composables/usePushNotifications";

const store = useHomeStore();
const { t, locale } = useI18n();
const push = usePushNotifications();
const open = ref(false);
const unreadIds = ref(new Set<string>());

watch(open, (isOpen) => {
  if (!isOpen) return;
  unreadIds.value = new Set(
    store.notifications.filter((n) => !n.readAt).map((n) => n.id),
  );
  store.markNotificationsRead();
});

function body(n: AppNotification): string {
  const parts = [];
  if (n.data.mine)
    parts.push(
      t("notifications.weekReminder.mine", { n: n.data.mine }, n.data.mine),
    );
  if (n.data.unassigned)
    parts.push(
      t(
        "notifications.weekReminder.unassigned",
        { n: n.data.unassigned },
        n.data.unassigned,
      ),
    );
  return parts.join(" · ");
}

function date(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function openItem() {
  open.value = false;
  navigateTo("/todos");
}

async function togglePush() {
  try {
    const result = await push.toggle();
    if (result === "denied") {
      store._toast({ kind: "info", title: t("notifications.pushDenied") });
    }
  } catch {
    store._toast({ kind: "info", title: t("notifications.pushFailed") });
  }
}
</script>

<style scoped>
.bell {
  position: relative;
}
.bell-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  font-size: 10.5px;
  padding: 0 5px;
}
.bell-panel {
  width: min(340px, calc(100vw - 32px));
  max-height: 70vh;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  color: var(--ink);
}
.bell-head {
  padding: 14px 16px 10px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--hairline);
}
.bell-empty {
  padding: 22px 16px;
  color: var(--ink-3);
  font-size: 13.5px;
  text-align: center;
}
.bell-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
.bell-item {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 10px 16px 10px 22px;
  text-align: left;
  position: relative;
}
.bell-item:hover {
  background: var(--surface-2);
}
.bell-item.unread::before {
  content: "";
  position: absolute;
  left: 9px;
  top: 16px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
}
.bell-title {
  font-weight: 600;
  font-size: 14px;
}
.bell-body {
  color: var(--ink-2);
  font-size: 13px;
}
.bell-date {
  color: var(--ink-3);
  font-size: 12px;
}
.bell-push {
  padding: 4px 16px 8px;
  border-top: 1px solid var(--hairline);
}
</style>

<style>
@media (max-width: 860px) {
  .bell-menu.v-overlay__content {
    left: 0 !important;
    right: 0 !important;
    margin-inline: auto;
    width: min(340px, calc(100vw - 32px));
    max-width: none !important;
  }
}
</style>
