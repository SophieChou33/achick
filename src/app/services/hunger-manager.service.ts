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

    // 每20秒執行飢餓狀態檢查
    this.hungerCheckInterval = setInterval(() => {
      this.checkHungerState();
    }, 20000);
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
    if (!forceExecute && (petStats.timeStopping || petStats.currentHunger === 0)) {
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
        console.log(`強制執行飽足感減少：扣除 ${petStats.hungerSpeed}，新飽足感 ${newHunger}`);
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
      console.log(`飽足感${executionType}：執行 ${decreaseCount} 次扣除，每次扣除 ${petStats.hungerSpeed}，總共扣除 ${totalHungerDecrease}，新飽足感 ${newHunger}`);
    }
  }

  private checkHungerState(forceExecute: boolean = false): void {
    const petStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，重置飢餓狀態時間並返回
    if (petStats.rare === null) {
      this.hungerStateStartTime = null;
      this.saveHungerTimes();
      return;
    }

    const stateData = StateDataService.loadStateData();

    // 當 timeStopping 為 true 或當前飽足感大於 35 時，取消飢餓狀態（除非強制執行）
    if (!forceExecute && (petStats.timeStopping || petStats.currentHunger > 35)) {
      if (stateData.hungry.isActive === 1) {
        StateDataService.deactivateState('hungry', stateData);
      }
      this.hungerStateStartTime = null;
      this.saveHungerTimes();
      return;
    }

    const currentTime = this.getCurrentTimeString();

    // 若進入飢餓狀態時間為 null，則激活飢餓狀態並設定時間
    if (this.hungerStateStartTime === null) {
      StateDataService.activateState('hungry', stateData);
      this.hungerStateStartTime = currentTime;
      this.saveHungerTimes();

      // 如果是強制執行且飽足感在懲罰範圍內，執行一次懲罰
      if (forceExecute && petStats.currentHunger <= 35) {
        this.executeHungerPenalty(petStats, 1);
      }
      return;
    }

    // 檢查是否已進入飢餓狀態 20 分鐘
    const timeDiff = this.getTimeDifferenceInMinutes(this.hungerStateStartTime, currentTime);

    // 強制執行時，至少執行一次懲罰
    let shouldExecute = forceExecute || timeDiff >= 20;

    if (shouldExecute && petStats.currentHunger <= 35) {
      let punishmentCount = 1; // 強制執行時至少執行一次

      if (timeDiff >= 20) {
        // 正常情況下計算累積懲罰次數
        punishmentCount = Math.floor(timeDiff / 20);
      }

      // 執行懲罰
      this.executeHungerPenalty(petStats, punishmentCount);

      // 更新飢餓狀態開始時間
      if (timeDiff >= 20) {
        // 正常情況：更新為最後一次懲罰的時間點
        const hungerStateStartTime = this.parseTimeString(this.hungerStateStartTime);
        const newHungerStateStartTime = new Date(hungerStateStartTime.getTime() + (punishmentCount * 20 * 60 * 1000));
        this.hungerStateStartTime = this.formatTimeFromDate(newHungerStateStartTime);
      } else {
        // 強制執行：更新為當前時間
        this.hungerStateStartTime = currentTime;
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

      console.log(`飢餓懲罰：飽足感 ${petStats.currentHunger}，執行 ${punishmentCount} 次懲罰，健康度-${totalWellnessDecrease}，好感度-${totalFriendshipDecrease}`);
    }
  }

  /**
   * 手動觸發飽足感減少檢查（工程師模式使用）
   */
  public manualTriggerHungerDecrease(): void {
    console.log('手動觸發飽足感減少檢查');
    this.decreaseHunger(true); // 強制執行
  }

  /**
   * 手動觸發飽足感懲罰扣值檢查（工程師模式使用）
   */
  public manualTriggerHungerPenalty(): void {
    console.log('手動觸發飽足感懲罰扣值檢查');
    this.checkHungerState(true); // 強制執行
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
      }
    } catch (error) {
      console.error('Failed to load hunger times:', error);
      this.lastHungerTime = null;
      this.hungerStateStartTime = null;
    }
  }

  /**
   * 儲存飢餓時間資料
   */
  private saveHungerTimes(): void {
    try {
      const hungerData = {
        lastHungerTime: this.lastHungerTime,
        hungerStateStartTime: this.hungerStateStartTime
      };
      localStorage.setItem(HungerManagerService.HUNGER_STORAGE_KEY, JSON.stringify(hungerData));
    } catch (error) {
      console.error('Failed to save hunger times:', error);
    }
  }
}
