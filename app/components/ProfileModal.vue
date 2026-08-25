<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>{{ t("profile.title") }}</h2>
      <div style="position: absolute; top: 0; right: 0">
        <button
          class="btn btn-ghost btn-icon btn-sm"
          style="border: 0"
          :aria-label="t('a11y.close')"
          @click="emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </div>
    </div>

    <div ref="bodyEl" class="modal-body" style="gap: 20px">
      <div style="display: flex; align-items: center; gap: 16px">
        <AppAvatar :member="preview" size="xl" />
        <div style="flex: 1; min-width: 0">
          <div class="field">
            <label for="profile-name">{{ t("profile.fieldName") }}</label>
            <input
              id="profile-name"
              v-model="form.name"
              type="text"
              :placeholder="t('profile.namePlaceholder')"
            />
          </div>
          <div style="color: var(--ink-3); font-size: 12.5px; margin-top: 6px">
            {{ store.me.email }}
          </div>
        </div>
      </div>

      <div class="level-card" style="margin: 0">
        <div class="lv-top">
          <span class="lv-name">{{ lvl.name }}</span>
          <span class="lv-num">{{
            t("profile.level", {
              level: lvl.level,
              into: lvl.into,
              per: lvl.per,
            })
          }}</span>
        </div>
        <ProgressBar :value="lvl.into" :max="lvl.per" />
      </div>

      <div>
        <div class="settings-label">{{ t("profile.fieldColor") }}</div>
        <div class="color-row">
          <button
            v-for="c in COLORS"
            :key="c.value"
            class="color-swatch"
            :class="{ on: activeColor === c.value }"
            :style="{ background: c.value }"
            :title="c.label"
            @click="pickColor(c.value, $event)"
          />
        </div>
      </div>

      <div>
        <div class="settings-label">{{ t("profile.fieldAvatar") }}</div>
        <div class="emoji-row">
          <button
            class="emoji-opt"
            :class="{ on: !form.avatarImage }"
            :title="t('profile.useInitials')"
            @click="pickInitials($event)"
          >
            Aa
          </button>
          <button
            v-for="img in AVATAR_IMAGES"
            :key="img.filename"
            class="emoji-opt img-opt"
            :class="{ on: form.avatarImage === img.filename }"
            :style="avatarBtnStyle(img.filename)"
            :title="img.label"
            @click="pickAvatar(img.filename, $event)"
          >
            <img :src="`/avatars/${img.filename}`" :alt="img.label" />
          </button>
        </div>
      </div>

      <div v-if="store.me.role === 'admin'">
        <div class="settings-label">{{ t("profile.fieldWeekStart") }}</div>
        <div class="seg">
          <button
            :class="{ on: form.weekStartDay === 'monday' }"
            @click="selectWeekStart('monday', $event)"
          >
            {{ t("profile.monday") }}
          </button>
          <button
            :class="{ on: form.weekStartDay === 'sunday' }"
            @click="selectWeekStart('sunday', $event)"
          >
            {{ t("profile.sunday") }}
          </button>
        </div>
      </div>

      <div>
        <div class="settings-label">{{ t("profile.fieldLanguage") }}</div>
        <div class="seg">
          <button
            v-for="loc in LOCALES"
            :key="loc.code"
            :class="{ on: form.locale === loc.code }"
            @click="selectLocale(loc.code as 'en' | 'es' | 'ca', $event)"
          >
            {{ loc.name }}
          </button>
        </div>
      </div>

      <div v-if="store.me.role === 'admin'">
        <div class="settings-label">{{ t("profile.fieldCurrency") }}</div>
        <div class="currency-row">
          <button
            v-for="c in CURRENCIES"
            :key="c.symbol"
            class="currency-opt"
            :class="{ on: form.currency === c.symbol }"
            :title="c.label"
            @click="selectCurrency(c.symbol, $event)"
          >
            {{ c.symbol }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-foot" style="justify-content: space-between">
      <button class="btn btn-ghost" @click="handleLogout">
        <v-icon style="font-size: 15px">mdi-logout</v-icon
        >{{ t("profile.logout") }}
      </button>
      <button class="btn btn-primary" :disabled="saving" @click="handleSave">
        {{ saving ? t("profile.saving") : t("profile.save") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useHomeStore } from "~/stores/home";
import { levelInfo } from "~/utils/home";
import { useAnimations } from "~/composables/useAnimations";
import type { Member } from "~/stores/home";

const emit = defineEmits<{ close: [] }>();
const { t, locale, setLocale } = useI18n();
const { animateLocaleChange, animateCheckToggle } = useAnimations();
const store = useHomeStore();
const bodyEl = ref<HTMLElement | null>(null);

const LOCALES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "ca", name: "Català" },
];
const lvl = computed(() => levelInfo(store.me.totalXp));
const saving = ref(false);

const DEFAULT_COLOR = "#3ca8e5";

const COLORS = [
  { label: "Default", value: DEFAULT_COLOR },
  { label: "Sky", value: "#0096af" },
  { label: "Teal", value: "#0d8d82" },
  { label: "Green", value: "#458554" },
  { label: "Lime", value: "#798940" },
  { label: "Amber", value: "#ad721c" },
  { label: "Orange", value: "#be6438" },
  { label: "Red", value: "#bb5752" },
  { label: "Pink", value: "#b36383" },
  { label: "Purple", value: "#8668b6" },
  { label: "Violet", value: "#5b70b5" },
];

const AVATAR_IMAGES = [
  { filename: "pepe-mage.png", label: "Pepe Mage" },
  { filename: "arthas.png", label: "Arthas" },
  { filename: "jaina.png", label: "Jaina" },
  { filename: "paladin.png", label: "Paladin" },
  { filename: "kadghar.png", label: "Kadghar" },
];

const AVATAR_DEFAULT_COLOR: Record<string, string> = {
  "pepe-mage.png": "#458554",
  "jaina.png": "#0096af",
  "paladin.png": "#ad721c",
  "kadghar.png": "#8668b6",
};

const CURRENCIES = [
  { symbol: "$", label: "USD – US Dollar" },
  { symbol: "€", label: "EUR – Euro" },
  { symbol: "£", label: "GBP – British Pound" },
  { symbol: "¥", label: "JPY – Japanese Yen" },
  { symbol: "₱", label: "PHP – Philippine Peso" },
  { symbol: "₩", label: "KRW – South Korean Won" },
  { symbol: "₹", label: "INR – Indian Rupee" },
  { symbol: "R$", label: "BRL – Brazilian Real" },
  { symbol: "C$", label: "CAD – Canadian Dollar" },
  { symbol: "A$", label: "AUD – Australian Dollar" },
  { symbol: "CHF", label: "CHF – Swiss Franc" },
];

const form = reactive({
  name: store.me.name,
  accentColor: store.me.accentColor ?? "",
  avatarEmoji: store.me.avatarEmoji ?? "",
  avatarImage: store.me.avatarImage ?? "",
  weekStartDay:
    store.household.weekStartDay ?? ("monday" as "monday" | "sunday"),
  currency: store.household.currency ?? "$",
  locale: (store.me.locale ?? locale.value) as "en" | "es" | "ca",
});

const activeColor = computed(() => form.accentColor || DEFAULT_COLOR);

const saved = ref(false);

watch(
  () => form.accentColor,
  (color) => store.setAccentColor(color || null),
);

onBeforeUnmount(() => {
  if (!saved.value) store.applyAccentColor();
});

function pickColor(value: string, event: MouseEvent) {
  form.accentColor = value === DEFAULT_COLOR ? "" : value;
  animateCheckToggle(event.currentTarget as Element, true);
}

function pickInitials(event: MouseEvent) {
  form.avatarImage = "";
  animateCheckToggle(event.currentTarget as Element, true);
}

function pickAvatar(filename: string, event: MouseEvent) {
  form.avatarImage = filename;
  form.avatarEmoji = "";
  if (AVATAR_DEFAULT_COLOR[filename]) {
    form.accentColor = AVATAR_DEFAULT_COLOR[filename];
  }
  animateCheckToggle(event.currentTarget as Element, true);
}

function selectWeekStart(day: "monday" | "sunday", event: MouseEvent) {
  if (day === form.weekStartDay) return;
  form.weekStartDay = day;
  animateCheckToggle(event.currentTarget as Element, true);
}

function selectCurrency(symbol: string, event: MouseEvent) {
  if (symbol === form.currency) return;
  form.currency = symbol;
  animateCheckToggle(event.currentTarget as Element, true);
}

function avatarBtnStyle(filename: string): Record<string, string> {
  if (form.avatarImage !== filename) return {};
  const color = AVATAR_DEFAULT_COLOR[filename];
  if (!color) return {};
  return { background: color, borderColor: color };
}

const preview = computed<Member>(() => ({
  ...store.me,
  name: form.name || store.me.name,
  accentColor: form.accentColor || undefined,
  avatarEmoji: form.avatarEmoji || undefined,
  avatarImage: form.avatarImage || undefined,
}));

async function selectLocale(code: "en" | "es" | "ca", event: MouseEvent) {
  if (code === form.locale) return;
  form.locale = code;
  animateCheckToggle(event.currentTarget as Element, true);
  if (code !== locale.value) {
    await animateLocaleChange(bodyEl.value, () => setLocale(code));
  }
}

async function handleSave() {
  if (!form.name.trim()) return;
  saving.value = true;
  await store.saveSettings({
    name: form.name.trim(),
    accentColor: form.accentColor,
    avatarEmoji: form.avatarEmoji,
    avatarImage: form.avatarImage,
    weekStartDay: form.weekStartDay,
    currency: form.currency,
    locale: form.locale,
  });
  saving.value = false;
  saved.value = true;
  emit("close");
}

async function handleLogout() {
  await store.logout();
  emit("close");
}
</script>

<style scoped>
.settings-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 10px;
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition:
    transform 0.12s,
    border-color 0.15s;
  outline: none;
  padding: 0;
}
.color-swatch:hover {
  transform: scale(1.12);
}
.color-swatch.on {
  border-color: var(--ink);
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 4px var(--ink);
}

.emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.emoji-opt {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid var(--hairline);
  background: var(--surface);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    border-color 0.15s,
    background 0.15s;
  font-family: var(--font-ui);
  color: var(--ink-2);
  font-weight: 700;
  font-size: 13px;
}
.emoji-opt:hover {
  border-color: var(--ink-3);
}
.emoji-opt.on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.img-opt {
  padding: 0;
  overflow: hidden;
}
.img-opt img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.currency-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.currency-opt {
  min-width: 38px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1.5px solid var(--hairline);
  background: var(--surface);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-ui);
  color: var(--ink-2);
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}
.currency-opt:hover {
  border-color: var(--ink-3);
}
.currency-opt.on {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-ink);
}
</style>
