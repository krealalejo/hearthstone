<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>Purchase history</h2>
      <span class="count"
        >{{ store.history.length }} trips ·
        {{ money(grandTotal) }} all-time</span
      >
      <span class="line" />
    </div>

    <div v-if="!store.history.length" class="empty">
      <v-icon class="empty-icon">mdi-receipt</v-icon>
      <h3>No purchases yet</h3>
      <p>
        Finalize a shopping list and it will be archived here with the date,
        items, and total spend.
      </p>
    </div>

    <div v-for="h in store.history" :key="h.id" class="card hist-item">
      <div class="hist-top">
        <span
          class="room-ic"
          style="background: var(--surface-2); color: var(--ink-2)"
        >
          <v-icon style="font-size: 18px">mdi-receipt</v-icon>
        </span>
        <div>
          <div class="hist-date">{{ fmt(h.date) }}</div>
          <div class="hist-sub">
            {{ h.items.length }} item{{ h.items.length !== 1 ? "s" : "" }} ·
            {{ h.items.reduce((s, i) => s + i.qty, 0) }} units
          </div>
        </div>
        <div class="hist-total">
          <div class="tv">{{ money(h.total) }}</div>
          <div class="tl">total spend</div>
        </div>
      </div>
      <div class="hist-goods">
        <span v-for="(it, i) in h.items" :key="i" class="good-chip">
          {{ it.name
          }}<span class="q"
            >×{{ it.qty
            }}{{
              it.price != null ? ` · ${money(it.price * it.qty)}` : ""
            }}</span
          >
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useHomeStore, money } from "~/stores/home";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();
const headers = useRequestHeaders(["cookie"]);

await useAsyncData("history", async () => {
  const data = await $fetch<import("~/stores/home").HistoryEntry[]>(
    "/api/history",
    { headers },
  );
  store.setHistory(data);
  return data;
});

const grandTotal = computed(() =>
  store.history.reduce((s, h) => s + h.total, 0),
);

function fmt(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}
</script>
