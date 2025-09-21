export interface UserInventoryItem {
  itemName: string;
  quantity: number;
}

export interface UserInventoryByCategory {
  food: UserInventoryItem[];
  health: UserInventoryItem[];
  gift: UserInventoryItem[];
  decoration: UserInventoryItem[];
}

export interface UserInventory {
  items: UserInventoryByCategory;
  totalItems: number;
}

export type InventoryCategory = keyof UserInventoryByCategory;