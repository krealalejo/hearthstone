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
        <span
          class="src-badge"
          :class="item.source === 'auto' ? 'src-auto' : 'src-manual'"
        >
          <v-icon style="font-size: 11px">{{
            item.source === "auto" ? "mdi-auto-fix" : "mdi-pencil"
          }}</v-icon>
          {{ item.source === "auto" ? "Auto" : "One-off" }}
        </span>
        <span v-if="item.price != null">{{ money(item.price) }} each</span>
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
import { ref, watch, onMounted } from "vue";
import type { ShoppingItem } from "~/stores/home";
import { useHomeStore, money } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";

const props = defineProps<{ item: ShoppingItem; isFlash?: boolean }>();
const store = useHomeStore();
const { animateShopItemIn } = useAnimations();
const el = ref<HTMLElement | null>(null);

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
