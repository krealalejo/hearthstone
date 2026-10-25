<template>
  <div class="content-inner">
    <div class="sec-head">
      <h2>{{ $t("todos.title") }}</h2>
      <span class="count">{{
        $t(
          "todos.progress",
          { done: doneItems.length, n: store.todos.length },
          store.todos.length,
        )
      }}</span>
      <span class="line" />
    </div>

    <div class="shop-add">
      <v-text-field
        v-model="draft"
        :placeholder="$t('todos.addPlaceholder')"
        maxlength="300"
        hide-details
        @keydown.enter="addTodo"
      />
      <v-btn color="primary" :loading="adding" @click="addTodo">
        <v-icon size="17" start>mdi-plus</v-icon>{{ $t("todos.add") }}
      </v-btn>
    </div>

    <AppSkeleton v-if="!store.bootstrapped" :count="4" />
    <div v-else-if="!store.todos.length" class="empty">
      <v-icon class="empty-icon">mdi-checkbox-marked-outline</v-icon>
      <h3>{{ $t("todos.emptyTitle") }}</h3>
      <p>{{ $t("todos.emptyBody") }}</p>
    </div>

    <TodoItem v-for="item in pendingItems" :key="item.id" :item="item" />

    <template v-if="doneItems.length">
      <div class="sec-head" style="margin-top: 18px">
        <h2 style="font-size: 16px">{{ $t("todos.completed") }}</h2>
        <span class="line" />
        <button class="btn btn-ghost btn-sm" @click="store.clearDoneTodos()">
          <v-icon style="font-size: 15px">mdi-broom</v-icon>
          {{ $t("todos.clearCompleted") }}
        </button>
      </div>
      <TodoItem v-for="item in doneItems" :key="item.id" :item="item" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useHomeStore } from "~/stores/home";

definePageMeta({ middleware: "auth" });

const store = useHomeStore();

const draft = ref("");
const adding = ref(false);

const pendingItems = computed(() => store.todos.filter((i) => !i.done));
const doneItems = computed(() => store.todos.filter((i) => i.done));

async function addTodo() {
  if (adding.value) return;
  const text = draft.value;
  draft.value = "";
  adding.value = true;
  await store.addTodo(text);
  adding.value = false;
}
</script>
