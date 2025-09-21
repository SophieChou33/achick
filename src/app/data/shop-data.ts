import { ShopData, ProductItem, ProductDataEffect } from '../types/product-data.type';
import { UserDataService } from './user-data';
import { UserInventoryService } from './user-inventory-data';

const defaultProductEffect: ProductDataEffect = {
  currentHealth: 0,
  currentHunger: 0,
  maxHealth: 0,
  currentFriendship: 0,
  currentWellness: 0
};

export const defaultShopData: ShopData = {
  food: [
    {
      itemName: '小魚乾',
      productType: '食物',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 20,
        currentFriendship: 5
      }
    },
    {
      itemName: '高級飼料',
      productType: '食物',
      price: 25,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 50,
        currentFriendship: 10,
        currentWellness: 5
      }
    }
  ],
  health: [
    {
      itemName: '維他命',
      productType: '健康',
      price: 30,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentWellness: 25,
        currentHealth: 10
      }
    },
    {
      itemName: '特效藥',
      productType: '健康',
      price: 80,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentWellness: 50,
        currentHealth: 30,
        maxHealth: 10
      }
    }
  ],
  gift: [
    {
      itemName: '小玩具',
      productType: '禮物',
      price: 15,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 30
      }
    },
    {
      itemName: '珍貴寶石',
      productType: '禮物',
      price: 100,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 80,
        currentHealth: 5
      }
    }
  ],
  decoration: [
    {
      itemName: '彩色地毯',
      productType: '裝飾',
      price: 50,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 15,
        currentWellness: 10
      }
    },
    {
      itemName: '豪華燈具',
      productType: '裝飾',
      price: 150,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 40,
        currentWellness: 20,
        maxHealth: 5
      }
    }
  ]
};

export class ShopDataService {
  private static readonly STORAGE_KEY = 'achick_shop_data';

  static loadShopData(): ShopData {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultShopData, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to parse shop data:', error);
      }
    }
    return { ...defaultShopData };
  }

  static saveShopData(data: ShopData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save shop data:', error);
    }
  }

  static getProductsByCategory(category: keyof ShopData, shopData: ShopData): ProductItem[] {
    return shopData[category] || [];
  }

  static getProductByName(itemName: string, shopData: ShopData): ProductItem | null {
    const allCategories: (keyof ShopData)[] = ['food', 'health', 'gift', 'decoration'];

    for (const category of allCategories) {
      const product = shopData[category].find(item => item.itemName === itemName);
      if (product) {
        return product;
      }
    }
    return null;
  }

  static getTotalProductCount(shopData: ShopData): number {
    return shopData.food.length + shopData.health.length + shopData.gift.length + shopData.decoration.length;
  }

  static getProductsByPriceRange(minPrice: number, maxPrice: number, shopData: ShopData): ProductItem[] {
    const allProducts: ProductItem[] = [
      ...shopData.food,
      ...shopData.health,
      ...shopData.gift,
      ...shopData.decoration
    ];

    return allProducts.filter(product =>
      product.price >= minPrice && product.price <= maxPrice
    );
  }

  static purchaseProduct(productItem: ProductItem, quantity: number = 1): { success: boolean; message: string } {
    const userData = UserDataService.loadUserData();
    const totalCost = productItem.price * quantity;

    if (userData.coins < totalCost) {
      return {
        success: false,
        message: `金幣不足！需要 ${totalCost} 金幣，目前只有 ${userData.coins} 金幣。`
      };
    }

    const spendResult = UserDataService.spendCoins(totalCost, userData);
    if (spendResult.success) {
      // 將物品添加到使用者背包
      const inventoryResult = UserInventoryService.addItem(productItem.itemName, quantity);

      if (inventoryResult.success) {
        return {
          success: true,
          message: `成功購買 ${quantity} 個 ${productItem.itemName}！花費 ${totalCost} 金幣，物品已添加到背包。`
        };
      } else {
        // 如果添加到背包失敗，退還金幣
        UserDataService.addCoins(totalCost, userData);
        return {
          success: false,
          message: `購買失敗：${inventoryResult.message}`
        };
      }
    }

    return {
      success: false,
      message: '購買失敗，請稍後再試。'
    };
  }
}