<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>{{ $t("history.purchasesTitle") }}</h2>
      <span class="count">{{
        $t(
          "history.purchasesCount",
          { n: store.history.length, total: money(grandTotal) },
          store.history.length,
        )
      }}</span>
      <span class="line" />
    </div>

    <AppSkeleton v-if="!store.bootstrapped" variant="card" :count="3" />
    <div v-else-if="!store.history.length" class="empty">
      <v-icon class="empty-icon">mdi-receipt</v-icon>
      <h3>{{ $t("history.noTitle") }}</h3>
      <p>{{ $t("history.noBody") }}</p>
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
            {{ $t("history.itemCount", { n: h.items.length }, h.items.length) }}
            · {{ h.items.reduce((s, i) => s + i.qty, 0) }}
            {{ $t("history.units") }}
          </div>
        </div>
        <div class="hist-total">
          <div class="tv">{{ money(h.total) }}</div>
          <div class="tl">{{ $t("history.totalSpend") }}</div>
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
import { useHomeStore, useMoney } from "~/stores/home";

const { money } = useMoney();
const { locale } = useI18n();

definePageMeta({ middleware: "auth" });

const store = useHomeStore();

const grandTotal = computed(() =>
  store.history.reduce((s, h) => s + h.total, 0),
);

function fmt(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString(locale.value, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}
</script>
