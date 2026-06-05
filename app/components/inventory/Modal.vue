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
        <label for="inv-name">Name</label>
        <input
          id="inv-name"
          v-model="form.name"
          placeholder="e.g. Olive oil"
          autofocus
        />
      </div>
      <div class="field">
        <div class="label">Category</div>
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
          <div class="label">In stock now</div>
          <QuantityStepper :value="form.qty" @change="form.qty = $event" />
        </div>
        <div class="field">
          <div class="label">Min threshold</div>
          <QuantityStepper :value="form.min" @change="form.min = $event" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <div class="label">Restock to</div>
          <QuantityStepper
            :value="form.optimal"
            :min="1"
            @change="form.optimal = $event"
          />
        </div>
        <div class="field">
          <label for="inv-price"
            >Price
            <span style="color: var(--ink-3); font-weight: 400"
              >· optional</span
            ></label
          >
          <div class="price-wrap">
            <span v-if="form.price !== ''" class="price-currency">
              {{ store.household.currency ?? "$" }}
            </span>
            <input
              id="inv-price"
              v-model="form.price"
              class="price-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
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
  price: props.item?.price == null ? "" : props.item.price,
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

<style scoped>
input {
  text-align: center;
}

:deep(.stepper) {
  height: 42px;
  justify-content: space-between;
}
:deep(.stepper button) {
  width: 44px;
  height: 42px;
}

.price-input {
  height: 42px;
  padding: 0 13px;
  border: 1px solid var(--hairline);
  border-radius: 9px;
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
  font-family: var(--font-ui);
  outline: none;
  width: 100%;
  transition: border-color 0.15s;
  -moz-appearance: textfield;
}
.price-input:focus {
  border-color: var(--accent);
}
.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.price-wrap {
  position: relative;
}
.price-currency {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
  pointer-events: none;
}
</style>
