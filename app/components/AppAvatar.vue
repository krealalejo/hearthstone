<template>
  <div
    class="avatar"
    :class="size"
    :style="{ background: bgColor }"
    :title="member?.name || member?.email || ''"
  >
    <template v-if="!member">
      <v-icon style="font-size: 0.9em; color: var(--ink-3)">mdi-account</v-icon>
    </template>
    <template v-else-if="member.avatarImage">
      <img
        :src="`/avatars/${member.avatarImage}`"
        :alt="member.name"
        style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
        "
      />
    </template>
    <template v-else-if="member.avatarEmoji">
      <span style="line-height: 1">{{ member.avatarEmoji }}</span>
    </template>
    <template v-else-if="member.name">
      {{ initials(member.name) }}
    </template>
    <template v-else>
      <v-icon style="font-size: 0.85em">mdi-email-outline</v-icon>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Member } from "~/stores/home";
import { memberColor } from "~/stores/home";

const props = withDefaults(
  defineProps<{
    member?: Member | null;
    size?: "sm" | "md" | "lg" | "xl";
  }>(),
  { size: "md", member: null },
);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

const bgColor = computed(() => {
  if (!props.member) return "var(--surface-2)";
  if (props.member.avatarImage) return "transparent";
  return props.member.accentColor || memberColor(props.member.id);
});
</script>
