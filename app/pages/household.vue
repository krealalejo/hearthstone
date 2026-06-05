<template>
  <div class="content-inner" style="max-width: 760px">
    <div
      class="card"
      style="
        padding: 24px;
        margin-bottom: 22px;
        display: flex;
        align-items: center;
        gap: 18px;
      "
    >
      <span
        class="brand-mark"
        style="width: 56px; height: 56px; font-size: 28px; border-radius: 16px"
      >
        <img src="/favicon.png" alt="Hearthstone" />
      </span>
      <div style="flex: 1">
        <div v-if="editName" style="display: flex; gap: 8px">
          <input
            v-model="hhNameEdit"
            style="
              height: 38px;
              padding: 0 12px;
              border: 1px solid var(--hairline);
              border-radius: 9px;
              background: var(--bg);
              color: var(--ink);
              font-size: 18px;
              font-family: var(--font-display);
              font-weight: 600;
              outline: none;
            "
            autofocus
            @keydown.enter="saveName"
          />
          <button class="btn btn-primary btn-sm" @click="saveName">Save</button>
        </div>
        <div v-else style="display: flex; align-items: center; gap: 10px">
          <h2 style="font-family: var(--font-display); font-size: 26px">
            {{ store.household.name }}
          </h2>
          <button
            v-if="isAdmin"
            class="btn btn-ghost btn-icon btn-sm"
            style="border: 0"
            @click="startEdit"
          >
            <v-icon>mdi-pencil</v-icon>
          </button>
        </div>
        <div style="color: var(--ink-3); font-size: 13.5px; margin-top: 2px">
          {{ store.activeMembers.length }} active member{{
            store.activeMembers.length !== 1 ? "s" : ""
          }}{{
            store.pendingMembers.length
              ? ` · ${store.pendingMembers.length} pending`
              : ""
          }}
          · Household ID
          <code
            style="
              font-family: monospace;
              background: var(--surface-2);
              padding: 1px 6px;
              border-radius: 5px;
            "
            >{{ store.household.id }}-2026</code
          >
        </div>
      </div>
      <button v-if="isAdmin" class="btn btn-primary" @click="inviteOpen = true">
        <v-icon style="font-size: 17px">mdi-account-plus</v-icon>Invite
      </button>
    </div>

    <div class="sec-head">
      <h2>Members</h2>
      <span class="count">{{ store.activeMembers.length }}</span
      ><span class="line" />
    </div>
    <div class="card" style="margin-bottom: 22px">
      <div v-for="m in store.activeMembers" :key="m.id" class="member-row">
        <AppAvatar :member="m" size="lg" />
        <div class="member-meta">
          <div class="member-name">
            {{ m.name }}
            <span v-if="m.role === 'admin'" class="role-tag">Admin</span>
            <span v-if="m.id === store.currentUser" class="you-tag">you</span>
          </div>
          <div class="member-email">{{ m.email }}</div>
        </div>
        <div style="text-align: right; margin-right: 6px">
          <div class="member-xp">{{ m.totalXp.toLocaleString() }} XP</div>
          <div style="font-size: 11.5px; color: var(--ink-3)">
            Level {{ levelInfo(m.totalXp).level }}
          </div>
        </div>
        <button
          v-if="isAdmin && m.id !== store.currentUser && m.role !== 'admin'"
          class="btn btn-ghost btn-icon btn-sm"
          @click="confirmAction = { kind: 'remove', member: m }"
        >
          <v-icon>mdi-dots-vertical</v-icon>
        </button>
        <button
          v-else-if="m.id === store.currentUser && !isAdmin"
          class="btn btn-ghost btn-sm"
          @click="confirmAction = { kind: 'leave', member: m }"
        >
          Leave
        </button>
      </div>
    </div>

    <template v-if="store.pendingMembers.length">
      <div class="sec-head">
        <h2>Pending invitations</h2>
        <span class="count">{{ store.pendingMembers.length }}</span
        ><span class="line" />
      </div>
      <div class="card">
        <div v-for="m in store.pendingMembers" :key="m.id" class="member-row">
          <AppAvatar :member="m" size="lg" />
          <div class="member-meta">
            <div class="member-name">
              {{ m.email }}<span class="pending-tag">Pending</span>
            </div>
            <div class="member-email">
              Invitation sent · awaiting acceptance
            </div>
          </div>
          <button
            v-if="isAdmin"
            class="btn btn-ghost btn-sm"
            @click="store.revoke(m.id)"
          >
            Revoke
          </button>
        </div>
      </div>
    </template>

    <div v-if="!isAdmin" style="margin-top: 28px; text-align: center">
      <button
        class="btn btn-ghost btn-sm"
        style="color: #b94642; border-color: transparent"
        @click="confirmAction = { kind: 'leave', member: store.me }"
      >
        <v-icon style="font-size: 15px">mdi-logout</v-icon>Leave household
      </button>
    </div>

    <HouseholdInviteDialog
      v-model="inviteOpen"
      @invite="store.invite($event)"
    />

    <HouseholdConfirmDialog
      v-model="confirmOpen"
      :action="confirmAction"
      @confirm="doConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Member } from "~/stores/home";
import { useHomeStore } from "~/stores/home";
import { levelInfo } from "~/utils/home";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();
const isAdmin = computed(() => store.me.role === "admin");

const editName = ref(false);
const hhNameEdit = ref(store.household.name);
const inviteOpen = ref(false);
const confirmAction = ref<{ kind: "remove" | "leave"; member: Member } | null>(
  null,
);
const confirmOpen = computed({
  get: () => confirmAction.value !== null,
  set: (v) => {
    if (!v) confirmAction.value = null;
  },
});

function startEdit() {
  hhNameEdit.value = store.household.name;
  editName.value = true;
}

function saveName() {
  store.renameHousehold(hhNameEdit.value.trim() || store.household.name);
  editName.value = false;
}

function doConfirm(action: { kind: "remove" | "leave"; member: Member }) {
  if (action.kind === "leave") {
    store.logout();
    navigateTo("/login");
  } else {
    store.removeMember(action.member.id);
  }
  confirmAction.value = null;
}
</script>
