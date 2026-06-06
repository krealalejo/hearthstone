<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ task ? "Edit task" : "New task" }}</h2>
      <p v-if="!task">Add a chore and assign points</p>
      <v-btn
        icon
        variant="text"
        size="small"
        style="position: absolute; top: 0; right: 0"
        @click="emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <div class="modal-body">
      <div class="field">
        <label for="task-title">Title</label>
        <input
          id="task-title"
          v-model="form.title"
          placeholder="e.g. Clean the windows"
          autofocus
        />
      </div>
      <div class="field">
        <label for="task-desc"
          >Description
          <span style="color: var(--ink-3); font-weight: 400"
            >· optional</span
          ></label
        >
        <textarea
          id="task-desc"
          v-model="form.desc"
          placeholder="Any details…"
        />
      </div>
      <div class="field" style="align-items: center">
        <div class="label">Room</div>
        <v-chip-group
          v-model="form.roomId"
          mandatory
          column
          style="justify-content: center"
        >
          <v-chip
            v-for="r in store.rooms"
            :key="r.id"
            :value="r.id"
            variant="outlined"
            size="small"
          >
            <v-icon :icon="r.icon" size="14" start />
            {{ r.name }}
          </v-chip>
        </v-chip-group>
      </div>
      <div class="field" style="align-items: center">
        <div class="label">Assign to</div>
        <v-chip-group
          v-model="form.assignee"
          column
          style="justify-content: center"
        >
          <v-chip :value="null" variant="outlined" size="small">
            <v-icon icon="mdi-account-group" size="14" start />
            Anyone
          </v-chip>
          <v-chip
            v-for="m in store.activeMembers"
            :key="m.id"
            :value="m.id"
            variant="outlined"
            size="small"
          >
            <AppAvatar :member="m" size="sm" style="margin-right: 5px" />
            {{ m.name.split(" ")[0] }}
          </v-chip>
        </v-chip-group>
      </div>
      <div class="field" style="align-items: center">
        <div class="label">Effort · {{ form.xp }} XP</div>
        <v-btn-toggle
          v-model="form.xp"
          mandatory
          density="compact"
          variant="outlined"
          rounded="sm"
        >
          <v-btn
            v-for="opt in XP_OPTS"
            :key="opt.n"
            :value="opt.n"
            size="small"
          >
            <div style="text-align: center; line-height: 1.2">
              <div style="font-weight: 600">{{ opt.n }}</div>
              <div style="font-size: 10px; opacity: 0.75">{{ opt.l }}</div>
            </div>
          </v-btn>
        </v-btn-toggle>
      </div>
      <v-switch
        v-model="form.recurring"
        label="Recurring weekly"
        prepend-icon="mdi-sync"
        color="primary"
        density="compact"
        hide-details
        style="align-self: center"
      />
    </div>
    <div class="modal-foot">
      <v-btn
        v-if="isEdit"
        variant="text"
        color="error"
        style="margin-right: auto"
        @click="handleDelete"
      >
        <v-icon size="15" start>mdi-trash-can</v-icon>Delete
      </v-btn>
      <v-btn variant="text" @click="emit('close')">Cancel</v-btn>
      <v-btn color="primary" :disabled="!form.title.trim()" @click="handleSave">
        {{ task ? "Save changes" : "Add task" }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import type { Task } from "~/stores/home";
import { useHomeStore } from "~/stores/home";

const props = defineProps<{ task?: Task | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const isEdit = !!props.task;
const store = useHomeStore();

const XP_OPTS = [
  { n: 5, l: "Quick" },
  { n: 10, l: "Light" },
  { n: 20, l: "Medium" },
  { n: 35, l: "Hard" },
  { n: 50, l: "Deep" },
];

const form = reactive({
  title: props.task?.title ?? "",
  desc: props.task?.desc ?? "",
  roomId: props.task?.roomId ?? store.rooms[0]?.id ?? "",
  assignee: props.task?.assignee ?? (null as string | null),
  xp: props.task?.xp ?? 10,
  recurring: props.task?.recurring ?? true,
});

function handleSave() {
  if (!form.title.trim()) return;
  store.saveTask({
    ...(props.task ? { id: props.task.id } : {}),
    title: form.title.trim(),
    desc: form.desc.trim(),
    roomId: form.roomId,
    assignee: form.assignee,
    xp: form.xp,
    recurring: form.recurring,
  });
  emit("saved");
  emit("close");
}

function handleDelete() {
  if (props.task) store.deleteTask(props.task.id);
  emit("close");
}
</script>
