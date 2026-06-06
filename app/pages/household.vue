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
        <div
          v-if="editName"
          style="display: flex; gap: 8px; align-items: center"
        >
          <v-text-field
            v-model="hhNameEdit"
            autofocus
            hide-details
            style="font-size: 18px"
            @keydown.enter="saveName"
          />
          <v-btn color="primary" size="small" @click="saveName">Save</v-btn>
        </div>
        <div v-else style="display: flex; align-items: center; gap: 10px">
          <h2 style="font-family: var(--font-display); font-size: 26px">
            {{ store.household.name }}
          </h2>
          <v-btn
            v-if="isAdmin"
            icon
            variant="text"
            size="small"
            @click="startEdit"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
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
      <v-btn v-if="isAdmin" color="primary" @click="inviteOpen = true">
        <v-icon size="17" start>mdi-account-plus</v-icon>Invite
      </v-btn>
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
        <v-btn
          v-if="isAdmin && m.id !== store.currentUser && m.role !== 'admin'"
          icon
          variant="text"
          size="small"
          @click="confirmAction = { kind: 'remove', member: m }"
        >
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
        <v-btn
          v-else-if="m.id === store.currentUser && !isAdmin"
          variant="text"
          size="small"
          @click="confirmAction = { kind: 'leave', member: m }"
        >
          Leave
        </v-btn>
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
          <v-btn
            v-if="isAdmin"
            variant="text"
            size="small"
            @click="store.revoke(m.id)"
          >
            Revoke
          </v-btn>
        </div>
      </div>
    </template>

    <div v-if="!isAdmin" style="margin-top: 28px; text-align: center">
      <v-btn
        variant="text"
        color="error"
        size="small"
        @click="confirmAction = { kind: 'leave', member: store.me }"
      >
        <v-icon size="15" start>mdi-logout</v-icon>Leave household
      </v-btn>
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
