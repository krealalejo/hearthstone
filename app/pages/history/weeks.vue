<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>{{ $t("history.weeksTitle") }}</h2>
      <span class="count">{{
        $t("history.weekCount", { n: weekGroups.length }, weekGroups.length)
      }}</span>
      <span class="line" />
    </div>

    <div v-if="!weekGroups.length" class="empty">
      <v-icon class="empty-icon">mdi-calendar-blank-outline</v-icon>
      <h3>{{ $t("history.weekNoHistory") }}</h3>
      <p>{{ $t("history.weekNoHistoryBody") }}</p>
    </div>

    <div v-for="wg in weekGroups" :key="wg.key" class="card week-card">
      <div class="week-head">
        <div>
          <div class="week-num">
            {{ $t("history.weekLabel", { week: wg.week, year: wg.year }) }}
            <span v-if="wg.isCurrent" class="chip chip-current">{{
              $t("history.current")
            }}</span>
          </div>
          <div class="week-range">{{ wg.range }}</div>
        </div>
        <div class="week-meta">
          <span v-if="wg.doneTasks.length" class="chip chip-xp">
            <v-icon style="font-size: 13px">mdi-check-circle</v-icon>
            {{
              $t(
                "history.task",
                { n: wg.doneTasks.length },
                wg.doneTasks.length,
              )
            }}
          </span>
          <span v-if="wg.purchases.length" class="chip">
            <v-icon style="font-size: 13px">mdi-receipt-outline</v-icon>
            {{
              $t(
                "history.purchase",
                { n: wg.purchases.length },
                wg.purchases.length,
              )
            }}
          </span>
          <span v-if="wg.totalSpend > 0" class="chip">{{
            money(wg.totalSpend)
          }}</span>
        </div>
      </div>

      <div v-if="wg.doneTasks.length" class="week-section">
        <div class="week-sec-label">{{ $t("history.tasksCompleted") }}</div>
        <div class="week-chips">
          <span v-for="tk in wg.doneTasks" :key="tk.id" class="good-chip">
            <v-icon style="font-size: 12px; color: var(--accent-ink)"
              >mdi-check-circle</v-icon
            >
            {{ tk.title }}<span class="q">+{{ tk.xp }} XP</span>
          </span>
        </div>
      </div>

      <div v-if="wg.purchases.length" class="week-section">
        <div class="week-sec-label">{{ $t("history.purchasesTab") }}</div>
        <div v-for="p in wg.purchases" :key="p.id" class="week-purchase">
          <div class="wp-head">
            <span class="wp-date">{{ fmt(p.date) }}</span>
            <span class="wp-total">{{ money(p.total) }}</span>
          </div>
          <div class="hist-goods" style="margin-top: 8px">
            <span v-for="(it, i) in p.items" :key="i" class="good-chip">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useHomeStore, useMoney } from "~/stores/home";

const { money } = useMoney();
const { locale } = useI18n();
import type { HistoryEntry, Task } from "~/stores/home";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();

function fmt(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString(locale.value, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

function getISOWeek(dateStr: string): { year: number; week: number } {
  const d = new Date(dateStr + "T00:00:00");
  const thu = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  thu.setUTCDate(thu.getUTCDate() + 4 - (thu.getUTCDay() || 7));
  const jan1 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  return {
    year: thu.getUTCFullYear(),
    week: Math.ceil(((thu.getTime() - jan1.getTime()) / 86400000 + 1) / 7),
  };
}

function weekRange(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const mon = new Date(Date.UTC(year, 0, 4 - dow + 1 + (week - 1) * 7));
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const f = (d: Date) =>
    d.toLocaleDateString(locale.value, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${f(mon)} – ${f(sun)}`;
}

interface WeekGroup {
  key: string;
  year: number;
  week: number;
  range: string;
  purchases: HistoryEntry[];
  doneTasks: Task[];
  totalSpend: number;
  isCurrent: boolean;
}

const weekGroups = computed<WeekGroup[]>(() => {
  const map = new Map<string, WeekGroup>();

  for (const h of store.history) {
    const { year, week } = getISOWeek(h.date);
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        year,
        week,
        range: weekRange(year, week),
        purchases: [],
        doneTasks: [],
        totalSpend: 0,
        isCurrent: false,
      });
    }
    const wg = map.get(key)!;
    wg.purchases.push(h);
    wg.totalSpend += h.total;
  }

  const today = new Date().toISOString().slice(0, 10);
  const { year: cy, week: cw } = getISOWeek(today);
  const curKey = `${cy}-W${String(cw).padStart(2, "0")}`;
  if (!map.has(curKey)) {
    map.set(curKey, {
      key: curKey,
      year: cy,
      week: cw,
      range: weekRange(cy, cw),
      purchases: [],
      doneTasks: [],
      totalSpend: 0,
      isCurrent: true,
    });
  }
  const curGroup = map.get(curKey)!;
  curGroup.isCurrent = true;
  curGroup.doneTasks = store.tasks.filter((t) => t.done);

  return [...map.values()].sort((a, b) =>
    a.year === b.year ? b.week - a.week : b.year - a.year,
  );
});
</script>
