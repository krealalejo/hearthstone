<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>Inventory</h2>
      <span class="count"
        >{{ store.inventory.length }} items{{
          store.lowCount ? ` · ${store.lowCount} low` : ""
        }}</span
      >
      <span class="line" />
      <v-btn-toggle
        v-model="tab"
        mandatory
        density="compact"
        variant="outlined"
        rounded="sm"
        class="seg"
      >
        <v-btn value="all" size="small">All</v-btn>
        <v-btn v-for="c in CATS" :key="c.id" :value="c.id" size="small">
          <v-icon :icon="c.icon" size="15" start />
          {{ c.name.split(" ")[0] }}
        </v-btn>
      </v-btn-toggle>
      <v-btn color="primary" size="small" @click="modalItem = {}">
        <v-icon size="15" start>mdi-plus</v-icon>New item
      </v-btn>
    </div>

    <div ref="invListEl">
      <div v-for="c in activeCats" :key="c.id" style="margin-bottom: 26px">
        <div class="room-head" style="margin-bottom: 12px">
          <span class="room-ic"
            ><v-icon style="font-size: 18px">{{ c.icon }}</v-icon></span
          >
          <h3>{{ c.name }}</h3>
          <span class="meta">· {{ catItems(c.id).length }}</span>
        </div>
        <div class="inv-grid">
          <InventoryItem
            v-for="item in catItems(c.id)"
            :key="item.id"
            :item="item"
            @edit="modalItem = { item }"
          />
        </div>
      </div>
    </div>

    <v-dialog v-model="invModalOpen" max-width="480" class="qh-dialog">
      <InventoryModal
        :item="modalItem?.item ?? null"
        @close="modalItem = null"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { InventoryItem } from "~/stores/home";
import { useHomeStore } from "~/stores/home";
import { useAnimations } from "~/composables/useAnimations";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();
const { animateStagger } = useAnimations();

const CATS = [
  { id: "food", name: "Food & Groceries", icon: "mdi-basket" },
  { id: "cleaning", name: "Cleaning Supplies", icon: "mdi-spray" },
  { id: "misc", name: "Miscellaneous", icon: "mdi-package-variant" },
];

const tab = ref("all");
const invListEl = ref<HTMLElement | null>(null);
const modalItem = ref<{ item?: InventoryItem } | null>(null);

watch(tab, async () => {
  await nextTick();
  const items = invListEl.value?.querySelectorAll(".inv-item");
  if (items?.length) animateStagger(items);
});

const invModalOpen = computed({
  get: () => modalItem.value !== null,
  set: (v) => {
    if (!v) modalItem.value = null;
  },
});

const activeCats = computed(() =>
  tab.value === "all" ? CATS : CATS.filter((c) => c.id === tab.value),
);

function catItems(catId: string) {
  return store.inventory.filter((i) => i.cat === catId);
}
</script>
