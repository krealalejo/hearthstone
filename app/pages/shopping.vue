<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>Shopping list</h2>
      <span class="count"
        >{{ store.shopping.length }} item{{
          store.shopping.length !== 1 ? "s" : ""
        }}
        · {{ autoItems.length }} auto-added</span
      >
      <span class="line" />
    </div>

    <div class="shop-layout">
      <div>
        <div class="shop-add">
          <v-text-field
            v-model="draft"
            placeholder="Add a one-off item…  (e.g. birthday candles)"
            hide-details
            @keydown.enter="addItem"
          />
          <v-btn color="primary" @click="addItem">
            <v-icon size="17" start>mdi-plus</v-icon>Add
          </v-btn>
        </div>

        <div v-if="!store.shopping.length" class="empty">
          <v-icon class="empty-icon">mdi-cart-outline</v-icon>
          <h3>List is empty</h3>
          <p>
            Items appear here automatically when stock runs low, or add your own
            above.
          </p>
        </div>

        <template v-if="autoItems.length">
          <div class="sec-head" style="margin-top: 6px">
            <h2
              style="
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              "
            >
              <v-icon style="color: var(--accent-ink)">mdi-auto-fix</v-icon
              >Auto-restock
            </h2>
            <span class="count">from low inventory</span>
            <span class="line" />
          </div>
          <ShoppingItem
            v-for="item in autoItems"
            :key="item.id"
            :item="item"
            :is-flash="item.id === store.flashShopId"
          />
        </template>

        <template v-if="manualItems.length">
          <div class="sec-head" style="margin-top: 18px">
            <h2
              style="
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              "
            >
              <v-icon style="color: var(--ink-3)">mdi-pencil</v-icon>One-off
              items
            </h2>
            <span class="line" />
          </div>
          <ShoppingItem
            v-for="item in manualItems"
            :key="item.id"
            :item="item"
            :is-flash="item.id === store.flashShopId"
          />
        </template>
      </div>

      <div class="card shop-summary">
        <h3>Checkout</h3>
        <p style="font-size: 12.5px; color: var(--ink-3); margin: 0 0 6px">
          Check off what you bought, then finalize.
        </p>
        <div class="sum-row">
          <span>Items checked</span
          ><span class="v"
            >{{ checkedItems.length }} / {{ store.shopping.length }}</span
          >
        </div>
        <div class="sum-row">
          <span>Will restock inventory</span
          ><span class="v">{{ restockCount }}</span>
        </div>
        <div class="sum-row">
          <span>Priced items</span
          ><span class="v">{{
            checkedItems.filter((i) => i.price != null).length
          }}</span>
        </div>
        <div class="sum-total">
          <span class="tl">Estimated total</span>
          <span class="tv">{{ money(knownTotal) }}</span>
        </div>
        <v-btn
          color="primary"
          block
          style="height: 46px"
          :disabled="!checkedItems.length"
          @click="store.checkout()"
        >
          <v-icon size="17" start>mdi-check-bold</v-icon>Finalize purchase
        </v-btn>
        <div
          v-if="restockCount > 0"
          style="
            font-size: 12px;
            color: var(--accent-ink);
            background: var(--accent-soft);
            padding: 10px 12px;
            border-radius: 10px;
            margin-top: 12px;
            display: flex;
            gap: 8px;
            align-items: flex-start;
          "
        >
          <v-icon style="margin-top: 1px; font-size: 15px">mdi-refresh</v-icon>
          <span
            >{{ restockCount }} item{{ restockCount > 1 ? "s" : "" }} will be
            replenished to their optimal stock level.</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useHomeStore, useMoney } from "~/stores/home";

const { money } = useMoney();

definePageMeta({ middleware: "auth" });

const store = useHomeStore();

const draft = ref("");

const autoItems = computed(() =>
  store.shopping.filter((i) => i.source === "auto"),
);
const manualItems = computed(() =>
  store.shopping.filter((i) => i.source === "manual"),
);
const checkedItems = computed(() => store.shopping.filter((i) => i.checked));
const knownTotal = computed(() =>
  checkedItems.value.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0),
);
const restockCount = computed(
  () => checkedItems.value.filter((i) => i.invId).length,
);

function addItem() {
  store.addManualShop(draft.value);
  draft.value = "";
}
</script>
