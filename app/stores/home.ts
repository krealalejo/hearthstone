import { defineStore } from "pinia";

export const MEMBER_COLORS: Record<string, string> = {
  alex: "#5b8abb",
  sam: "#b46762",
  jordan: "#51895e",
  riley: "#a172ac",
  casey: "#a37640",
};

export function memberColor(id: string): string {
  return MEMBER_COLORS[id] ?? "#8f7d66";
}

export const LEVELS = [
  "Fresh Start",
  "Tidy Sprout",
  "House Helper",
  "Home Keeper",
  "Space Steward",
  "Order Adept",
  "Domestic Pro",
  "Hearth Master",
];

export function levelInfo(totalXp: number) {
  const per = 250;
  const idx = Math.min(LEVELS.length - 1, Math.floor(totalXp / per));
  const into = totalXp - idx * per;
  return {
    level: idx + 1,
    name: LEVELS[idx],
    into,
    per,
    pct: Math.round((into / per) * 100),
  };
}

export function money(n: number | null | undefined, currency = "$"): string {
  if (n == null) return "— " + currency;
  return Number(n).toFixed(2) + " " + currency;
}

export function useMoney() {
  const store = useHomeStore();
  return {
    money: (n: number | null | undefined) =>
      money(n, store.household.currency ?? "$"),
  };
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending";
  weekXp: number;
  totalXp: number;
  accentColor?: string;
  avatarEmoji?: string;
  avatarImage?: string;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  roomId: string;
  assignee: string | null;
  xp: number;
  recurring: boolean;
  done: boolean;
  doneBy: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  cat: "food" | "cleaning" | "misc";
  qty: number;
  min: number;
  optimal: number;
  price: number | null;
  icon: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  source: "auto" | "manual";
  invId: string | null;
  qty: number;
  price: number | null;
  checked: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number | null }[];
  total: number;
}

export interface Toast {
  id: string;
  kind: "xp" | "restock" | "check" | "info";
  title: string;
  body?: string;
  link?: string;
  celebrate?: boolean;
}

export interface Household {
  id: string;
  name: string;
  emoji: string;
  lastResetWeek?: string;
  weekStartDay?: "monday" | "sunday";
  currency?: string;
}

function toastId(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return "toast_" + Date.now().toString(36) + "_" + (arr[0] ?? 0).toString(36);
}

export const useHomeStore = defineStore("home", {
  state: () => ({
    authed: false,
    household: { id: "", name: "", emoji: "" } as Household,
    currentUser: "",
    currentUserId: "",
    members: [] as Member[],
    rooms: [
      { id: "kitchen", name: "Kitchen", icon: "mdi-silverware-fork-knife" },
      { id: "living", name: "Living Room", icon: "mdi-sofa" },
      { id: "bathroom", name: "Bathroom", icon: "mdi-shower" },
      { id: "bedroom", name: "Bedroom", icon: "mdi-bed" },
      { id: "outdoor", name: "Outdoor", icon: "mdi-tree" },
      { id: "other", name: "Other", icon: "mdi-dots-horizontal" },
    ] as Room[],
    tasks: [] as Task[],
    inventory: [] as InventoryItem[],
    shopping: [] as ShoppingItem[],
    history: [] as HistoryEntry[],
    toasts: [] as Toast[],
    flashShopId: null as string | null,
  }),

  getters: {
    weekNo: (s) => {
      if (s.household.weekStartDay === "sunday") {
        const d = new Date();
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        const jan1 = new Date(start.getFullYear(), 0, 1);
        return Math.ceil((start.getTime() - jan1.getTime()) / 864e5 / 7) + 1;
      }
      const d = new Date();
      const thu = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
      thu.setUTCDate(thu.getUTCDate() + 4 - (thu.getUTCDay() || 7));
      const jan1 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
      return Math.ceil(((thu.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
    },
    weekKey: (s) => {
      if (s.household.weekStartDay === "sunday") {
        const d = new Date();
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        return "S-" + start.toISOString().slice(0, 10);
      }
      const d = new Date();
      const thu = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
      thu.setUTCDate(thu.getUTCDate() + 4 - (thu.getUTCDay() || 7));
      const jan1 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
      const wk = Math.ceil(
        ((thu.getTime() - jan1.getTime()) / 86400000 + 1) / 7,
      );
      return `${thu.getUTCFullYear()}-W${wk}`;
    },
    lowCount: (s) => s.inventory.filter((i) => i.qty <= i.min).length,
    shopCount: (s) => s.shopping.filter((i) => !i.checked).length,
    me: (s) =>
      s.members.find((m) => m.id === s.currentUserId) ??
      s.members.find((m) => m.status === "active") ??
      ({
        id: "",
        name: "",
        email: "",
        role: "member",
        status: "active",
        weekXp: 0,
        totalXp: 0,
      } as Member),
    activeMembers: (s) => s.members.filter((m) => m.status === "active"),
    pendingMembers: (s) => s.members.filter((m) => m.status === "pending"),
  },

  actions: {
    _toast(toast: Omit<Toast, "id">) {
      this.toasts.push({ id: toastId(), ...toast });
    },

    // ── Auth ──
    async login(email: string, password: string) {
      await $fetch("/api/login/login", {
        method: "POST",
        body: { email, password },
      });
    },

    async logout() {
      await $fetch("/api/login/logout", { method: "POST" }).catch(() => null);
      // Hard reload clears all Nuxt useAsyncData/callOnce cache
      if (import.meta.client) {
        globalThis.location.assign("/login");
      } else {
        await navigateTo("/login");
      }
    },

    async _handle401() {
      await navigateTo("/login");
    },

    dismissToast(id: string) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },

    clearFlash() {
      this.flashShopId = null;
    },

    // ── Hydration setters ──
    setTasks(tasks: Task[]) {
      this.tasks = tasks;
    },

    setInventory(items: InventoryItem[]) {
      this.inventory = items;
    },

    setShopping(items: ShoppingItem[]) {
      this.shopping = items;
    },

    setHistory(entries: HistoryEntry[]) {
      this.history = entries;
    },

    setMembers(members: Member[]) {
      this.members = members;
    },

    setHousehold(h: Household) {
      this.household = h;
    },

    setCurrentUser(user: { id: string; name: string; role: string }) {
      this.currentUser = user.name;
      this.currentUserId = user.id;
      this.authed = true;
    },

    // ── Tasks ──
    async toggleTask(id: string) {
      const tk = this.tasks.find((t) => t.id === id);
      if (!tk) return;
      const previousDone = tk.done;
      const previousDoneBy = tk.doneBy;
      const willDo = !tk.done;
      const who = tk.assignee ?? this.currentUserId;
      const member = this.members.find((m) => m.id === who);
      const prevWeekXp = member?.weekXp;
      const prevTotalXp = member?.totalXp;
      if (member) {
        member.weekXp = Math.max(0, member.weekXp + (willDo ? tk.xp : -tk.xp));
        member.totalXp = Math.max(
          0,
          member.totalXp + (willDo ? tk.xp : -tk.xp),
        );
      }
      if (willDo) {
        this._toast({
          kind: "xp",
          title: `+${tk.xp} XP`,
          body: `${member?.name.split(" ")[0] ?? "You"} finished "${tk.title}"`,
          celebrate: tk.xp >= 30,
        });
      }
      tk.done = willDo;
      tk.doneBy = willDo ? who : null;
      try {
        await $fetch("/api/tasks", {
          method: "PATCH",
          body: { id, done: tk.done, doneBy: tk.doneBy },
        });
        if (member) {
          await $fetch("/api/members", {
            method: "PATCH",
            body: { id: who, weekXp: member.weekXp, totalXp: member.totalXp },
          });
        }
      } catch (err) {
        tk.done = previousDone;
        tk.doneBy = previousDoneBy;
        if (member && prevWeekXp !== undefined && prevTotalXp !== undefined) {
          member.weekXp = prevWeekXp;
          member.totalXp = prevTotalXp;
        }
        this._toast({
          kind: "info",
          title: "Update failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401) {
          await this._handle401();
        }
      }
    },

    async claimTask(id: string) {
      const tk = this.tasks.find((t) => t.id === id);
      if (!tk) return;
      const previousAssignee = tk.assignee;
      tk.assignee = this.currentUserId;
      try {
        await $fetch("/api/tasks", {
          method: "PATCH",
          body: { id, assignee: this.currentUserId },
        });
      } catch (err) {
        tk.assignee = previousAssignee;
        this._toast({
          kind: "info",
          title: "Update failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401) {
          await this._handle401();
        }
      }
    },

    async saveTask(data: Partial<Task> & { title: string }) {
      if (!data.id) {
        try {
          const created = await $fetch<Task>("/api/tasks", {
            method: "POST",
            body: data,
          });
          this.tasks.push(created);
        } catch (err) {
          this._toast({
            kind: "info",
            title: "Failed to create task",
            body: "Please try again",
          });
          if ((err as { statusCode?: number })?.statusCode === 401) {
            await this._handle401();
          }
        }
        return;
      }
      const idx = this.tasks.findIndex((t) => t.id === data.id);
      const previous = idx === -1 ? null : { ...this.tasks[idx] };
      if (idx !== -1)
        this.tasks[idx] = { ...this.tasks[idx]!, ...data } as Task;
      try {
        await $fetch("/api/tasks", { method: "PATCH", body: data });
      } catch (err) {
        if (idx !== -1 && previous) this.tasks[idx] = previous as Task;
        this._toast({
          kind: "info",
          title: "Update failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401)
          await this._handle401();
      }
    },

    async deleteTask(id: string) {
      const previousTasks = [...this.tasks];
      this.tasks = this.tasks.filter((t) => t.id !== id);
      try {
        await $fetch("/api/tasks", {
          method: "DELETE",
          body: { id },
        });
      } catch (err) {
        this.tasks = previousTasks;
        this._toast({
          kind: "info",
          title: "Delete failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401) {
          await this._handle401();
        }
      }
    },

    async resetWeek() {
      const toDelete = this.tasks.filter((tk) => !tk.recurring);
      this.tasks = this.tasks.filter((tk) => tk.recurring);
      this.tasks.forEach((tk) => {
        tk.done = false;
        tk.doneBy = null;
      });
      this.members.forEach((m) => {
        m.weekXp = 0;
      });
      const key = this.weekKey;
      this.household.lastResetWeek = key;
      this._toast({
        kind: "info",
        title: `Week ${this.weekNo} started`,
        body: "Recurring tasks reset · leaderboard cleared",
      });
      await Promise.allSettled([
        ...toDelete.map((tk) =>
          $fetch("/api/tasks", { method: "DELETE", body: { id: tk.id } }),
        ),
        $fetch("/api/household", {
          method: "PATCH",
          body: { lastResetWeek: key },
        }),
      ]);
    },

    async checkAutoReset() {
      const current = this.weekKey;
      if (!this.household.lastResetWeek) {
        this.household.lastResetWeek = current;
        await $fetch("/api/household", {
          method: "PATCH",
          body: { lastResetWeek: current },
        });
        return;
      }
      if (this.household.lastResetWeek !== current) {
        await this.resetWeek();
      }
    },

    // ── Inventory ──
    async setInvQty(id: string, qty: number) {
      qty = Math.max(0, qty);
      const item = this.inventory.find((i) => i.id === id);
      if (!item) return;
      const previousQty = item.qty;
      item.qty = qty;
      let tempId: string | null = null;
      if (qty <= item.min) {
        const exists = this.shopping.some((sh) => sh.invId === id);
        if (!exists) {
          tempId = "temp_" + Date.now().toString(36);
          const shopQty = Math.max(1, item.optimal - qty);
          this.shopping.unshift({
            id: tempId,
            name: item.name,
            source: "auto",
            invId: id,
            qty: shopQty,
            price: item.price,
            checked: false,
          });
          this.flashShopId = tempId;
          this._toast({
            kind: "restock",
            title: "Added to shopping list",
            body: `${item.name} dropped to ${qty} (min ${item.min})`,
            link: "shopping",
          });
        }
      }
      try {
        await $fetch("/api/inventory", { method: "PATCH", body: { id, qty } });
        if (tempId) {
          const shopQty = Math.max(1, item.optimal - qty);
          const created = await $fetch<ShoppingItem>("/api/shopping", {
            method: "POST",
            body: {
              name: item.name,
              source: "auto",
              invId: id,
              qty: shopQty,
              price: item.price,
            },
          });
          const idx = this.shopping.findIndex((sh) => sh.id === tempId);
          if (idx !== -1) this.shopping[idx] = created;
          if (this.flashShopId === tempId) this.flashShopId = created.id;
        }
      } catch (err) {
        item.qty = previousQty;
        if (tempId) {
          this.shopping = this.shopping.filter((sh) => sh.id !== tempId);
        }
        this._toast({
          kind: "info",
          title: "Update failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401) {
          await this._handle401();
        }
      }
    },

    async saveInv(data: Partial<InventoryItem> & { name: string }) {
      if (!data.id) {
        try {
          const created = await $fetch<InventoryItem>("/api/inventory", {
            method: "POST",
            body: data,
          });
          this.inventory.push(created);
        } catch (err) {
          this._toast({
            kind: "info",
            title: "Failed to create item",
            body: "Please try again",
          });
          if ((err as { statusCode?: number })?.statusCode === 401) {
            await this._handle401();
          }
        }
        return;
      }
      const idx = this.inventory.findIndex((i) => i.id === data.id);
      const previous = idx === -1 ? null : { ...this.inventory[idx] };
      let tempId: string | null = null;
      if (idx !== -1) {
        this.inventory[idx] = {
          ...this.inventory[idx]!,
          ...data,
        } as InventoryItem;
        const item = this.inventory[idx]!;
        if (
          item.qty <= item.min &&
          !this.shopping.some((sh) => sh.invId === item.id)
        ) {
          tempId = "temp_" + Date.now().toString(36);
          const shopQty = Math.max(1, item.optimal - item.qty);
          this.shopping.unshift({
            id: tempId,
            name: item.name,
            source: "auto",
            invId: item.id,
            qty: shopQty,
            price: item.price,
            checked: false,
          });
          this.flashShopId = tempId;
          this._toast({
            kind: "restock",
            title: "Added to shopping list",
            body: `${item.name} is at or below its minimum`,
            link: "shopping",
          });
        }
      }
      try {
        await $fetch("/api/inventory", { method: "PATCH", body: data });
        if (tempId) {
          const item = this.inventory[idx]!;
          const shopQty = Math.max(1, item.optimal - item.qty);
          const created = await $fetch<ShoppingItem>("/api/shopping", {
            method: "POST",
            body: {
              name: item.name,
              source: "auto",
              invId: item.id,
              qty: shopQty,
              price: item.price,
            },
          });
          const si = this.shopping.findIndex((sh) => sh.id === tempId);
          if (si !== -1) this.shopping[si] = created;
          if (this.flashShopId === tempId) this.flashShopId = created.id;
        }
      } catch (err) {
        if (idx !== -1 && previous)
          this.inventory[idx] = previous as InventoryItem;
        if (tempId)
          this.shopping = this.shopping.filter((sh) => sh.id !== tempId);
        this._toast({
          kind: "info",
          title: "Update failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401)
          await this._handle401();
      }
    },

    deleteInv(id: string) {
      this.inventory = this.inventory.filter((i) => i.id !== id);
      this.shopping = this.shopping.filter((sh) => sh.invId !== id);
    },

    // ── Shopping ──
    toggleShop(id: string) {
      const item = this.shopping.find((sh) => sh.id === id);
      if (item) item.checked = !item.checked;
    },

    addManualShop(name: string) {
      if (!name.trim()) return;
      const tempId = "temp_" + Date.now().toString(36);
      this.shopping.push({
        id: tempId,
        name: name.trim(),
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: false,
      });
      this.flashShopId = tempId;
    },

    setShopQty(id: string, qty: number) {
      const item = this.shopping.find((sh) => sh.id === id);
      if (item) item.qty = Math.max(1, qty);
    },

    setShopPrice(id: string, price: number | null) {
      const item = this.shopping.find((sh) => sh.id === id);
      if (item) item.price = price;
    },

    removeShop(id: string) {
      this.shopping = this.shopping.filter((sh) => sh.id !== id);
    },

    async checkout() {
      const checked = this.shopping.filter((sh) => sh.checked);
      if (!checked.length) return;
      this.inventory.forEach((i) => {
        const hit = checked.find((sh) => sh.invId === i.id);
        if (hit) i.qty = i.optimal;
      });
      const total = checked.reduce(
        (sum, sh) => sum + (sh.price ?? 0) * sh.qty,
        0,
      );
      const historyEntry: Omit<HistoryEntry, "id"> = {
        date: new Date().toISOString().slice(0, 10),
        items: checked.map((sh) => ({
          name: sh.name,
          qty: sh.qty,
          price: sh.price,
        })),
        total,
      };
      const restocked = checked.filter((sh) => sh.invId).length;
      this.shopping = this.shopping.filter((sh) => !sh.checked);
      this._toast({
        kind: "check",
        title: "Purchase logged",
        body: `${checked.length} item${checked.length > 1 ? "s" : ""}${restocked ? " · " + restocked + " restocked" : ""} · ${money(total, this.household.currency)}`,
        link: "history",
      });
      try {
        const created = await $fetch<HistoryEntry>("/api/history", {
          method: "POST",
          body: historyEntry,
        });
        this.history.unshift(created);
        for (const sh of checked) {
          await $fetch("/api/shopping", {
            method: "DELETE",
            body: { id: sh.id },
          });
        }
      } catch (err) {
        this._toast({
          kind: "info",
          title: "Sync failed",
          body: "Purchase recorded locally",
        });
        if ((err as { statusCode?: number })?.statusCode === 401) {
          await this._handle401();
        }
      }
    },

    // ── Household ──
    invite(email: string) {
      if (!email.trim()) return;
      this.members.push({
        id: "inv_" + Date.now().toString(36),
        name: "",
        email: email.trim(),
        role: "member",
        status: "pending",
        weekXp: 0,
        totalXp: 0,
      });
      this._toast({
        kind: "info",
        title: "Invitation sent",
        body: `Pending invite to ${email.trim()}`,
      });
    },

    revoke(id: string) {
      this.members = this.members.filter((m) => m.id !== id);
    },

    removeMember(id: string) {
      this.members = this.members.filter((m) => m.id !== id);
    },

    async renameHousehold(name: string) {
      const prev = this.household.name;
      this.household.name = name;
      try {
        await $fetch("/api/household", { method: "PATCH", body: { name } });
      } catch {
        this.household.name = prev;
        this._toast({ kind: "info", title: "Failed to rename household" });
      }
    },

    applyAccentColor() {
      if (!import.meta.client) return;
      const color = this.me.accentColor;
      if (color) {
        document.documentElement.style.setProperty("--accent", color);
      } else {
        document.documentElement.style.removeProperty("--accent");
      }
    },

    async saveSettings(data: {
      name: string;
      accentColor: string;
      avatarEmoji: string;
      avatarImage: string;
      weekStartDay?: "monday" | "sunday";
      currency?: string;
    }) {
      const member = this.members.find((m) => m.id === this.currentUserId);
      if (!member) return;
      const prev = {
        name: member.name,
        accentColor: member.accentColor,
        avatarEmoji: member.avatarEmoji,
        avatarImage: member.avatarImage,
        currentUser: this.currentUser,
        weekStartDay: this.household.weekStartDay,
        currency: this.household.currency,
      };
      member.name = data.name;
      member.accentColor = data.accentColor || undefined;
      member.avatarEmoji = data.avatarEmoji || undefined;
      member.avatarImage = data.avatarImage || undefined;
      this.currentUser = data.name;
      if (data.weekStartDay) this.household.weekStartDay = data.weekStartDay;
      if (data.currency) this.household.currency = data.currency;
      this.applyAccentColor();
      try {
        await $fetch("/api/members", {
          method: "PATCH",
          body: {
            id: this.currentUserId,
            name: data.name,
            accentColor: data.accentColor || null,
            avatarEmoji: data.avatarEmoji || null,
            avatarImage: data.avatarImage || null,
          },
        });
        const householdPatch: Record<string, string> = {};
        if (data.weekStartDay && data.weekStartDay !== prev.weekStartDay) {
          householdPatch.weekStartDay = data.weekStartDay;
        }
        if (data.currency && data.currency !== prev.currency) {
          householdPatch.currency = data.currency;
        }
        if (Object.keys(householdPatch).length) {
          await $fetch("/api/household", {
            method: "PATCH",
            body: householdPatch,
          });
        }
        this._toast({ kind: "info", title: "Settings saved" });
      } catch (err) {
        member.name = prev.name;
        member.accentColor = prev.accentColor;
        member.avatarEmoji = prev.avatarEmoji;
        member.avatarImage = prev.avatarImage;
        this.currentUser = prev.currentUser;
        if (data.weekStartDay) this.household.weekStartDay = prev.weekStartDay;
        if (data.currency) this.household.currency = prev.currency;
        this.applyAccentColor();
        this._toast({
          kind: "info",
          title: "Save failed",
          body: "Changes reverted",
        });
        if ((err as { statusCode?: number })?.statusCode === 401) {
          await this._handle401();
        }
      }
    },
  },
});
