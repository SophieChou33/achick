import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { PetStats } from '../types/pet-stats.type';
import { StateDataService } from '../data/state-data';
import { StateData } from '../types/state-data.type';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class HungerManagerService {
  private lastHungerTime: string | null = null;
  private hungerStateStartTime: string | null = null;
  private lastHungerPenaltyTime: string | null = null; // 新增：記錄上次飢餓懲罰時間
  private hungerDecreaseInterval: any;
  private hungerCheckInterval: any;

  private static readonly HUNGER_STORAGE_KEY = 'achick_hunger_times';

  constructor(private customTimeService: CustomTimeService) {
    this.loadHungerTimes();
    this.startHungerSystem();
  }

  private startHungerSystem(): void {
    // 每30秒執行飽足感降低檢查
    this.hungerDecreaseInterval = setInterval(() => {
      this.decreaseHunger();
    }, 30000);

    // 每30秒執行飢餓狀態檢查
    this.hungerCheckInterval = setInterval(() => {
      this.checkHungerState();
    }, 30000);
  }

  private getCurrentTimeString(): string {
    return this.customTimeService.formatTime();
  }

  private parseTimeString(timeStr: string): Date {
    // 解析 yyyy/mm/dd HH:mm:ss 格式
    const [datePart, timePart] = timeStr.split(' ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  private getTimeDifferenceInMinutes(timeStr1: string, timeStr2: string): number {
    const date1 = this.parseTimeString(timeStr1);
    const date2 = this.parseTimeString(timeStr2);
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60);
  }

  private decreaseHunger(forceExecute: boolean = false): void {
    const petStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，重置上次飢餓時間並返回
    if (petStats.rare === null) {
      this.lastHungerTime = null;
      this.saveHungerTimes();
      return;
    }

    // 當 timeStopping 為 true 或當前飽足感為 0 時，不執行邏輯（除非強制執行）
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (!forceExecute && (petStats.timeStopping || petStats.currentHunger === 0 ||
        (petStats.lifeCycle !== 'CHILD' && petStats.lifeCycle !== 'EVOLUTION'))) {
      return;
    }

    const currentTime = this.getCurrentTimeString();

    // 若上次飢餓時間為 null，則初始化
    if (this.lastHungerTime === null) {
      this.lastHungerTime = currentTime;
      this.saveHungerTimes();

      // 如果是強制執行，執行一次扣除
      if (forceExecute && petStats.currentHunger > 0) {
        const newHunger = Math.max(0, petStats.currentHunger - petStats.hungerSpeed);
        PetStatsService.updatePetStats({
          currentHunger: newHunger
        });
      }
      return;
    }

    // 檢查是否已過一小時並計算累積扣除
    const timeDiff = this.getTimeDifferenceInMinutes(this.lastHungerTime, currentTime);

    // 強制執行時，至少執行一次扣除
    let shouldExecute = forceExecute || timeDiff >= 60;

    if (shouldExecute && petStats.currentHunger > 0) {
      let decreaseCount = 1; // 強制執行時至少執行一次

      if (timeDiff >= 60) {
        // 正常情況下計算累積扣除次數
        decreaseCount = Math.floor(timeDiff / 60);
      }

      // 計算總扣除的飽足感
      const totalHungerDecrease = decreaseCount * petStats.hungerSpeed;
      const newHunger = Math.max(0, petStats.currentHunger - totalHungerDecrease);

      // 更新電子雞數值
      PetStatsService.updatePetStats({
        currentHunger: newHunger
      });

      // 更新上次飢餓時間
      if (timeDiff >= 60) {
        // 正常情況：更新為最後一次扣除的時間點
        const lastHungerTime = this.parseTimeString(this.lastHungerTime);
        const newLastHungerTime = new Date(lastHungerTime.getTime() + (decreaseCount * 60 * 60 * 1000));
        this.lastHungerTime = this.formatTimeFromDate(newLastHungerTime);
      } else {
        // 強制執行：更新為當前時間
        this.lastHungerTime = currentTime;
      }

      // 保存時間
      this.saveHungerTimes();

      const executionType = forceExecute && timeDiff < 60 ? '強制執行' : '累積減少';
    }
  }

  private checkHungerState(forceExecute: boolean = false): void {
    const petStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，重置飢餓狀態時間並返回
    if (petStats.rare === null) {
      this.hungerStateStartTime = null;
      this.lastHungerPenaltyTime = null;
      this.saveHungerTimes();
      return;
    }

    const stateData = StateDataService.loadStateData();

    // 當 timeStopping 為 true 或當前飽足感大於 35 時，取消飢餓狀態（除非強制執行）
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (!forceExecute && (petStats.timeStopping || petStats.currentHunger > 35 ||
        (petStats.lifeCycle !== 'CHILD' && petStats.lifeCycle !== 'EVOLUTION'))) {
      if (stateData.hungry.isActive === 1) {
        StateDataService.deactivateState('hungry', stateData);
      }
      this.hungerStateStartTime = null;
      // 注意：不重置 lastHungerPenaltyTime，因為懲罰時間應該獨立記錄
      this.saveHungerTimes();
      return;
    }

    const currentTime = this.getCurrentTimeString();

    // 若進入飢餓狀態時間為 null，則激活飢餓狀態並設定時間
    if (this.hungerStateStartTime === null) {
      StateDataService.activateState('hungry', stateData);
      this.hungerStateStartTime = currentTime;
      this.saveHungerTimes();
    }

    // 檢查飢餓懲罰 - 使用獨立的時間記錄
    this.checkHungerPenalty(forceExecute, petStats, currentTime);
  }

  /**
   * 檢查並執行飢餓懲罰的獨立邏輯
   */
  private checkHungerPenalty(forceExecute: boolean, petStats: any, currentTime: string): void {
    // 只有在飽足感 <= 35 時才執行懲罰
    if (petStats.currentHunger > 35) {
      return;
    }

    // 若上次懲罰時間為 null，則初始化
    if (this.lastHungerPenaltyTime === null) {
      this.lastHungerPenaltyTime = currentTime;
      this.saveHungerTimes();

      // 如果是強制執行，執行一次懲罰
      if (forceExecute) {
        this.executeHungerPenalty(petStats, 1);
      }
      return;
    }

    // 檢查是否已過 60 分鐘（1小時）並計算累積懲罰
    const timeDiff = this.getTimeDifferenceInMinutes(this.lastHungerPenaltyTime, currentTime);

    // 強制執行時，至少執行一次懲罰
    let shouldExecute = forceExecute || timeDiff >= 60;

    if (shouldExecute) {
      let punishmentCount = 1; // 強制執行時至少執行一次

      if (timeDiff >= 60) {
        // 正常情況下計算累積懲罰次數（每小時一次）
        punishmentCount = Math.floor(timeDiff / 60);
      }

      // 執行懲罰
      this.executeHungerPenalty(petStats, punishmentCount);

      // 更新上次懲罰時間
      if (timeDiff >= 60) {
        // 正常情況：更新為最後一次懲罰的時間點
        const lastPenaltyTime = this.parseTimeString(this.lastHungerPenaltyTime);
        const newLastPenaltyTime = new Date(lastPenaltyTime.getTime() + (punishmentCount * 60 * 60 * 1000));
        this.lastHungerPenaltyTime = this.formatTimeFromDate(newLastPenaltyTime);
      } else {
        // 強制執行：更新為當前時間
        this.lastHungerPenaltyTime = currentTime;
      }

      // 保存時間
      this.saveHungerTimes();
    }
  }

  public stopHungerSystem(): void {
    if (this.hungerDecreaseInterval) {
      clearInterval(this.hungerDecreaseInterval);
    }
    if (this.hungerCheckInterval) {
      clearInterval(this.hungerCheckInterval);
    }
  }

  public restartHungerSystem(): void {
    this.stopHungerSystem();
    this.startHungerSystem();
  }

  // 公開方法用於重置飢餓系統狀態
  public resetHungerTimes(): void {
    this.lastHungerTime = null;
    this.hungerStateStartTime = null;
    this.lastHungerPenaltyTime = null;
    this.saveHungerTimes();
  }

  /**
   * 執行飢餓懲罰的核心邏輯
   */
  private executeHungerPenalty(petStats: any, punishmentCount: number): void {
    // 根據飽足感閾值確定每次扣除的數值
    let friendshipDecreasePerTime = 0;
    let wellnessDecreasePerTime = 0;

    if (petStats.currentHunger >= 16 && petStats.currentHunger <= 35) {
      friendshipDecreasePerTime = 5;
      wellnessDecreasePerTime = 1;
    } else if (petStats.currentHunger >= 0 && petStats.currentHunger <= 15) {
      friendshipDecreasePerTime = 15;
      wellnessDecreasePerTime = 2;
    }

    if (friendshipDecreasePerTime > 0 || wellnessDecreasePerTime > 0) {
      // 計算總扣除數值
      const totalFriendshipDecrease = punishmentCount * friendshipDecreasePerTime;
      const totalWellnessDecrease = punishmentCount * wellnessDecreasePerTime;

      // 計算新的數值，確保不小於 0
      const newFriendship = Math.max(0, petStats.currentFriendship - totalFriendshipDecrease);
      const newWellness = Math.max(0, petStats.currentWellness - totalWellnessDecrease);

      // 更新電子雞數值
      PetStatsService.updatePetStats({
        currentFriendship: newFriendship,
        currentWellness: newWellness
      });

      // 顯示 toastr 通知
      const petName = petStats.name || 'Achick';
      const message = `${petName}因飢餓對你不滿，健康度-${totalWellnessDecrease}，好感度-${totalFriendshipDecrease}（${punishmentCount}次懲罰）`;
      ToastrService.show(message, 'warning', 6000);
    }
  }

  /**
   * 手動觸發飽足感減少檢查（工程師模式使用）
   */
  public manualTriggerHungerDecrease(): void {
    const petStats = PetStatsService.loadPetStats();
    const currentTime = this.getCurrentTimeString();

    // 檢查基本條件
    if (petStats.rare === null) {
      ToastrService.show('電子雞尚未設定稀有度，無法執行飽足感減少', 'info', 3000);
      return;
    }

    if (petStats.timeStopping) {
      ToastrService.show('電子雞時間已停止，無法執行飽足感減少', 'info', 3000);
      return;
    }

    if (petStats.currentHunger === 0) {
      ToastrService.show('飽足感已為0，無需再減少', 'info', 3000);
      return;
    }

    if (petStats.lifeCycle !== 'CHILD' && petStats.lifeCycle !== 'EVOLUTION') {
      ToastrService.show(`電子雞生命週期為${petStats.lifeCycle}，不會減少飽足感`, 'info', 3000);
      return;
    }

    // 檢查時間條件
    if (this.lastHungerTime !== null) {
      const timeDiff = this.getTimeDifferenceInMinutes(this.lastHungerTime, currentTime);
      if (timeDiff < 60) {
        const remainingTime = Math.ceil(60 - timeDiff);
        ToastrService.show(`距離上次飽足感減少僅過了${Math.floor(timeDiff)}分鐘，還需等待${remainingTime}分鐘`, 'info', 4000);
        return;
      }
    }

    this.decreaseHunger(false); // 遵循正常時間邏輯
  }

  /**
   * 手動觸發飽足感懲罰扣值檢查（工程師模式使用）
   */
  public manualTriggerHungerPenalty(): void {
    const petStats = PetStatsService.loadPetStats();
    const currentTime = this.getCurrentTimeString();

    // 檢查基本條件
    if (petStats.rare === null) {
      ToastrService.show('電子雞尚未設定稀有度，無法執行飢餓懲罰', 'info', 3000);
      return;
    }

    if (petStats.timeStopping) {
      ToastrService.show('電子雞時間已停止，無法執行飢餓懲罰', 'info', 3000);
      return;
    }

    if (petStats.lifeCycle !== 'CHILD' && petStats.lifeCycle !== 'EVOLUTION') {
      ToastrService.show(`電子雞生命週期為${petStats.lifeCycle}，不會執行飢餓懲罰`, 'info', 3000);
      return;
    }

    // 檢查是否滿足懲罰條件
    if (petStats.currentHunger > 35) {
      const petName = petStats.name || 'Achick';
      ToastrService.show(`${petName}的飽足感為${petStats.currentHunger}，高於35，無需飢餓懲罰`, 'info', 3000);
      return;
    }

    // 檢查時間條件 - 使用上次懲罰時間而非飢餓狀態開始時間
    if (this.lastHungerPenaltyTime !== null) {
      const timeDiff = this.getTimeDifferenceInMinutes(this.lastHungerPenaltyTime, currentTime);
      if (timeDiff < 60) {
        const remainingTime = Math.ceil(60 - timeDiff);
        ToastrService.show(`距離上次飢餓懲罰僅過了${Math.floor(timeDiff)}分鐘，還需等待${remainingTime}分鐘才能再次執行懲罰`, 'info', 4000);
        return;
      }
    }

    this.checkHungerState(false); // 遵循正常時間邏輯
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
   * 載入飢餓時間資料
   */
  private loadHungerTimes(): void {
    try {
      const savedData = localStorage.getItem(HungerManagerService.HUNGER_STORAGE_KEY);
      if (savedData) {
        const hungerData = JSON.parse(savedData);
        this.lastHungerTime = hungerData.lastHungerTime || null;
        this.hungerStateStartTime = hungerData.hungerStateStartTime || null;
        this.lastHungerPenaltyTime = hungerData.lastHungerPenaltyTime || null;
      }
    } catch (error) {
      console.error('Failed to load hunger times:', error);
      this.lastHungerTime = null;
      this.hungerStateStartTime = null;
      this.lastHungerPenaltyTime = null;
    }
  }

  /**
   * 儲存飢餓時間資料
   */
  private saveHungerTimes(): void {
    try {
      const hungerData = {
        lastHungerTime: this.lastHungerTime,
        hungerStateStartTime: this.hungerStateStartTime,
        lastHungerPenaltyTime: this.lastHungerPenaltyTime
      };
      localStorage.setItem(HungerManagerService.HUNGER_STORAGE_KEY, JSON.stringify(hungerData));
    } catch (error) {
      console.error('Failed to save hunger times:', error);
    }
  }
}
