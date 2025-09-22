import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { UserDataService } from '../data/user-data';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class WellnessCheckService {
  private lastSickCheckTime: string | null = null;
  private lastLifeDamageTime: string | null = null;
  private lastDiseaseCheckTime: string | null = null;

  private wellnessCheckInterval?: number;
  private diseaseEffectsInterval?: number;

  private static readonly WELLNESS_STORAGE_KEY = 'achick_wellness_times';

  constructor(private customTimeService: CustomTimeService) {
    this.loadWellnessTimes();
    this.startWellnessMonitoring();
  }

  /**
   * 啟動健康度監控定時器
   */
  private startWellnessMonitoring(): void {
    // 每30秒執行一次健康度檢查
    this.wellnessCheckInterval = window.setInterval(() => {
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
      this.saveWellnessTimes();
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
    const currentTime = this.customTimeService.formatTime();
    const currentPetStats = PetStatsService.loadPetStats();

    // 若 lastLifeDamageTime 為 null，則將實際當前時間賦值給 lastLifeDamageTime，並且不往下執行邏輯
    if (this.lastLifeDamageTime === null) {
      this.lastLifeDamageTime = currentTime;
      this.saveWellnessTimes();
      return;
    }

    const currentWellness = currentPetStats.currentWellness;
    const lastDamageTime = this.parseTimeString(this.lastLifeDamageTime);
    const now = this.parseTimeString(currentTime);
    const timeDiffMs = now.getTime() - lastDamageTime.getTime();

    // 根據健康度範圍確定間隔時間和每次傷害
    let intervalMinutes = 0;
    let healthDamagePerInterval = 0;
    let maxHealthDamagePerInterval = 0;

    if (currentWellness === 0) {
      intervalMinutes = 10;
      healthDamagePerInterval = 10;
      maxHealthDamagePerInterval = 5;
    } else if (currentWellness >= 1 && currentWellness <= 9) {
      intervalMinutes = 10;
      healthDamagePerInterval = 1;
      maxHealthDamagePerInterval = 0;
    } else if (currentWellness >= 10 && currentWellness <= 39) {
      intervalMinutes = 30;
      healthDamagePerInterval = 1;
      maxHealthDamagePerInterval = 0;
    }

    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000;

      if (timeDiffMs >= intervalMs) {
        // 計算應該執行的懲罰次數
        const damageCount = Math.floor(timeDiffMs / intervalMs);
        const totalHealthDamage = damageCount * healthDamagePerInterval;
        const totalMaxHealthDamage = damageCount * maxHealthDamagePerInterval;

        // 計算新的最大生命值和當前生命值
        const newMaxHealth = Math.max(0, currentPetStats.maxHealth - totalMaxHealthDamage);
        let newCurrentHealth = Math.max(0, currentPetStats.currentHealth - totalHealthDamage);

        // 檢查當前生命值是否溢出新的最大生命值
        if (newCurrentHealth > newMaxHealth) {
          newCurrentHealth = newMaxHealth;
        }

        // 扣除生命值
        const updatedStats = PetStatsService.updatePetStats({
          currentHealth: newCurrentHealth,
          maxHealth: newMaxHealth
        });

        // 更新 lastLifeDamageTime 為最後一次傷害的時間點
        const newLastDamageTime = new Date(lastDamageTime.getTime() + (damageCount * intervalMs));
        this.lastLifeDamageTime = this.formatTimeFromDate(newLastDamageTime);
        this.saveWellnessTimes();

        console.log(`低健康度累積傷害：健康度範圍 ${currentWellness}，執行 ${damageCount} 次傷害，生命值-${totalHealthDamage}，最大生命值-${totalMaxHealthDamage}`);
      }
    }
  }

  /**
   * 私有函數：判斷是否觸發疾病抽籤事件
   */
  private checkDiseaseCheck(): void {
    const currentTime = this.customTimeService.formatTime();
    const currentPetStats = PetStatsService.loadPetStats();

    // 若 lastDiseaseCheckTime 為 null，則將實際當前時間賦值給 lastDiseaseCheckTime，並且不往下執行邏輯
    if (this.lastDiseaseCheckTime === null) {
      this.lastDiseaseCheckTime = currentTime;
      this.saveWellnessTimes();
      return;
    }

    const currentWellness = currentPetStats.currentWellness;
    const lastCheckTime = new Date(this.lastDiseaseCheckTime);
    const now = this.customTimeService.getCurrentTime();
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
      this.saveWellnessTimes();
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
    if (!WellnessCheckService.lastDiseaseEffectTime1hour) {
      WellnessCheckService.lastDiseaseEffectTime1hour = null;
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

    const currentTime = this.customTimeService.formatTime();

    // 若 lastDiseaseEffectTime1hour 為 null，則將實際當前時間賦值給 lastDiseaseEffectTime1hour，並且不往下執行邏輯
    if (WellnessCheckService.lastDiseaseEffectTime1hour === null) {
      WellnessCheckService.lastDiseaseEffectTime1hour = currentTime;
      this.saveWellnessTimes();
      return;
    }

    const lastEffectTime = this.parseTimeString(WellnessCheckService.lastDiseaseEffectTime1hour);
    const now = this.parseTimeString(currentTime);
    const timeDiffMs = now.getTime() - lastEffectTime.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    // 若實際當前時間距離 lastDiseaseEffectTime1hour 已經過 1 小時
    if (timeDiffMs >= oneHourInMs) {
      // 計算應該執行的懲罰次數（每小時一次）
      const effectCount = Math.floor(timeDiffMs / oneHourInMs);

      // 計算總傷害
      const maxHealthReductionPerHour = Math.ceil(activeDiseaseCount / 2);
      const totalMaxHealthReduction = effectCount * maxHealthReductionPerHour;
      const totalHealthReduction = effectCount * activeDiseaseCount;

      // 扣除生命值和最大生命值
      const newMaxHealth = Math.max(0, currentPetStats.maxHealth - totalMaxHealthReduction);
      let newCurrentHealth = Math.max(0, currentPetStats.currentHealth - totalHealthReduction);

      // 檢查當前生命值是否溢出新的最大生命值
      if (newCurrentHealth > newMaxHealth) {
        newCurrentHealth = newMaxHealth;
      }

      PetStatsService.updatePetStats({
        currentHealth: newCurrentHealth,
        maxHealth: newMaxHealth
      });

      // 更新時間為最後一次效果的時間點
      const newLastEffectTime = new Date(lastEffectTime.getTime() + (effectCount * oneHourInMs));
      WellnessCheckService.lastDiseaseEffectTime1hour = this.formatTimeFromDate(newLastEffectTime);
      this.saveWellnessTimes();

      console.log(`疾病累積效果：${activeDiseaseCount} 個疾病，執行 ${effectCount} 次效果，生命值-${totalHealthReduction}，最大生命值-${totalMaxHealthReduction}`);
    }
  }

  // 靜態變數用於追蹤疾病效果時間
  private static lastDiseaseEffectTime1hour: string | null = null;

  /**
   * 停止所有定時器（用於服務銷毀時清理）
   */
  public stopMonitoring(): void {
    if (this.wellnessCheckInterval) {
      clearInterval(this.wellnessCheckInterval);
      this.wellnessCheckInterval = undefined;
    }
    if (this.diseaseEffectsInterval) {
      clearInterval(this.diseaseEffectsInterval);
      this.diseaseEffectsInterval = undefined;
    }
  }

  /**
   * 手動觸發健康度檢查（用於調試）
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

  /**
   * 解析時間字串為 Date 物件
   */
  private parseTimeString(timeString: string): Date {
    const [datePart, timePart] = timeString.split(' ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  /**
   * 將 Date 物件格式化為時間字串 (yyyy/mm/dd HH:mm:ss)
   */
  private formatTimeFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 載入健康度時間資料
   */
  private loadWellnessTimes(): void {
    try {
      const savedData = localStorage.getItem(WellnessCheckService.WELLNESS_STORAGE_KEY);
      if (savedData) {
        const wellnessData = JSON.parse(savedData);
        this.lastSickCheckTime = wellnessData.lastSickCheckTime || null;
        this.lastLifeDamageTime = wellnessData.lastLifeDamageTime || null;
        this.lastDiseaseCheckTime = wellnessData.lastDiseaseCheckTime || null;
        WellnessCheckService.lastDiseaseEffectTime1hour = wellnessData.lastDiseaseEffectTime1hour || null;
      }
    } catch (error) {
      console.error('Failed to load wellness times:', error);
      this.lastSickCheckTime = null;
      this.lastLifeDamageTime = null;
      this.lastDiseaseCheckTime = null;
      WellnessCheckService.lastDiseaseEffectTime1hour = null;
    }
  }

  /**
   * 儲存健康度時間資料
   */
  private saveWellnessTimes(): void {
    try {
      const wellnessData = {
        lastSickCheckTime: this.lastSickCheckTime,
        lastLifeDamageTime: this.lastLifeDamageTime,
        lastDiseaseCheckTime: this.lastDiseaseCheckTime,
        lastDiseaseEffectTime1hour: WellnessCheckService.lastDiseaseEffectTime1hour
      };
      localStorage.setItem(WellnessCheckService.WELLNESS_STORAGE_KEY, JSON.stringify(wellnessData));
    } catch (error) {
      console.error('Failed to save wellness times:', error);
    }
  }
}