<template>
  <div class="todo-item" :class="{ done: item.done }">
    <button
      class="check"
      :class="{ done: item.done }"
      :aria-label="t('a11y.toggleTodo')"
      @click="store.toggleTodo(item.id)"
    >
      <v-icon v-if="item.done" style="font-size: 15px">mdi-check-bold</v-icon>
    </button>
    <input
      v-if="editing"
      :id="`todo-edit-${item.id}`"
      ref="input"
      v-model="draft"
      class="todo-edit"
      :aria-label="t('a11y.editTodo')"
      maxlength="300"
      @keydown.enter="commit"
      @keydown.esc="cancel"
      @blur="commit"
    />
    <button
      v-else
      type="button"
      class="plain-button todo-text"
      :title="t('todos.editHint')"
      @click="startEdit"
    >
      {{ item.text }}
    </button>
    <button
      class="btn btn-ghost btn-icon btn-sm"
      style="border: 0"
      :aria-label="t('a11y.removeTodo')"
      @click="store.removeTodo(item.id)"
    >
      <v-icon>mdi-close</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { TodoItem } from "~/stores/home";
import { useHomeStore } from "~/stores/home";

const props = defineProps<{ item: TodoItem }>();

const store = useHomeStore();
const { t } = useI18n();
const editing = ref(false);
const draft = ref("");
const input = ref<HTMLInputElement | null>(null);

function startEdit() {
  draft.value = props.item.text;
  editing.value = true;
  nextTick(() => input.value?.select());
}

function commit() {
  if (!editing.value) return;
  editing.value = false;
  store.renameTodo(props.item.id, draft.value);
}

function cancel() {
  editing.value = false;
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
  margin-bottom: 8px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  transition:
    border-color 0.15s,
    opacity 0.25s;
}

.todo-item.done {
  opacity: 0.55;
}

.todo-item.done .todo-text {
  text-decoration: line-through;
  text-decoration-color: var(--ink-3);
}

.todo-text,
.todo-edit {
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 600;
  font-family: var(--font-ui);
  color: var(--ink);
}

.todo-text {
  cursor: text;
  overflow-wrap: anywhere;
}

.todo-edit {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--accent);
  outline: none;
  padding: 0;
}
</style>
