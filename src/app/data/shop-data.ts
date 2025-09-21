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
      itemName: '麵包蟲',
      productType: 'food',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 5,
        currentFriendship: 2
      }
    },
    {
      itemName: '營養米',
      productType: 'food',
      price: 11,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 8,
        currentFriendship: 2
      }
    },
    {
      itemName: '炸雞',
      productType: 'food',
      price: 30,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 20,
        currentFriendship: 8
      }
    },
    {
      itemName: '糖果',
      productType: 'food',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 5,
        currentFriendship: 8
      }
    },
    {
      itemName: '煙燻鮭魚',
      productType: 'food',
      price: 15,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 15,
        currentFriendship: 5
      }
    },
    {
      itemName: '狗飼料',
      productType: 'food',
      price: 13,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 20,
        currentFriendship: 2
      }
    },
    {
      itemName: '冰淇淋',
      productType: 'food',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHunger: 2,
        currentFriendship: 10
      }
    }
  ],
  health: [
    {
      itemName: '西藥',
      productType: 'health',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 10,
        currentWellness: 15,
        maxHealth: -10
      }
    },
    {
      itemName: '人蔘',
      productType: 'health',
      price: 80,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 2,
        currentWellness: 10,
        maxHealth: 5
      }
    },
    {
      itemName: '中藥包',
      productType: 'health',
      price: 40,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 1,
        currentWellness: 1,
        maxHealth: 1
      }
    },
    {
      itemName: '頭痛藥',
      productType: 'health',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 2,
        currentWellness: 15,
        maxHealth: -2
      }
    },
    {
      itemName: '整腸藥',
      productType: 'health',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 2,
        currentWellness: 15,
        maxHealth: -2
      }
    },
    {
      itemName: '胃藥',
      productType: 'health',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 2,
        currentWellness: 15,
        maxHealth: -2
      }
    },
    {
      itemName: '感冒藥',
      productType: 'health',
      price: 10,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentHealth: 2,
        currentWellness: 15,
        maxHealth: -2
      }
    },
    {
      itemName: '死者甦醒',
      productType: 'health',
      price: 1000,
      reborn: 1,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        maxHealth: -2
      }
    },
    {
      itemName: '冰凍藥丸',
      productType: 'health',
      price: 300,
      reborn: 0,
      freeze: 1,
      effect: {
        ...defaultProductEffect
      }
    }
  ],
  gift: [
    {
      itemName: '小雞娃娃',
      productType: 'gifts',
      price: 30,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 5
      }
    },
    {
      itemName: '智慧型手機',
      productType: 'gifts',
      price: 150,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 50
      }
    }
  ],
  decoration: [
    {
      itemName: '星星裝飾',
      productType: 'decorations',
      price: 100,
      reborn: 0,
      freeze: 0,
      effect: {
        ...defaultProductEffect,
        currentFriendship: 5
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