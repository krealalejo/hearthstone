<template>
  <div
    ref="el"
    class="shop-item"
    :class="{ checked: item.checked, flash: isFlash }"
  >
    <button
      class="check"
      :class="{ done: item.checked }"
      aria-label="toggle"
      @click="store.toggleShop(item.id)"
    >
      <v-icon v-if="item.checked" style="font-size: 15px"
        >mdi-check-bold</v-icon
      >
    </button>
    <div class="shop-body">
      <div class="shop-name">{{ item.name }}</div>
      <div class="shop-sub">
        <span class="src-badge" :class="badgeClass">
          <v-icon style="font-size: 11px">{{ badgeIcon }}</v-icon>
          {{ badgeLabel }}
        </span>
        <span v-if="!editable" class="item-price">{{ money(item.price) }}</span>
        <span v-else class="price-editable">
          <input
            class="item-price"
            type="text"
            inputmode="decimal"
            v-model="localPrice"
            @focus="onFocus"
            @blur="onBlur"
          />
          <span class="item-price">{{ currency }}</span>
        </span>
      </div>
    </div>
    <QuantityStepper
      :value="item.qty"
      :min="1"
      @change="store.setShopQty(item.id, $event)"
    />
    <button
      class="btn btn-ghost btn-icon btn-sm"
      style="border: 0"
      aria-label="remove"
      @click="store.removeShop(item.id)"
    >
      <v-icon>mdi-close</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import type { ShoppingItem } from "~/stores/home";
import { useHomeStore, useMoney } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";

const props = defineProps<{
  item: ShoppingItem;
  isFlash?: boolean;
  priceEditable?: boolean;
}>();

const store = useHomeStore();
const { money } = useMoney();
const { animateShopItemIn } = useAnimations();
const el = ref<HTMLElement | null>(null);

const editable = computed(
  () => props.priceEditable ?? props.item.source === "manual",
);
const badgeClass = computed(() =>
  props.item.source === "auto" ? "src-auto" : "src-manual",
);
const badgeIcon = computed(() =>
  props.item.source === "auto" ? "mdi-auto-fix" : "mdi-pencil",
);
const badgeLabel = computed(() =>
  props.item.source === "auto" ? "Auto" : "One-off",
);
const currency = computed(() => store.household.currency ?? "$");

function fmt(p: number | null) {
  return (p ?? 0).toFixed(2);
}

const localPrice = ref(fmt(props.item.price));

watch(
  () => props.item.price,
  (p) => {
    localPrice.value = fmt(p);
  },
);

function onFocus(e: FocusEvent) {
  const val = props.item.price ?? 0;
  localPrice.value = val === 0 ? "" : String(val);
  nextTick(() => (e.target as HTMLInputElement).select());
}

function onBlur() {
  const val = Number(localPrice.value) || 0;
  store.setShopPrice(props.item.id, val);
  localPrice.value = fmt(val);
}

onMounted(() => {
  if (props.isFlash) animateShopItemIn(el.value);
});

watch(
  () => props.isFlash,
  (v) => {
    if (v) animateShopItemIn(el.value);
  },
);
</script>

<style scoped>
.item-price {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.price-editable {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

input.item-price {
  background: transparent;
  border: none;
  outline: none;
  width: 40px;
  padding: 0;
  font-family: var(--font-ui);
  text-align: left;
}

input.item-price::placeholder {
  opacity: 0.5;
}
</style>
