<template>
  <div class="inv-item" :class="{ low }">
    <span
      class="inv-ic"
      :style="
        low
          ? {
              background: '#de844f26',
              color: '#994920',
            }
          : {}
      "
    >
      <v-icon style="font-size: 20px">{{ item.icon }}</v-icon>
    </span>
    <button
      type="button"
      class="plain-button inv-body"
      style="cursor: pointer"
      @click="emit('edit')"
    >
      <span class="inv-name">
        {{ item.name }}
        <span v-if="low" class="low-tag">{{ t("badge.low") }}</span>
      </span>
      <span class="inv-meta">min {{ item.min }} · {{ money(item.price) }}</span>
      <span class="inv-thresh">
        <ProgressBar
          :value="item.qty"
          :max="barMax"
          :min-mark="item.min"
          :color="low ? '#dc7b40' : 'var(--accent)'"
        />
      </span>
    </button>
    <QuantityStepper
      :value="item.qty"
      @change="store.setInvQty(item.id, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { InventoryItem } from "~/stores/home";
import { useHomeStore, useMoney } from "~/stores/home";

const { money } = useMoney();

const props = defineProps<{ item: InventoryItem }>();
const emit = defineEmits<{ edit: [] }>();
const store = useHomeStore();
const { t } = useI18n();

const low = computed(() => props.item.qty <= props.item.min);
const barMax = computed(() =>
  Math.max(props.item.optimal, props.item.min + 1, props.item.qty),
);
</script>
