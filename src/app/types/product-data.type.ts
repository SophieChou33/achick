export interface ProductDataEffect {
  currentHealth: number;
  currentHunger: number;
  maxHealth: number;
  currentFriendship: number;
  currentWellness: number;
}

export interface ProductItem {
  itemName: string;
  productType: string;
  price: number;
  reborn: 0 | 1;
  freeze: 0 | 1;
  effect: ProductDataEffect;
}

export interface ShopData {
  food: ProductItem[];
  health: ProductItem[];
  gift: ProductItem[];
  decoration: ProductItem[];
}