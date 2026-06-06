<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>{{ $t("shopping.title") }}</h2>
      <span class="count"
        >{{
          $t(
            "shopping.itemCount",
            { n: store.shopping.length },
            store.shopping.length,
          )
        }}
        ·
        {{
          $t("shopping.autoAdded", { n: autoItems.length }, autoItems.length)
        }}</span
      >
      <span class="line" />
    </div>

    <div class="shop-layout">
      <div>
        <div class="shop-add">
          <v-text-field
            v-model="draft"
            :placeholder="$t('shopping.addPlaceholder')"
            hide-details
            @keydown.enter="addItem"
          />
          <v-btn color="primary" @click="addItem">
            <v-icon size="17" start>mdi-plus</v-icon>{{ $t("shopping.add") }}
          </v-btn>
        </div>

        <div v-if="!store.shopping.length" class="empty">
          <v-icon class="empty-icon">mdi-cart-outline</v-icon>
          <h3>{{ $t("shopping.emptyTitle") }}</h3>
          <p>{{ $t("shopping.emptyBody") }}</p>
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
              >{{ $t("shopping.autoRestock") }}
            </h2>
            <span class="count">{{ $t("shopping.autoRestockSub") }}</span>
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
              <v-icon style="color: var(--ink-3)">mdi-pencil</v-icon
              >{{ $t("shopping.oneOff") }}
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
        <h3>{{ $t("shopping.checkout") }}</h3>
        <p style="font-size: 12.5px; color: var(--ink-3); margin: 0 0 6px">
          {{ $t("shopping.checkoutSub") }}
        </p>
        <div class="sum-row">
          <span>{{ $t("shopping.itemsChecked") }}</span
          ><span class="v"
            >{{ checkedItems.length }} / {{ store.shopping.length }}</span
          >
        </div>
        <div class="sum-row">
          <span>{{ $t("shopping.willRestock") }}</span
          ><span class="v">{{ restockCount }}</span>
        </div>
        <div class="sum-row">
          <span>{{ $t("shopping.pricedItems") }}</span
          ><span class="v">{{
            checkedItems.filter((i) => i.price != null).length
          }}</span>
        </div>
        <div class="sum-total">
          <span class="tl">{{ $t("shopping.estimatedTotal") }}</span>
          <span class="tv">{{ money(knownTotal) }}</span>
        </div>
        <v-btn
          color="primary"
          block
          style="height: 46px"
          :disabled="!checkedItems.length"
          @click="store.checkout()"
        >
          <v-icon size="17" start>mdi-check-bold</v-icon
          >{{ $t("shopping.finalize") }}
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
          <span>{{
            $t("shopping.restockNote", { n: restockCount }, restockCount)
          }}</span>
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
