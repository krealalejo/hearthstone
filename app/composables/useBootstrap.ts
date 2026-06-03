import type {
  InventoryItem,
  ShoppingItem,
  Member,
  Household,
  Task,
  HistoryEntry,
} from "~/stores/home";
import { useHomeStore } from "~/stores/home";

export async function useBootstrap() {
  const store = useHomeStore();
  const headers = useRequestHeaders(["cookie"]);

  const [
    { data: userData },
    { data: invData },
    { data: shopData },
    { data: membersData },
    { data: householdData },
    { data: tasksData },
    { data: historyData },
  ] = await Promise.all([
    useAsyncData("current-user", () =>
      $fetch<{ userId: string; name?: string; role: string }>("/api/auth/me", {
        headers,
      }).catch(() => null),
    ),
    useAsyncData("inventory", () =>
      $fetch<InventoryItem[]>("/api/inventory", { headers }),
    ),
    useAsyncData("shopping", () =>
      $fetch<ShoppingItem[]>("/api/shopping", { headers }),
    ),
    useAsyncData("members", () =>
      $fetch<Member[]>("/api/members", { headers }),
    ),
    useAsyncData("household", () =>
      $fetch<Household>("/api/household", { headers }),
    ),
    useAsyncData("tasks", () => $fetch<Task[]>("/api/tasks", { headers })),
    useAsyncData("history", () =>
      $fetch<HistoryEntry[]>("/api/history", { headers }),
    ),
  ]);

  if (userData.value) {
    store.setCurrentUser({
      id: userData.value.userId,
      name: userData.value.name ?? "",
      role: userData.value.role,
    });
  }
  if (invData.value) store.setInventory(invData.value);
  if (shopData.value) store.setShopping(shopData.value);
  if (membersData.value) store.setMembers(membersData.value);
  if (householdData.value) store.setHousehold(householdData.value);
  if (tasksData.value) store.setTasks(tasksData.value);
  if (historyData.value) store.setHistory(historyData.value);

  if (import.meta.client) {
    store.applyAccentColor();
    await store.checkAutoReset();
  }
}
