<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    class="qh-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div>
      <div class="modal-head" style="position: relative">
        <h2>Invite a member</h2>
        <p>They'll get a link to join this household</p>
        <div style="position: absolute; top: 0; right: 0">
          <button
            class="btn btn-ghost btn-icon btn-sm"
            style="border: 0"
            @click="emit('update:modelValue', false)"
          >
            <v-icon>mdi-close</v-icon>
          </button>
        </div>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="invite-email">Email address</label>
          <input
            id="invite-email"
            v-model="email"
            type="email"
            placeholder="roommate@email.com"
            autofocus
            @keydown.enter="submit"
          />
        </div>
        <div
          style="
            font-size: 12.5px;
            color: var(--ink-3);
            display: flex;
            gap: 8px;
            align-items: flex-start;
          "
        >
          <v-icon style="font-size: 15px; margin-top: 1px"
            >mdi-information</v-icon
          >
          <span
            >A pending invitation token is generated. The member joins your
            shared tasks, inventory, and lists once they accept.</span
          >
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="emit('update:modelValue', false)">
          Cancel
        </button>
        <button class="btn btn-primary" @click="submit">
          <v-icon style="font-size: 17px">mdi-send</v-icon>Send invite
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  invite: [email: string];
}>();

const email = ref("");

function submit() {
  if (!email.value.trim()) return;
  emit("invite", email.value);
  email.value = "";
  emit("update:modelValue", false);
}
</script>
