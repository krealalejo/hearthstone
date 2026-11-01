<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ $t("shoppingModal.title") }}</h2>
      <p>{{ $t("shoppingModal.subtitle") }}</p>
      <v-btn
        icon
        variant="text"
        size="small"
        style="position: absolute; top: 0; right: 0"
        :aria-label="$t('common.cancel')"
        @click="emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <div class="modal-body">
      <div class="field">
        <v-text-field
          v-model="form.name"
          :label="$t('shoppingModal.fieldName')"
          :placeholder="$t('shoppingModal.namePlaceholder')"
          autofocus
          @keydown.enter="handleSave"
        />
      </div>
      <div v-if="store.inventory.length" class="field">
        <v-select
          v-model="form.invId"
          :items="inventoryOptions"
          :label="$t('shoppingModal.fieldInv')"
          :hint="$t('shoppingModal.invHint')"
          persistent-hint
          clearable
        />
      </div>
      <div class="field-row">
        <div class="field">
          <div class="label">{{ $t("shoppingModal.fieldQty") }}</div>
          <QuantityStepper
            :value="form.qty"
            :min="1"
            :delay="0"
            @change="form.qty = $event"
          />
        </div>
        <div class="field">
          <div id="shop-price-label" class="label">
            {{ $t("shoppingModal.fieldPrice") }}
            <span style="color: var(--ink-3); font-weight: 400"
              >· {{ $t("common.optional") }}</span
            >
          </div>
          <div class="price-wrap">
            <span v-if="form.price !== ''" class="price-currency">
              {{ store.household.currency ?? "$" }}
            </span>
            <input
              id="shop-price"
              v-model="form.price"
              aria-labelledby="shop-price-label"
              class="price-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
      <div class="field">
        <div class="label">
          {{ $t("shoppingModal.fieldCat") }}
          <span style="color: var(--ink-3); font-weight: 400"
            >· {{ $t("common.optional") }}</span
          >
        </div>
        <v-chip-group v-model="form.cat" column>
          <v-chip
            v-for="c in CATS"
            :key="c.id"
            :value="c.id"
            variant="outlined"
            size="small"
          >
            <v-icon :icon="c.icon" size="14" start />
            {{ c.name.split(" ")[0] }}
          </v-chip>
        </v-chip-group>
      </div>
      <div class="field">
        <label for="shop-note"
          >{{ $t("shoppingModal.fieldNote") }}
          <span style="color: var(--ink-3); font-weight: 400"
            >· {{ $t("common.optional") }}</span
          ></label
        >
        <input
          id="shop-note"
          v-model="form.note"
          maxlength="200"
          :placeholder="$t('shoppingModal.notePlaceholder')"
        />
      </div>
    </div>
    <div class="modal-foot">
      <v-btn variant="text" @click="emit('close')">{{
        $t("common.cancel")
      }}</v-btn>
      <v-btn color="primary" :disabled="!form.name.trim()" @click="handleSave">
        {{ $t("shoppingModal.add") }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import { useHomeStore } from "~/stores/home";
import { CATEGORIES, type Category } from "~/utils/categories";

const emit = defineEmits<{ close: [] }>();
const store = useHomeStore();
const { t } = useI18n();

const CATS = computed(() =>
  CATEGORIES.map((c) => ({ ...c, name: t(c.labelKey) })),
);

const inventoryOptions = computed(() =>
  store.inventory.map((i) => ({ title: i.name, value: i.id })),
);

const form = reactive<{
  name: string;
  invId: string | null;
  qty: number;
  price: number | string;
  cat: Category | null;
  note: string;
}>({
  name: "",
  invId: null,
  qty: 1,
  price: "",
  cat: null,
  note: "",
});

watch(
  () => form.invId,
  (invId, previousId) => {
    const linked = store.inventory.find((i) => i.id === invId);
    if (!linked) return;
    const previous = store.inventory.find((i) => i.id === previousId);
    if (!form.name.trim() || form.name === previous?.name) {
      form.name = linked.name;
    }
    form.cat = linked.cat;
    if (form.price === "" && linked.price != null) form.price = linked.price;
  },
);

function handleSave() {
  if (!form.name.trim()) return;
  store.addShop({
    name: form.name,
    invId: form.invId,
    qty: form.qty,
    price: form.price === "" ? null : Number(form.price),
    cat: form.cat ?? null,
    note: form.note,
  });
  emit("close");
}
</script>

<style scoped>
:deep(.stepper) {
  height: 42px;
  justify-content: space-between;
}
:deep(.stepper button) {
  width: 44px;
  height: 42px;
}
</style>
