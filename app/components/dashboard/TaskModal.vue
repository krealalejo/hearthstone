<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ heading }}</h2>
      <p v-if="!task">
        {{ isTodo ? $t("taskModal.subtitleTodo") : $t("taskModal.subtitle") }}
      </p>
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
      <v-btn-toggle
        v-if="canChooseKind"
        v-model="kind"
        mandatory
        density="compact"
        variant="outlined"
        rounded="sm"
        class="kind-switch"
      >
        <v-btn value="todo" size="small">
          <v-icon size="15" start>mdi-checkbox-marked-outline</v-icon>
          {{ $t("taskModal.kindTodo") }}
        </v-btn>
        <v-btn value="task" size="small">
          <v-icon size="15" start>mdi-sync</v-icon>
          {{ $t("taskModal.kindTask") }}
        </v-btn>
      </v-btn-toggle>
      <div class="field">
        <label for="task-title">{{
          isTodo ? $t("taskModal.fieldTodo") : $t("taskModal.fieldTitle")
        }}</label>
        <input
          id="task-title"
          v-model="form.title"
          :maxlength="isTodo ? 300 : 200"
          :placeholder="
            isTodo
              ? $t('todos.addPlaceholder')
              : $t('taskModal.titlePlaceholder')
          "
          @keydown.enter="isTodo && handleSave()"
        />
      </div>
      <template v-if="!isTodo">
        <div class="field">
          <label for="task-desc"
            >{{ $t("taskModal.fieldDesc") }}
            <span style="color: var(--ink-3); font-weight: 400"
              >· {{ $t("taskModal.optional") }}</span
            ></label
          >
          <textarea
            id="task-desc"
            v-model="form.desc"
            :placeholder="$t('taskModal.descPlaceholder')"
          />
        </div>
        <div class="field" style="align-items: center">
          <div class="label">{{ $t("taskModal.fieldRoom") }}</div>
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
          <div class="label">{{ $t("taskModal.fieldAssign") }}</div>
          <v-chip-group
            v-model="form.assignee"
            column
            style="justify-content: center"
          >
            <v-chip :value="null" variant="outlined" size="small">
              <v-icon icon="mdi-account-group" size="14" start />
              {{ $t("taskModal.anyone") }}
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
          <div class="label">
            {{ $t("taskModal.fieldEffort", { xp: form.xp }) }}
          </div>
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
          :label="$t('taskModal.repeat')"
          prepend-icon="mdi-sync"
          color="primary"
          density="compact"
          hide-details
          style="align-self: center"
        />
        <div v-if="form.recurring" class="repeat-row">
          <span class="label">{{ $t("taskModal.every") }}</span>
          <QuantityStepper
            :value="form.repeatEvery"
            :min="1"
            :delay="0"
            @change="form.repeatEvery = Math.min(365, $event)"
          />
          <v-btn-toggle
            v-model="form.repeatUnit"
            mandatory
            density="compact"
            variant="outlined"
            rounded="sm"
          >
            <v-btn
              v-for="unit in UNIT_OPTS"
              :key="unit.id"
              :value="unit.id"
              size="small"
            >
              {{ $t(unit.labelKey, form.repeatEvery) }}
            </v-btn>
          </v-btn-toggle>
        </div>
      </template>
    </div>
    <div class="modal-foot">
      <v-btn
        v-if="isEdit"
        variant="text"
        color="error"
        style="margin-right: auto"
        @click="handleDelete"
      >
        <v-icon size="15" start>mdi-trash-can</v-icon
        >{{ $t("taskModal.delete") }}
      </v-btn>
      <v-btn variant="text" @click="emit('close')">{{
        $t("taskModal.cancel")
      }}</v-btn>
      <v-btn color="primary" :disabled="!form.title.trim()" @click="handleSave">
        {{ saveLabel }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import type { Task } from "~/types/home";
import { useHomeStore } from "~/stores/home";
import type { RepeatUnit } from "~/utils/recurrence";

const props = defineProps<{ task?: Task | null; allowTodo?: boolean }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const isEdit = !!props.task;
const store = useHomeStore();
const { t } = useI18n();

const canChooseKind = computed(() => !!props.allowTodo && !props.task);
const kind = ref<"todo" | "task">(canChooseKind.value ? "todo" : "task");
const isTodo = computed(() => canChooseKind.value && kind.value === "todo");

const heading = computed(() => {
  if (props.task) return t("taskModal.titleEdit");
  return isTodo.value ? t("taskModal.titleNewTodo") : t("taskModal.titleNew");
});

const saveLabel = computed(() => {
  if (props.task) return t("taskModal.save");
  return isTodo.value ? t("taskModal.addTodo") : t("taskModal.add");
});

const XP_OPTS = computed(() => [
  { n: 5, l: t("taskModal.effortQuick") },
  { n: 10, l: t("taskModal.effortLight") },
  { n: 20, l: t("taskModal.effortMedium") },
  { n: 35, l: t("taskModal.effortHard") },
  { n: 50, l: t("taskModal.effortDeep") },
]);

const UNIT_OPTS: { id: RepeatUnit; labelKey: string }[] = [
  { id: "day", labelKey: "taskModal.unitDay" },
  { id: "week", labelKey: "taskModal.unitWeek" },
  { id: "month", labelKey: "taskModal.unitMonth" },
];

const form = reactive({
  title: props.task?.title ?? "",
  desc: props.task?.desc ?? "",
  roomId: props.task?.roomId ?? store.rooms[0]?.id ?? "",
  assignee: props.task?.assignee ?? (null as string | null),
  xp: props.task?.xp ?? 10,
  recurring: props.task?.recurring ?? true,
  repeatEvery: props.task?.repeatEvery ?? 1,
  repeatUnit: props.task?.repeatUnit ?? ("week" as RepeatUnit),
});

function handleSave() {
  if (!form.title.trim()) return;
  if (isTodo.value) {
    store.addTodo(form.title);
    emit("saved");
    emit("close");
    return;
  }
  store.saveTask({
    ...(props.task ? { id: props.task.id } : {}),
    title: form.title.trim(),
    desc: form.desc.trim(),
    roomId: form.roomId,
    assignee: form.assignee,
    xp: form.xp,
    recurring: form.recurring,
    repeatEvery: form.repeatEvery,
    repeatUnit: form.repeatUnit,
  });
  emit("saved");
  emit("close");
}

function handleDelete() {
  if (props.task) store.deleteTask(props.task.id);
  emit("close");
}
</script>

<style scoped>
.kind-switch {
  align-self: center;
}
.repeat-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.repeat-row :deep(.stepper) {
  margin: 0;
}
</style>
