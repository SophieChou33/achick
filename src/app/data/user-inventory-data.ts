import { UserInventory, UserInventoryByCategory, UserInventoryItem, InventoryCategory } from '../types/user-inventory.type';
import { ShopData, ProductItem } from '../types/product-data.type';
import { ShopDataService } from './shop-data';

const defaultUserInventory: UserInventory = {
  items: {
    food: [],
    health: [],
    gift: [],
    decoration: []
  },
  totalItems: 0
};

export class UserInventoryService {
  private static readonly STORAGE_KEY = 'achick_user_inventory';

  /**
   * 載入使用者持有物品資料
   */
  static loadUserInventory(): UserInventory {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 確保資料結構完整性
        return {
          items: {
            food: parsed.items?.food || [],
            health: parsed.items?.health || [],
            gift: parsed.items?.gift || [],
            decoration: parsed.items?.decoration || []
          },
          totalItems: this.calculateTotalItems(parsed.items || {})
        };
      } catch (error) {
        console.error('Failed to parse user inventory:', error);
      }
    }
    return { ...defaultUserInventory };
  }

  /**
   * 儲存使用者持有物品資料
   */
  static saveUserInventory(inventory: UserInventory): void {
    try {
      // 重新計算總數量
      inventory.totalItems = this.calculateTotalItems(inventory.items);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(inventory));
    } catch (error) {
      console.error('Failed to save user inventory:', error);
    }
  }

  /**
   * 計算總物品數量
   */
  private static calculateTotalItems(items: UserInventoryByCategory): number {
    return Object.values(items).reduce((total, categoryItems) => {
      return total + categoryItems.reduce((sum: number, item: UserInventoryItem) => sum + item.quantity, 0);
    }, 0);
  }

  /**
   * 添加物品到背包
   */
  static addItem(itemName: string, quantity: number = 1, inventory?: UserInventory): { success: boolean; message: string; inventory: UserInventory } {
    const currentInventory = inventory || this.loadUserInventory();

    // 從商店資料中找到物品資訊
    const shopData = ShopDataService.loadShopData();
    const productItem = ShopDataService.getProductByName(itemName, shopData);

    if (!productItem) {
      return {
        success: false,
        message: `物品 "${itemName}" 不存在`,
        inventory: currentInventory
      };
    }

    // 根據物品類型決定分類
    const category = this.getProductCategory(productItem, shopData);
    if (!category) {
      return {
        success: false,
        message: `無法判斷物品 "${itemName}" 的分類`,
        inventory: currentInventory
      };
    }

    // 查找是否已存在相同物品
    const existingItemIndex = currentInventory.items[category].findIndex(item => item.itemName === itemName);

    if (existingItemIndex >= 0) {
      // 物品已存在，增加數量
      currentInventory.items[category][existingItemIndex].quantity += quantity;
    } else {
      // 新物品，添加到背包
      currentInventory.items[category].push({
        itemName,
        quantity
      });
    }

    // 儲存更新後的背包
    this.saveUserInventory(currentInventory);

    return {
      success: true,
      message: `成功添加 ${quantity} 個 "${itemName}" 到背包`,
      inventory: currentInventory
    };
  }

  /**
   * 使用/消耗物品
   */
  static useItem(itemName: string, quantity: number = 1, inventory?: UserInventory): { success: boolean; message: string; inventory: UserInventory; productItem?: ProductItem } {
    const currentInventory = inventory || this.loadUserInventory();

    // 從商店資料中找到物品資訊
    const shopData = ShopDataService.loadShopData();
    const productItem = ShopDataService.getProductByName(itemName, shopData);

    if (!productItem) {
      return {
        success: false,
        message: `物品 "${itemName}" 不存在`,
        inventory: currentInventory
      };
    }

    // 根據物品類型決定分類
    const category = this.getProductCategory(productItem, shopData);
    if (!category) {
      return {
        success: false,
        message: `無法判斷物品 "${itemName}" 的分類`,
        inventory: currentInventory
      };
    }

    // 查找物品
    const existingItemIndex = currentInventory.items[category].findIndex(item => item.itemName === itemName);

    if (existingItemIndex < 0) {
      return {
        success: false,
        message: `背包中沒有 "${itemName}"`,
        inventory: currentInventory
      };
    }

    const existingItem = currentInventory.items[category][existingItemIndex];

    if (existingItem.quantity < quantity) {
      return {
        success: false,
        message: `${itemName} 數量不足，目前只有 ${existingItem.quantity} 個`,
        inventory: currentInventory
      };
    }

    // 減少物品數量
    existingItem.quantity -= quantity;

    // 如果數量為0則移除物品
    if (existingItem.quantity === 0) {
      currentInventory.items[category].splice(existingItemIndex, 1);
    }

    // 儲存更新後的背包
    this.saveUserInventory(currentInventory);

    return {
      success: true,
      message: `成功使用 ${quantity} 個 "${itemName}"`,
      inventory: currentInventory,
      productItem
    };
  }

  /**
   * 獲取特定物品的數量
   */
  static getItemQuantity(itemName: string, inventory?: UserInventory): number {
    const currentInventory = inventory || this.loadUserInventory();

    // 在所有分類中查找物品
    for (const category of Object.keys(currentInventory.items) as InventoryCategory[]) {
      const item = currentInventory.items[category].find(item => item.itemName === itemName);
      if (item) {
        return item.quantity;
      }
    }

    return 0;
  }

  /**
   * 獲取特定分類的所有物品
   */
  static getItemsByCategory(category: InventoryCategory, inventory?: UserInventory): UserInventoryItem[] {
    const currentInventory = inventory || this.loadUserInventory();
    return [...currentInventory.items[category]];
  }

  /**
   * 獲取所有物品（扁平化）
   */
  static getAllItems(inventory?: UserInventory): (UserInventoryItem & { category: InventoryCategory })[] {
    const currentInventory = inventory || this.loadUserInventory();
    const allItems: (UserInventoryItem & { category: InventoryCategory })[] = [];

    for (const category of Object.keys(currentInventory.items) as InventoryCategory[]) {
      currentInventory.items[category].forEach(item => {
        allItems.push({ ...item, category });
      });
    }

    return allItems;
  }

  /**
   * 清空背包
   */
  static clearInventory(): UserInventory {
    const emptyInventory = { ...defaultUserInventory };
    this.saveUserInventory(emptyInventory);
    return emptyInventory;
  }

  /**
   * 根據商品在商店資料中的位置判斷分類
   */
  private static getProductCategory(productItem: ProductItem, shopData: ShopData): InventoryCategory | null {
    const categories: InventoryCategory[] = ['food', 'health', 'gift', 'decoration'];

    for (const category of categories) {
      const found = shopData[category].find(item => item.itemName === productItem.itemName);
      if (found) {
        return category;
      }
    }

    return null;
  }

  /**
   * 檢查是否有足夠的物品
   */
  static hasEnoughItems(itemName: string, requiredQuantity: number, inventory?: UserInventory): boolean {
    return this.getItemQuantity(itemName, inventory) >= requiredQuantity;
  }

  /**
   * 獲取背包統計資訊
   */
  static getInventoryStats(inventory?: UserInventory): {
    totalItems: number;
    categoryCounts: Record<InventoryCategory, number>;
    uniqueItems: number;
  } {
    const currentInventory = inventory || this.loadUserInventory();

    const categoryCounts: Record<InventoryCategory, number> = {
      food: 0,
      health: 0,
      gift: 0,
      decoration: 0
    };

    let uniqueItems = 0;

    for (const category of Object.keys(currentInventory.items) as InventoryCategory[]) {
      const categoryItems = currentInventory.items[category];
      categoryCounts[category] = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
      uniqueItems += categoryItems.length;
    }

    return {
      totalItems: currentInventory.totalItems,
      categoryCounts,
      uniqueItems
    };
  }
}