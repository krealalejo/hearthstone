<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    class="qh-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="action">
      <div class="modal-head" style="position: relative">
        <h2>
          {{
            action.kind === "leave"
              ? $t("household.leaveTitle")
              : $t("household.removeTitle", {
                  name: action.member.name.split(" ")[0],
                })
          }}
        </h2>
        <p>
          {{
            action.kind === "leave"
              ? $t("household.leaveBody")
              : $t("household.removeBody")
          }}
        </p>
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
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="emit('update:modelValue', false)">
          {{ $t("household.cancel") }}
        </button>
        <button
          class="btn btn-primary"
          style="background: #bd413f"
          @click="emit('confirm', action)"
        >
          {{
            action.kind === "leave"
              ? $t("household.confirmLeave")
              : $t("household.confirmRemove")
          }}
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Member } from "~/stores/home";

defineProps<{
  modelValue: boolean;
  action: { kind: "remove" | "leave"; member: Member } | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [action: { kind: "remove" | "leave"; member: Member }];
}>();
</script>
