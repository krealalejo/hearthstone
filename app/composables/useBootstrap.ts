import type {
  InventoryItem,
  ShoppingItem,
  TodoItem,
  Member,
  Household,
  Task,
  HistoryEntry,
} from "~/stores/home";
import { useHomeStore } from "~/stores/home";
import { api } from "~/utils/api";

export function useBootstrap() {
  const store = useHomeStore();
  const headers = useRequestHeaders(["cookie"]);

  return useAsyncData(
    "bootstrap",
    async () => {
      const [
        user,
        inventory,
        shopping,
        members,
        household,
        tasks,
        history,
        todos,
      ] = await Promise.all([
        api<{ userId: string; name?: string; role: string }>(
          "/api/auth/me",
          { headers },
        ).catch(() => null),
        api<InventoryItem[]>("/api/inventory", { headers }).catch(() => null),
        api<ShoppingItem[]>("/api/shopping", { headers }).catch(() => null),
        api<Member[]>("/api/members", { headers }).catch(() => null),
        api<Household>("/api/household", { headers }).catch(() => null),
        api<Task[]>("/api/tasks", { headers }).catch(() => null),
        api<HistoryEntry[]>("/api/history", { headers }).catch(() => null),
        api<TodoItem[]>("/api/todos", { headers }).catch(() => null),
      ]);

      if (user) {
        store.setCurrentUser({
          id: user.userId,
          name: user.name ?? "",
          role: user.role,
        });
      }
      if (inventory) store.setInventory(inventory);
      if (shopping) store.setShopping(shopping);
      if (members) store.setMembers(members);
      if (household) store.setHousehold(household);
      if (tasks) store.setTasks(tasks);
      if (history) store.setHistory(history);
      if (todos) store.setTodos(todos);

      store.setBootstrapped(true);

      if (import.meta.client) {
        store.applyAccentColor();
        await store.checkAutoReset();
      }
      return true;
    },
    { lazy: true, server: false },
  );
}
