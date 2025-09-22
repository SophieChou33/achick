import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class LightService {
  public isLightOn: number = 1;
  public isDay: number = 1;

  private dayNightCheckInterval?: number;
  private lightCheckInterval?: number;
  private lastLightCheckTime: string | null = null;

  private static readonly LIGHT_STORAGE_KEY = 'achick_light_times';

  constructor(private customTimeService: CustomTimeService) {
    this.loadLightTimes();
    this.initializeDayNightStatus();
    this.startLightMonitoring();
  }

  /**
   * 初始化日夜狀態
   */
  private initializeDayNightStatus(): void {
    this.checkDayAndNight();
  }

  /**
   * 啟動光線監控定時器
   */
  private startLightMonitoring(): void {
    // 每30秒執行一次日夜檢查
    this.dayNightCheckInterval = window.setInterval(() => {
      this.checkDayAndNight();
    }, 30000);

    // 每30秒執行一次光線檢查
    this.lightCheckInterval = window.setInterval(() => {
      this.checkLight();
    }, 30000);
  }

  /**
   * 每30秒執行一次的私有函數：檢查日夜狀態
   */
  private checkDayAndNight(): void {
    const now = this.customTimeService.getCurrentTime();
    const currentHour = now.getHours();

    // 若在 5:00~18:00 時間區間時，設定 isDay 為 1
    if (currentHour >= 5 && currentHour < 18) {
      this.isDay = 1;
    } else {
      // 若不在區間內則設定 isDay 為 0
      this.isDay = 0;
    }
  }

  /**
   * 公開函數：電燈切換
   */
  public lampToggle(): void {
    // 將 isLightOn 在 0 和 1 之間切換
    this.isLightOn = this.isLightOn === 1 ? 0 : 1;

    // 若 isDay + isLightOn 大於 1，將狀態資料物件的 needLight 狀態賦值為 0
    if (this.isDay + this.isLightOn > 1) {
      const currentStateData = StateDataService.loadStateData();
      StateDataService.deactivateState('needLight', currentStateData);
    }
  }

  /**
   * 每30秒執行一次的私有函數：檢查光線狀態
   */
  private checkLight(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，不往下執行邏輯
    if (currentPetStats.rare === null) {
      return;
    }

    // 當電子雞當前數值物件的 timeStoping 為 true 時，不往下執行邏輯
    if (currentPetStats.timeStopping === true) {
      return;
    }

    // 每 30 分鐘執行一次邏輯檢查
    const checkResult = this.shouldExecuteLightCheck();
    if (checkResult.shouldExecute) {
      this.executeLightLogic(currentPetStats, checkResult.penaltyCount);
      this.updateLastLightCheckTime(checkResult.penaltyCount);
    }
  }

  /**
   * 檢查是否應該執行光線邏輯（每30分鐘一次）並計算累積懲罰
   */
  private shouldExecuteLightCheck(): { shouldExecute: boolean; penaltyCount: number } {
    const currentTime = this.getCurrentTimeString();

    // 若 lastLightCheckTime 為 null，初始化時間
    if (this.lastLightCheckTime === null) {
      this.lastLightCheckTime = currentTime;
      this.saveLightTimes();
      return { shouldExecute: false, penaltyCount: 0 }; // 第一次初始化，不執行邏輯
    }

    const lastCheckTime = this.parseTimeString(this.lastLightCheckTime);
    const now = this.parseTimeString(currentTime);
    const timeDiffMinutes = Math.floor((now.getTime() - lastCheckTime.getTime()) / (1000 * 60));

    if (timeDiffMinutes >= 30) {
      const penaltyCount = Math.floor(timeDiffMinutes / 30);
      return { shouldExecute: true, penaltyCount };
    }

    return { shouldExecute: false, penaltyCount: 0 };
  }

  /**
   * 執行光線相關邏輯
   */
  private executeLightLogic(currentPetStats: any, penaltyCount: number): void {
    const now = this.customTimeService.getCurrentTime();
    const currentHour = now.getHours();

    // 若在 7:00～22:59 時間區間內且 isDay + isLightOn 小於 1 時
    if (currentHour >= 7 && currentHour <= 22 && (this.isDay + this.isLightOn < 1)) {
      const currentStateData = StateDataService.loadStateData();

      // 狀態資料物件的 needLight 狀態賦值為 1
      StateDataService.activateState('needLight', currentStateData);

      // 計算累積懲罰
      const totalFriendshipDecrease = penaltyCount * 2;
      const totalWellnessDecrease = penaltyCount * 1;

      // 執行累積扣除
      let updatedStats = { ...currentPetStats };
      updatedStats.currentFriendship = Math.max(0, currentPetStats.currentFriendship - totalFriendshipDecrease);
      updatedStats.currentWellness = Math.max(0, currentPetStats.currentWellness - totalWellnessDecrease);

      // 保存更新後的數值
      PetStatsService.savePetStats(updatedStats);

      // 保存時間
      this.saveLightTimes();

      console.log(`燈光不足累積懲罰：執行 ${penaltyCount} 次懲罰，好感度-${totalFriendshipDecrease}，健康度-${totalWellnessDecrease}`);
    }
  }

  /**
   * 更新最後檢查時間
   */
  private updateLastLightCheckTime(penaltyCount: number): void {
    if (this.lastLightCheckTime !== null) {
      const lastCheckTime = this.parseTimeString(this.lastLightCheckTime);
      const newLastCheckTime = new Date(lastCheckTime.getTime() + (penaltyCount * 30 * 60 * 1000));
      this.lastLightCheckTime = this.formatTimeFromDate(newLastCheckTime);
      this.saveLightTimes();
    }
  }

  /**
   * 獲取當前時間字串 (yyyy/mm/dd HH:mm:ss)
   */
  private getCurrentTimeString(): string {
    return this.customTimeService.formatTime();
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
   * 獲取當前光線狀態（用於UI顯示）
   */
  public getLightStatus(): {
    isLightOn: boolean;
    isDay: boolean;
    hasLight: boolean;
  } {
    return {
      isLightOn: this.isLightOn === 1,
      isDay: this.isDay === 1,
      hasLight: (this.isDay + this.isLightOn) > 0
    };
  }

  /**
   * 停止所有定時器（用於服務銷毀時清理）
   */
  public stopMonitoring(): void {
    if (this.dayNightCheckInterval) {
      clearInterval(this.dayNightCheckInterval);
      this.dayNightCheckInterval = undefined;
    }
    if (this.lightCheckInterval) {
      clearInterval(this.lightCheckInterval);
      this.lightCheckInterval = undefined;
    }
  }

  /**
   * 手動觸發光線檢查（用於調試）
   */
  public manualLightCheck(): void {
    this.checkLight();
  }

  /**
   * 手動觸發日夜檢查（用於調試）
   */
  public manualDayNightCheck(): void {
    this.checkDayAndNight();
  }

  /**
   * 載入光線時間資料
   */
  private loadLightTimes(): void {
    try {
      const savedData = localStorage.getItem(LightService.LIGHT_STORAGE_KEY);
      if (savedData) {
        const lightData = JSON.parse(savedData);
        this.lastLightCheckTime = lightData.lastLightCheckTime || null;
      }
    } catch (error) {
      console.error('Failed to load light times:', error);
      this.lastLightCheckTime = null;
    }
  }

  /**
   * 儲存光線時間資料
   */
  private saveLightTimes(): void {
    try {
      const lightData = {
        lastLightCheckTime: this.lastLightCheckTime
      };
      localStorage.setItem(LightService.LIGHT_STORAGE_KEY, JSON.stringify(lightData));
    } catch (error) {
      console.error('Failed to save light times:', error);
    }
  }
}