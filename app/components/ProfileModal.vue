<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>Profile & settings</h2>
      <div style="position: absolute; top: 0; right: 0">
        <button
          class="btn btn-ghost btn-icon btn-sm"
          style="border: 0"
          @click="emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </div>
    </div>
    <div class="modal-body">
      <div style="display: flex; align-items: center; gap: 14px">
        <AppAvatar :member="store.me" size="xl" />
        <div>
          <div
            style="
              font-family: var(--font-display);
              font-size: 20px;
              font-weight: 600;
            "
          >
            {{ store.me.name }}
          </div>
          <div style="color: var(--ink-3); font-size: 13px">
            {{ store.me.email }}
          </div>
        </div>
      </div>
      <div class="level-card" style="margin: 0">
        <div class="lv-top">
          <span class="lv-name">{{ lvl.name }}</span>
          <span class="lv-num"
            >Level {{ lvl.level }} · {{ lvl.into }}/{{ lvl.per }} XP</span
          >
        </div>
        <ProgressBar :value="lvl.into" :max="lvl.per" />
      </div>
      <div class="field">
        <label
          >Viewing as
          <span style="color: var(--ink-3); font-weight: 400"
            >· demo helper to preview other members</span
          ></label
        >
        <div class="pick-grid">
          <button
            v-for="m in store.activeMembers"
            :key="m.id"
            class="pick"
            :class="{ on: store.currentUserId === m.id }"
            @click="
              store.setCurrentUser({ id: m.id, name: m.name, role: m.role })
            "
          >
            <AppAvatar :member="m" size="sm" />{{ m.name.split(" ")[0] }}
          </button>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button
        class="btn btn-ghost"
        style="margin-right: auto"
        @click="handleReset"
      >
        <v-icon style="font-size: 15px">mdi-refresh</v-icon>Reset demo
      </button>
      <button class="btn btn-ghost" @click="handleLogout">
        <v-icon style="font-size: 15px">mdi-logout</v-icon>Log out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useHomeStore, levelInfo } from "~/stores/home";

const emit = defineEmits<{ close: [] }>();
const store = useHomeStore();
const lvl = computed(() => levelInfo(store.me.totalXp));

async function handleReset() {
  await store.logout();
  emit("close");
  await navigateTo("/auth");
}
async function handleLogout() {
  await store.logout();
  emit("close");
  await navigateTo("/auth");
}
</script>
