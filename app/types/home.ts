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
  locale?: "en" | "es" | "ca";
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
