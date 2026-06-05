<template>
  <div>
    <div class="modal-head" style="position: relative">
      <h2>Profile & settings</h2>
      <div style="position: absolute; top: 0; right: 0">
        <button
          class="btn btn-ghost btn-icon btn-sm"
          style="border: 0"
          @click="emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </div>
    </div>

    <div class="modal-body" style="gap: 20px">
      <!-- Avatar + name row -->
      <div style="display: flex; align-items: center; gap: 16px">
        <AppAvatar :member="preview" size="xl" />
        <div style="flex: 1; min-width: 0">
          <div class="field">
            <label for="profile-name">Name</label>
            <input
              id="profile-name"
              v-model="form.name"
              type="text"
              placeholder="Your name"
            />
          </div>
          <div style="color: var(--ink-3); font-size: 12.5px; margin-top: 6px">
            {{ store.me.email }}
          </div>
        </div>
      </div>

      <!-- Level card -->
      <div class="level-card" style="margin: 0">
        <div class="lv-top">
          <span class="lv-name">{{ lvl.name }}</span>
          <span class="lv-num"
            >Level {{ lvl.level }} · {{ lvl.into }}/{{ lvl.per }} XP</span
          >
        </div>
        <ProgressBar :value="lvl.into" :max="lvl.per" />
      </div>

      <!-- Color -->
      <div>
        <div class="settings-label">Color</div>
        <div class="color-row">
          <button
            v-for="c in COLORS"
            :key="c.value"
            class="color-swatch"
            :class="{ on: activeColor === c.value }"
            :style="{ background: c.value }"
            :title="c.label"
            @click="pickColor(c.value)"
          />
        </div>
      </div>

      <!-- Avatar picker -->
      <div>
        <div class="settings-label">Avatar</div>
        <div class="emoji-row">
          <button
            class="emoji-opt"
            :class="{ on: !form.avatarImage }"
            title="Use initials"
            @click="form.avatarImage = ''"
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
            @click="pickAvatar(img.filename)"
          >
            <img :src="`/avatars/${img.filename}`" :alt="img.label" />
          </button>
        </div>
      </div>

      <!-- Household settings (admin only) -->
      <div v-if="store.me.role === 'admin'">
        <div class="settings-label">Week starts on</div>
        <div class="seg">
          <button
            :class="{ on: form.weekStartDay === 'monday' }"
            @click="form.weekStartDay = 'monday'"
          >
            Monday
          </button>
          <button
            :class="{ on: form.weekStartDay === 'sunday' }"
            @click="form.weekStartDay = 'sunday'"
          >
            Sunday
          </button>
        </div>
      </div>

      <div v-if="store.me.role === 'admin'">
        <div class="settings-label">Currency</div>
        <div class="currency-row">
          <button
            v-for="c in CURRENCIES"
            :key="c.symbol"
            class="currency-opt"
            :class="{ on: form.currency === c.symbol }"
            :title="c.label"
            @click="form.currency = c.symbol"
          >
            {{ c.symbol }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-foot" style="justify-content: space-between">
      <button class="btn btn-ghost" @click="handleLogout">
        <v-icon style="font-size: 15px">mdi-logout</v-icon>Log out
      </button>
      <button class="btn btn-primary" :disabled="saving" @click="handleSave">
        {{ saving ? "Saving…" : "Save" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useHomeStore, levelInfo } from "~/stores/home";
import type { Member } from "~/stores/home";

const emit = defineEmits<{ close: [] }>();
const store = useHomeStore();
const lvl = computed(() => levelInfo(store.me.totalXp));
const saving = ref(false);

const DEFAULT_COLOR = "#3ca8e5";

const COLORS = [
  { label: "Default", value: DEFAULT_COLOR },
  { label: "Sky", value: "oklch(0.62 0.11 215)" },
  { label: "Teal", value: "oklch(0.58 0.10 185)" },
  { label: "Green", value: "oklch(0.56 0.10 150)" },
  { label: "Lime", value: "oklch(0.60 0.10 120)" },
  { label: "Amber", value: "oklch(0.60 0.12 70)" },
  { label: "Orange", value: "oklch(0.60 0.13 45)" },
  { label: "Red", value: "oklch(0.58 0.13 25)" },
  { label: "Pink", value: "oklch(0.60 0.11 355)" },
  { label: "Purple", value: "oklch(0.58 0.12 300)" },
  { label: "Violet", value: "oklch(0.56 0.11 270)" },
];

const AVATAR_IMAGES = [
  { filename: "pepe-mage.png", label: "Pepe Mage" },
  { filename: "arthas.png", label: "Arthas" },
  { filename: "jaina.png", label: "Jaina" },
  { filename: "paladin.png", label: "Paladin" },
  { filename: "kadghar.png", label: "Kadghar" },
  { filename: "Garrosh.png", label: "Garrosh" },
];

const AVATAR_DEFAULT_COLOR: Record<string, string> = {
  "pepe-mage.png": "oklch(0.56 0.10 150)", // Green
  "jaina.png": "oklch(0.62 0.11 215)", // Sky/Blue
  "paladin.png": "oklch(0.60 0.12 70)", // Amber
  "kadghar.png": "oklch(0.58 0.12 300)", // Pink
  "Garrosh.png": "oklch(0.58 0.13 25)", // Red
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
});

// Active color: if none set, highlight the default swatch
const activeColor = computed(() => form.accentColor || DEFAULT_COLOR);

function pickColor(value: string) {
  // Selecting the default color = clear custom color
  form.accentColor = value === DEFAULT_COLOR ? "" : value;
}

function pickAvatar(filename: string) {
  form.avatarImage = filename;
  form.avatarEmoji = "";
  if (AVATAR_DEFAULT_COLOR[filename]) {
    form.accentColor = AVATAR_DEFAULT_COLOR[filename];
  }
}

function avatarBtnStyle(filename: string): Record<string, string> {
  if (form.avatarImage !== filename) return {};
  const color = AVATAR_DEFAULT_COLOR[filename];
  if (!color) return {};
  return { background: color, borderColor: color };
}

// Live preview member for avatar
const preview = computed<Member>(() => ({
  ...store.me,
  name: form.name || store.me.name,
  accentColor: form.accentColor || undefined,
  avatarEmoji: form.avatarEmoji || undefined,
  avatarImage: form.avatarImage || undefined,
}));

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
  });
  saving.value = false;
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
