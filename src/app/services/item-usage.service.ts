import { Injectable } from '@angular/core';
import { UserInventoryService } from '../data/user-inventory-data';
import { ShopDataService } from '../data/shop-data';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { PetStats } from '../types/pet-stats.type';
import { ProductItem } from '../types/product-data.type';
import { sources } from '../sources';
import { getBreedByName } from '../data/breed-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { ModalService } from './modal.service';

@Injectable({
  providedIn: 'root'
})
export class ItemUsageService {

  /**
   * 使用物品 (with confirmation check)
   */
  static async useItemWithConfirmation(itemName: string, quantity: number = 1, modalService: ModalService): Promise<{ success: boolean; message: string; effects?: string[] }> {
    // 檢查背包中是否有足夠的物品
    if (!UserInventoryService.hasEnoughItems(itemName, quantity)) {
      const currentQuantity = UserInventoryService.getItemQuantity(itemName);
      return {
        success: false,
        message: `${itemName} 數量不足，目前只有 ${currentQuantity} 個`
      };
    }

    // 從商店資料中獲取物品資訊
    const shopData = ShopDataService.loadShopData();
    const productItem = ShopDataService.getProductByName(itemName, shopData);

    if (!productItem) {
      return {
        success: false,
        message: `找不到物品 "${itemName}" 的資訊`
      };
    }

    // 檢查是否會增加飽足感且當前飽足感已滿
    const currentPetStats = PetStatsService.loadPetStats();
    if (productItem.effect.currentHunger > 0 && currentPetStats.currentHunger >= 100) {
      const confirmed = await modalService.confirm(
        `電子雞已經不餓了，目前飽足感為 100！\n\n是否確認還是要餵食 ${itemName}？`,
        '🍽️ 餵食確認',
        '確認餵食',
        '取消'
      );

      if (!confirmed) {
        return {
          success: false,
          message: '已取消餵食'
        };
      }
    }

    // 消耗背包中的物品
    const inventoryResult = UserInventoryService.useItem(itemName, quantity);
    if (!inventoryResult.success) {
      return {
        success: false,
        message: inventoryResult.message
      };
    }

    // 執行物品效果
    const effectResults = this.applyItemEffects(productItem, quantity);

    return {
      success: true,
      message: `成功使用 ${quantity} 個 ${itemName}`,
      effects: effectResults
    };
  }

  /**
   * 使用物品 (原有方法，保持向後兼容)
   */
  static useItem(itemName: string, quantity: number = 1): { success: boolean; message: string; effects?: string[] } {
    // 檢查背包中是否有足夠的物品
    if (!UserInventoryService.hasEnoughItems(itemName, quantity)) {
      const currentQuantity = UserInventoryService.getItemQuantity(itemName);
      return {
        success: false,
        message: `${itemName} 數量不足，目前只有 ${currentQuantity} 個`
      };
    }

    // 從商店資料中獲取物品資訊
    const shopData = ShopDataService.loadShopData();
    const productItem = ShopDataService.getProductByName(itemName, shopData);

    if (!productItem) {
      return {
        success: false,
        message: `找不到物品 "${itemName}" 的資訊`
      };
    }

    // 消耗背包中的物品
    const inventoryResult = UserInventoryService.useItem(itemName, quantity);
    if (!inventoryResult.success) {
      return {
        success: false,
        message: inventoryResult.message
      };
    }

    // 執行物品效果
    const effectResults = this.applyItemEffects(productItem, quantity);

    return {
      success: true,
      message: `成功使用 ${quantity} 個 ${itemName}`,
      effects: effectResults
    };
  }

  /**
   * 應用物品效果
   */
  private static applyItemEffects(productItem: ProductItem, quantity: number): string[] {
    const currentPetStats = PetStatsService.loadPetStats();
    const effects: string[] = [];
    let updatedStats = { ...currentPetStats };

    // 應用 freeze 效果
    if (productItem.freeze === 1) {
      updatedStats.timeStopping = true;
      updatedStats.isFreezing = true;
      effects.push('電子雞已被冰凍');
    }

    // 應用 reborn 效果
    if (productItem.reborn === 1) {
      updatedStats.lifeCycle = 'CHILD';
      updatedStats.timeStopping = false; // 復活後重置時間停止狀態
      updatedStats.currentHealth = 20; // 復活後生命值設定為 20
      effects.push('電子雞已復活');
    }

    // 應用數值效果 (乘以使用數量)
    const effect = productItem.effect;

    if (effect.currentHealth !== 0) {
      const healthChange = effect.currentHealth * quantity;
      updatedStats.currentHealth = Math.max(0, Math.min(updatedStats.maxHealth, updatedStats.currentHealth + healthChange));
      effects.push(`生命值 ${healthChange > 0 ? '+' : ''}${healthChange}`);
    }

    if (effect.currentHunger !== 0) {
      const hungerChange = effect.currentHunger * quantity;
      updatedStats.currentHunger = Math.max(0, Math.min(100, updatedStats.currentHunger + hungerChange));
      effects.push(`飽足感 ${hungerChange > 0 ? '+' : ''}${hungerChange}`);
    }

    if (effect.currentFriendship !== 0) {
      const friendshipChange = effect.currentFriendship * quantity;
      updatedStats.currentFriendship = Math.max(0, Math.min(100, updatedStats.currentFriendship + friendshipChange));
      effects.push(`好感度 ${friendshipChange > 0 ? '+' : ''}${friendshipChange}`);
    }

    if (effect.currentWellness !== 0) {
      const wellnessChange = effect.currentWellness * quantity;
      updatedStats.currentWellness = Math.max(0, Math.min(100, updatedStats.currentWellness + wellnessChange));
      effects.push(`健康度 ${wellnessChange > 0 ? '+' : ''}${wellnessChange}`);
    }

    if (effect.maxHealth !== 0) {
      const maxHealthChange = effect.maxHealth * quantity;
      updatedStats.maxHealth = Math.max(1, updatedStats.maxHealth + maxHealthChange);
      effects.push(`最大生命值 ${maxHealthChange > 0 ? '+' : ''}${maxHealthChange}`);

      // 檢查當前生命值是否溢出新的最大生命值
      if (updatedStats.currentHealth > updatedStats.maxHealth) {
        updatedStats.currentHealth = updatedStats.maxHealth;
      }
    }

    // 處理疾病治療邏輯
    const diseaseEffects = this.handleDiseaseHealing(productItem, quantity);
    effects.push(...diseaseEffects);

    // 儲存更新後的電子雞數值
    PetStatsService.savePetStats(updatedStats);

    return effects;
  }

  /**
   * 處理疾病治療邏輯
   */
  private static handleDiseaseHealing(productItem: ProductItem, quantity: number): string[] {
    const effects: string[] = [];
    const currentStateData = StateDataService.loadStateData();

    // 建立藥物名稱到疾病的對應表
    const medicineToDisease: Record<string, { disease: string; name: string }> = {
      '頭痛藥': { disease: 'headache', name: '偏頭痛' },
      '整腸藥': { disease: 'diarrhea', name: '拉肚子' },
      '胃藥': { disease: 'gastricUlcer', name: '胃潰瘍' },
      '感冒藥': { disease: 'flu', name: '流感' }
    };

    const medicineInfo = medicineToDisease[productItem.itemName];

    if (medicineInfo) {
      const diseaseKey = medicineInfo.disease as keyof typeof currentStateData;
      const stateValue = currentStateData[diseaseKey];

      // 檢查是否有對應的疾病狀態
      if ('isActive' in stateValue && (stateValue as any).isActive === 1) {
        // 治療疾病
        StateDataService.deactivateState(diseaseKey, currentStateData);
        effects.push(`治療了 ${medicineInfo.name}`);

        // 顯示治療成功的toastr通知
        ToastrService.success(`💊 ${medicineInfo.name} 已治癒！`, 3000);
      } else {
        // 沒有對應的疾病
        ToastrService.info(`💊 電子雞沒有 ${medicineInfo.name}，但藥物仍然生效`, 3000);
      }
    }

    return effects;
  }

  /**
   * 獲取物品圖片路徑
   */
  static getItemImagePath(productItem: ProductItem): string {
    const { productType } = productItem;

    // 根據 productType 和 item 鍵名獲取圖片路徑
    // sources.store.{{productType}}.{{item}}

    // 首先需要從物品名稱反推 item 鍵名
    const itemKey = this.getItemKeyFromProduct(productItem);

    if (!itemKey) {
      return '';
    }

    try {
      const storeImages = (sources.store as any)[productType];
      return storeImages[itemKey] || '';
    } catch (error) {
      console.error('Failed to get item image path:', error);
      return '';
    }
  }

  /**
   * 根據商品資訊獲取對應的 item 鍵名
   */
  private static getItemKeyFromProduct(productItem: ProductItem): string {
    const shopData = ShopDataService.loadShopData();

    // 建立商品名稱到 item 鍵名的對應表
    const itemNameToKeyMap: Record<string, string> = {
      '麵包蟲': 'worm',
      '營養米': 'rice',
      '炸雞': 'chicken',
      '糖果': 'candy',
      '煙燻鮭魚': 'fish',
      '狗飼料': 'dogFood',
      '冰淇淋': 'icecream',
      '西藥': 'pill',
      '人蔘': 'ginseng',
      '中藥包': 'chineseMedicine',
      '頭痛藥': 'pillForHeadache',
      '整腸藥': 'pillForDiarrhea',
      '胃藥': 'pillForGastricUlcer',
      '感冒藥': 'pillForFlu',
      '死者甦醒': 'rebornPill',
      '冰凍藥丸': 'freezePill',
      '小雞娃娃': 'doll',
      '智慧型手機': 'cellphone',
      '星星裝飾': 'star'
    };

    return itemNameToKeyMap[productItem.itemName] || '';
  }

  /**
   * 檢查物品是否可以使用
   */
  static canUseItem(itemName: string): { canUse: boolean; reason?: string } {
    const currentPetStats = PetStatsService.loadPetStats();

    // 如果電子雞尚未生成，不能使用物品
    if (currentPetStats.rare === null) {
      return {
        canUse: false,
        reason: '電子雞尚未出生，無法使用物品'
      };
    }

    // 如果電子雞正在離家出走，不能使用物品
    if (currentPetStats.isLeaving) {
      return {
        canUse: false,
        reason: '電子雞正在離家出走，無法使用物品'
      };
    }

    // 檢查特殊物品的使用條件
    const shopData = ShopDataService.loadShopData();
    const productItem = ShopDataService.getProductByName(itemName, shopData);

    if (productItem) {
      // 死者甦醒只能在電子雞死亡時使用，且不能在熟成狀態下使用
      if (productItem.reborn === 1) {
        if (currentPetStats.lifeCycle === 'COOKED') {
          return {
            canUse: false,
            reason: '已熟成的電子雞無法復活'
          };
        }
        if (currentPetStats.lifeCycle !== 'DEAD') {
          return {
            canUse: false,
            reason: '電子雞還活著，不需要使用復活物品'
          };
        }
      }

      // 冰凍藥丸只能在電子雞沒有被冰凍時使用
      if (productItem.freeze === 1 && currentPetStats.timeStopping) {
        return {
          canUse: false,
          reason: '電子雞已經被冰凍，無法重複使用冰凍物品'
        };
      }
    }

    return { canUse: true };
  }

  /**
   * 獲取物品使用預覽
   */
  static getItemUsagePreview(itemName: string, quantity: number = 1): { success: boolean; preview?: string[]; message?: string } {
    const shopData = ShopDataService.loadShopData();
    const productItem = ShopDataService.getProductByName(itemName, shopData);

    if (!productItem) {
      return {
        success: false,
        message: `找不到物品 "${itemName}" 的資訊`
      };
    }

    const preview: string[] = [];
    const effect = productItem.effect;

    // 預覽數值變化
    if (effect.currentHealth !== 0) {
      const change = effect.currentHealth * quantity;
      preview.push(`生命值 ${change > 0 ? '+' : ''}${change}`);
    }

    if (effect.currentHunger !== 0) {
      const change = effect.currentHunger * quantity;
      preview.push(`飽足感 ${change > 0 ? '+' : ''}${change}`);
    }

    if (effect.currentFriendship !== 0) {
      const change = effect.currentFriendship * quantity;
      preview.push(`好感度 ${change > 0 ? '+' : ''}${change}`);
    }

    if (effect.currentWellness !== 0) {
      const change = effect.currentWellness * quantity;
      preview.push(`健康度 ${change > 0 ? '+' : ''}${change}`);
    }

    if (effect.maxHealth !== 0) {
      const change = effect.maxHealth * quantity;
      preview.push(`最大生命值 ${change > 0 ? '+' : ''}${change}`);
    }

    // 預覽特殊效果
    if (productItem.freeze === 1) {
      preview.push('將冰凍電子雞');
    }

    if (productItem.reborn === 1) {
      preview.push('將復活電子雞');
    }

    return {
      success: true,
      preview
    };
  }
}