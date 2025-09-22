import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { UserDataService } from '../data/user-data';

@Injectable({
  providedIn: 'root'
})
export class LowHealthTriggerService {
  private lastSickCheckTime: string | null = null;
  private lastLifeDamageTime: string | null = null;
  private lastDiseaseCheckTime: string | null = null;

  private healthCheckInterval?: number;
  private diseaseEffectsInterval?: number;

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * 啟動健康監控定時器
   */
  private startHealthMonitoring(): void {
    // 每30秒執行一次健康檢查
    this.healthCheckInterval = window.setInterval(() => {
      this.healthCheck();
    }, 30000);

    // 每30秒執行一次疾病效果檢查
    this.diseaseEffectsInterval = window.setInterval(() => {
      this.diseaseEffects();
    }, 30000);
  }

  /**
   * 每30秒執行一次的私有函數：檢查健康度狀態
   */
  private healthCheck(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，重置時間並不往下執行邏輯
    if (currentPetStats.rare === null) {
      this.lastSickCheckTime = null;
      this.lastLifeDamageTime = null;
      this.lastDiseaseCheckTime = null;
      return;
    }

    // 當電子雞當前數值物件的 timeStopping 為 true 時，不往下執行邏輯
    if (currentPetStats.timeStopping === true) {
      return;
    }

    // 判斷電子雞當前數值物件的當前健康度
    const currentStateData = StateDataService.loadStateData();

    if (currentPetStats.currentWellness < 40) {
      // 若當前健康度 < 40，將狀態資料物件的 weak 的 isActive 賦值為 1
      StateDataService.activateState('weak', currentStateData);
    } else {
      // 若當前健康度 ≥ 40，將狀態資料物件的 weak 的 isActive 賦值為 0
      StateDataService.deactivateState('weak', currentStateData);
    }

    // 執行生命值損害檢查
    this.checkLifeDamage();

    // 執行疾病檢查
    this.checkDiseaseCheck();
  }

  /**
   * 私有函數：判斷是否執行健康度低導致的生命值扣除
   */
  private checkLifeDamage(): void {
    const currentTime = UserDataService.formatDateTime(new Date());
    const currentPetStats = PetStatsService.loadPetStats();

    // 若 lastLifeDamageTime 為 null，則將實際當前時間賦值給 lastLifeDamageTime，並且不往下執行邏輯
    if (this.lastLifeDamageTime === null) {
      this.lastLifeDamageTime = currentTime;
      return;
    }

    const currentWellness = currentPetStats.currentWellness;
    const lastDamageTime = new Date(this.lastLifeDamageTime);
    const now = new Date();
    const timeDiffMinutes = Math.floor((now.getTime() - lastDamageTime.getTime()) / (1000 * 60));

    let shouldDamage = false;
    let healthDamage = 0;
    let maxHealthDamage = 0;

    // 判斷電子雞當前數值物件的當前健康度範圍並執行對應邏輯
    if (currentWellness === 0) {
      // 若當前健康度為 0：若實際當前時間距離 lastLifeDamageTime 已經過 10 分鐘
      if (timeDiffMinutes >= 10) {
        shouldDamage = true;
        healthDamage = 10;
        maxHealthDamage = 5;
      }
    } else if (currentWellness >= 1 && currentWellness <= 9) {
      // 若當前健康度為 1-9：若實際當前時間距離 lastLifeDamageTime 已經過 10 分鐘
      if (timeDiffMinutes >= 10) {
        shouldDamage = true;
        healthDamage = 1;
        maxHealthDamage = 0;
      }
    } else if (currentWellness >= 10 && currentWellness <= 39) {
      // 若當前健康度為 10-39：若實際當前時間距離 lastLifeDamageTime 已經過 30 分鐘
      if (timeDiffMinutes >= 30) {
        shouldDamage = true;
        healthDamage = 1;
        maxHealthDamage = 0;
      }
    }

    if (shouldDamage) {
      // 扣除生命值
      const updatedStats = PetStatsService.updatePetStats({
        currentHealth: Math.max(0, currentPetStats.currentHealth - healthDamage),
        maxHealth: Math.max(0, currentPetStats.maxHealth - maxHealthDamage)
      });

      // 更新 lastLifeDamageTime
      this.lastLifeDamageTime = currentTime;
    }
  }

  /**
   * 私有函數：判斷是否觸發疾病抽籤事件
   */
  private checkDiseaseCheck(): void {
    const currentTime = UserDataService.formatDateTime(new Date());
    const currentPetStats = PetStatsService.loadPetStats();

    // 若 lastDiseaseCheckTime 為 null，則將實際當前時間賦值給 lastDiseaseCheckTime，並且不往下執行邏輯
    if (this.lastDiseaseCheckTime === null) {
      this.lastDiseaseCheckTime = currentTime;
      return;
    }

    const currentWellness = currentPetStats.currentWellness;
    const lastCheckTime = new Date(this.lastDiseaseCheckTime);
    const now = new Date();
    const timeDiffMinutes = Math.floor((now.getTime() - lastCheckTime.getTime()) / (1000 * 60));

    let shouldCheck = false;

    // 判斷電子雞當前數值物件的當前健康度範圍並執行對應邏輯
    if (currentWellness >= 1 && currentWellness <= 9) {
      // 若當前健康度為 1-9：若實際當前時間距離 lastDiseaseCheckTime 已經過 10 分鐘
      if (timeDiffMinutes >= 10) {
        shouldCheck = true;
      }
    } else if (currentWellness >= 10 && currentWellness <= 29) {
      // 若當前健康度為 10-29：若實際當前時間距離 lastDiseaseCheckTime 已經過 20 分鐘
      if (timeDiffMinutes >= 20) {
        shouldCheck = true;
      }
    } else if (currentWellness >= 30 && currentWellness <= 49) {
      // 若當前健康度為 30-49：若實際當前時間距離 lastDiseaseCheckTime 已經過 30 分鐘
      if (timeDiffMinutes >= 30) {
        shouldCheck = true;
      }
    }

    if (shouldCheck) {
      // 執行疾病抽籤
      this.randomGetSick();
      // 更新 lastDiseaseCheckTime
      this.lastDiseaseCheckTime = currentTime;
    }
  }

  /**
   * 私有函數：執行疾病抽籤
   */
  private randomGetSick(): void {
    const random = Math.random() * 100; // 0-100的隨機數
    const currentStateData = StateDataService.loadStateData();

    if (random < 15) {
      // 15% 機率：頭痛
      StateDataService.activateState('headache', currentStateData);
    } else if (random < 30) {
      // 15% 機率：拉肚子
      StateDataService.activateState('diarrhea', currentStateData);
    } else if (random < 45) {
      // 15% 機率：胃潰瘍
      StateDataService.activateState('gastricUlcer', currentStateData);
    } else if (random < 60) {
      // 15% 機率：流感
      StateDataService.activateState('flu', currentStateData);
    } else if (random < 75) {
      // 15% 機率：睡眠品質不佳
      const currentPetStats = PetStatsService.loadPetStats();
      PetStatsService.updatePetStats({
        currentWellness: Math.max(0, currentPetStats.currentWellness - 5)
      });
    }
    // 25% 機率：不發生任何事（random >= 75）
  }

  /**
   * 每30秒執行一次的私有函數：執行疾病狀態的持續效果
   */
  private diseaseEffects(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，或是當電子雞當前數值物件的 timeStopping 為 true 時，不往下執行邏輯
    if (currentPetStats.rare === null || currentPetStats.timeStopping === true) {
      return;
    }

    // 定義靜態變數來追蹤上次疾病效果時間
    if (!LowHealthTriggerService.lastDiseaseEffectTime1hour) {
      LowHealthTriggerService.lastDiseaseEffectTime1hour = null;
    }

    const currentStateData = StateDataService.loadStateData();

    // 計算當前疾病狀態數量
    const activeDiseaseCount = ['headache', 'diarrhea', 'gastricUlcer', 'flu'].filter(
      disease => {
        const stateValue = currentStateData[disease as keyof typeof currentStateData];
        return 'isActive' in stateValue && (stateValue as any).isActive === 1;
      }
    ).length;

    // 若沒有疾病狀態，不往下執行邏輯
    if (activeDiseaseCount === 0) {
      return;
    }

    const currentTime = UserDataService.formatDateTime(new Date());

    // 若 lastDiseaseEffectTime1hour 為 null，則將實際當前時間賦值給 lastDiseaseEffectTime1hour，並且不往下執行邏輯
    if (LowHealthTriggerService.lastDiseaseEffectTime1hour === null) {
      LowHealthTriggerService.lastDiseaseEffectTime1hour = currentTime;
      return;
    }

    const lastEffectTime = new Date(LowHealthTriggerService.lastDiseaseEffectTime1hour);
    const now = new Date();
    const timeDiffHours = Math.floor((now.getTime() - lastEffectTime.getTime()) / (1000 * 60 * 60));

    // 若實際當前時間距離 lastDiseaseEffectTime1hour 已經過 1 小時
    if (timeDiffHours >= 1) {
      // 扣除生命值和最大生命值
      const maxHealthReduction = Math.ceil(activeDiseaseCount / 2); // 無條件進位

      PetStatsService.updatePetStats({
        currentHealth: Math.max(0, currentPetStats.currentHealth - activeDiseaseCount),
        maxHealth: Math.max(0, currentPetStats.maxHealth - maxHealthReduction)
      });

      // 更新時間
      LowHealthTriggerService.lastDiseaseEffectTime1hour = currentTime;
    }
  }

  // 靜態變數用於追蹤疾病效果時間
  private static lastDiseaseEffectTime1hour: string | null = null;

  /**
   * 停止所有定時器（用於服務銷毀時清理）
   */
  public stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    if (this.diseaseEffectsInterval) {
      clearInterval(this.diseaseEffectsInterval);
      this.diseaseEffectsInterval = undefined;
    }
  }

  /**
   * 手動觸發健康檢查（用於調試）
   */
  public manualHealthCheck(): void {
    this.healthCheck();
  }

  /**
   * 手動觸發疾病效果檢查（用於調試）
   */
  public manualDiseaseEffects(): void {
    this.diseaseEffects();
  }
}