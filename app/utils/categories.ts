export const CATEGORY_IDS = ["food", "cleaning", "hygiene", "misc"] as const;

export type Category = (typeof CATEGORY_IDS)[number];

export const CATEGORIES: { id: Category; labelKey: string; icon: string }[] = [
  { id: "food", labelKey: "inventory.catFood", icon: "mdi-basket" },
  { id: "cleaning", labelKey: "inventory.catCleaning", icon: "mdi-spray" },
  {
    id: "hygiene",
    labelKey: "inventory.catHygiene",
    icon: "mdi-toothbrush-paste",
  },
  { id: "misc", labelKey: "inventory.catMisc", icon: "mdi-package-variant" },
];
