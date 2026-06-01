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
      <div class="seg">
        <button :class="{ on: tab === 'all' }" @click="tab = 'all'">All</button>
        <button
          v-for="c in CATS"
          :key="c.id"
          :class="{ on: tab === c.id }"
          @click="tab = c.id"
        >
          <v-icon style="font-size: 15px">{{ c.icon }}</v-icon
          >{{ c.name.split(" ")[0] }}
        </button>
      </div>
      <button class="btn btn-primary btn-sm" @click="modalItem = {}">
        <v-icon style="font-size: 15px">mdi-plus</v-icon>New item
      </button>
    </div>

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

    <v-dialog v-model="invModalOpen" max-width="480" class="qh-dialog">
      <InventoryModal
        :item="modalItem?.item ?? null"
        @close="modalItem = null"
      />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { InventoryItem } from "~/stores/home";
import { useHomeStore } from "~/stores/home";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();

await useAsyncData("inventory", async () => {
  const data = await $fetch<InventoryItem[]>("/api/inventory");
  store.setInventory(data);
  return data;
});

const CATS = [
  { id: "food", name: "Food & Groceries", icon: "mdi-basket" },
  { id: "cleaning", name: "Cleaning Supplies", icon: "mdi-spray" },
  { id: "misc", name: "Miscellaneous", icon: "mdi-package-variant" },
];

const tab = ref("all");
const modalItem = ref<{ item?: InventoryItem } | null>(null);

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
