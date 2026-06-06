<template>
  <div class="card leader">
    <template v-if="gameLevel === 'full'">
      <div class="leader-head">
        <v-icon>mdi-medal</v-icon>
        <h3>{{ $t("leaderboard.thisWeek") }}</h3>
      </div>
      <div class="level-card">
        <div class="lv-top">
          <span class="lv-name">{{ myLevel.name }}</span>
          <span class="lv-num"
            >Level {{ myLevel.level }} · {{ myLevel.into }}/{{
              myLevel.per
            }}
            XP</span
          >
        </div>
        <ProgressBar :value="myLevel.into" :max="myLevel.per" />
      </div>
    </template>
    <template v-else>
      <div class="leader-head">
        <v-icon>mdi-medal</v-icon>
        <h3>{{ $t("leaderboard.title") }}</h3>
      </div>
    </template>
    <div class="leader-sub">{{ $t("leaderboard.sub") }}</div>
    <div class="leader-list">
      <div
        v-for="(m, i) in ranked"
        :key="m.id"
        class="lrow"
        :class="{ top: i === 0 }"
      >
        <span class="rank">
          <span v-if="gameLevel !== 'subtle' && i < 3">{{ MEDALS[i] }}</span>
          <span v-else>{{ i + 1 }}</span>
        </span>
        <AppAvatar :member="m" size="md" />
        <div class="lr-meta">
          <div class="lr-name">
            {{ m.name.split(" ")[0] }}
            <span v-if="m.id === store.currentUser" class="you-tag">{{
              $t("household.you")
            }}</span>
          </div>
          <ProgressBar
            v-if="gameLevel !== 'subtle'"
            class="lr-bar"
            :value="m.weekXp"
            :max="maxXp"
          />
          <div v-else class="lr-xp">
            {{ $t("leaderboard.totalXp", { n: m.totalXp.toLocaleString() }) }}
          </div>
        </div>
        <span class="lr-points">{{ m.weekXp }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useHomeStore } from "~/stores/home";
import { levelInfo } from "~/utils/home";

const store = useHomeStore();

const MEDALS = ["🥇", "🥈", "🥉"];

const gameLevel: string = "balanced";
const ranked = computed(() =>
  [...store.activeMembers].sort((a, b) => b.weekXp - a.weekXp),
);
const maxXp = computed(() => Math.max(1, ...ranked.value.map((m) => m.weekXp)));
const myLevel = computed(() => levelInfo(store.me.totalXp));
</script>
