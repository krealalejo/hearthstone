<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ t("profile.cardTitle") }}</h2>
      <div style="position: absolute; top: 0; right: 0">
        <button
          class="btn btn-ghost btn-icon btn-sm"
          style="border: 0"
          :aria-label="t('a11y.close')"
          @click="emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </div>
    </div>

    <div class="modal-body" style="gap: 20px">
      <div style="display: flex; align-items: center; gap: 16px">
        <AppAvatar :member="store.me" size="xl" />
        <div style="flex: 1; min-width: 0">
          <div class="profile-name">{{ store.me.name }}</div>
          <div style="color: var(--ink-3); font-size: 12.5px; margin-top: 2px">
            {{ store.me.email }}
          </div>
        </div>
      </div>

      <div class="level-card" style="margin: 0">
        <div class="lv-top">
          <span class="lv-name">{{ lvl.name }}</span>
          <span class="lv-num">{{
            t("profile.level", {
              level: lvl.level,
              into: lvl.into,
              per: lvl.per,
            })
          }}</span>
        </div>
        <ProgressBar :value="lvl.into" :max="lvl.per" />
      </div>
    </div>

    <div class="modal-foot">
      <button class="btn btn-ghost" @click="handleLogout">
        <v-icon style="font-size: 15px">mdi-logout</v-icon
        >{{ t("profile.logout") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useHomeStore } from "~/stores/home";
import { levelInfo } from "~/utils/home";

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const store = useHomeStore();
const lvl = computed(() => levelInfo(store.me.totalXp));

async function handleLogout() {
  await store.logout();
  emit("close");
}
</script>

<style scoped>
.profile-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
