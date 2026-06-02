<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ item ? "Edit item" : "New item" }}</h2>
      <p v-if="!item">Track stock and set a restock threshold</p>
      <div style="position: absolute; top: 0; right: 0">
        <button
          class="btn btn-ghost btn-icon btn-sm"
          style="border: 0"
          @click="emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </div>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Name</label>
        <input v-model="form.name" placeholder="e.g. Olive oil" autofocus />
      </div>
      <div class="field">
        <label>Category</label>
        <div class="pick-grid">
          <button
            v-for="c in CATS"
            :key="c.id"
            class="pick"
            :class="{ on: form.cat === c.id }"
            @click="form.cat = c.id as 'food' | 'cleaning' | 'misc'"
          >
            <v-icon style="font-size: 15px">{{ c.icon }}</v-icon
            >{{ c.name.split(" ")[0] }}
          </button>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>In stock now</label>
          <input v-model.number="form.qty" type="number" min="0" />
        </div>
        <div class="field">
          <label>Min threshold</label>
          <input v-model.number="form.min" type="number" min="0" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Restock to</label>
          <input v-model.number="form.optimal" type="number" min="1" />
        </div>
        <div class="field">
          <label
            >Price
            <span style="color: var(--ink-3); font-weight: 400"
              >· optional</span
            ></label
          >
          <input
            v-model="form.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>
      <div
        style="
          font-size: 12.5px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          background: var(--accent-soft);
          color: var(--accent-ink);
          padding: 11px 13px;
          border-radius: 10px;
        "
      >
        <v-icon style="font-size: 16px; margin-top: 1px">mdi-auto-fix</v-icon>
        <span
          >When stock drops to <b>{{ form.min ?? 0 }}</b> or below, this item is
          added to the shopping list automatically.</span
        >
      </div>
    </div>
    <div class="modal-foot">
      <button
        v-if="item"
        class="btn btn-ghost"
        style="margin-right: auto; color: oklch(0.55 0.15 25)"
        @click="handleDelete"
      >
        <v-icon style="font-size: 15px">mdi-trash-can</v-icon>Delete
      </button>
      <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
      <button
        class="btn btn-primary"
        :disabled="!form.name.trim()"
        @click="handleSave"
      >
        {{ item ? "Save changes" : "Add item" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import type { InventoryItem } from "~/stores/home";
import { useHomeStore } from "~/stores/home";

const props = defineProps<{ item?: InventoryItem | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useHomeStore();

const CATS = [
  { id: "food", name: "Food & Groceries", icon: "mdi-basket" },
  { id: "cleaning", name: "Cleaning Supplies", icon: "mdi-spray" },
  { id: "misc", name: "Miscellaneous", icon: "mdi-package-variant" },
];

const form = reactive<{
  name: string;
  cat: "food" | "cleaning" | "misc";
  qty: number;
  min: number;
  optimal: number;
  price: number | string;
}>({
  name: props.item?.name ?? "",
  cat: props.item?.cat ?? "food",
  qty: props.item?.qty ?? 1,
  min: props.item?.min ?? 1,
  optimal: props.item?.optimal ?? 3,
  price: props.item?.price != null ? props.item.price : "",
});

function handleSave() {
  if (!form.name.trim()) return;
  const opt = Math.max(Number(form.optimal) || 1, Number(form.min) || 0);
  store.saveInv({
    ...(props.item ? { id: props.item.id } : {}),
    name: form.name.trim(),
    cat: form.cat,
    qty: Number(form.qty) || 0,
    min: Number(form.min) || 0,
    optimal: opt,
    price: form.price === "" ? null : Number(form.price),
    icon: props.item?.icon ?? "mdi-package-variant",
  });
  emit("close");
}

function handleDelete() {
  if (props.item) store.deleteInv(props.item.id);
  emit("close");
}
</script>
