import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { PetStats } from '../types/pet-stats.type';
import { StateDataService } from '../data/state-data';
import { StateData } from '../types/state-data.type';
import { ToastrService } from '../components/shared/toastr/toastr.component';

@Injectable({
  providedIn: 'root'
})
export class HungerManagerService {
  private lastHungerTime: string | null = null;
  private hungerStateStartTime: string | null = null;
  private hungerDecreaseInterval: any;
  private hungerCheckInterval: any;

  constructor() {
    this.startHungerSystem();
  }

  private startHungerSystem(): void {
    // 每30秒執行飢餓度降低檢查
    this.hungerDecreaseInterval = setInterval(() => {
      this.decreaseHunger();
    }, 30000);

    // 每20秒執行飢餓狀態檢查
    this.hungerCheckInterval = setInterval(() => {
      this.checkHungerState();
    }, 20000);
  }

  private getCurrentTimeString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
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

  private decreaseHunger(): void {
    const petStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，重置上次飢餓時間並返回
    if (petStats.rare === null) {
      this.lastHungerTime = null;
      return;
    }

    // 當 timeStopping 為 true 或當前飢餓度為 0 時，不執行邏輯
    if (petStats.timeStopping || petStats.currentHunger === 0) {
      return;
    }

    const currentTime = this.getCurrentTimeString();

    // 若上次飢餓時間為 null，則初始化並返回
    if (this.lastHungerTime === null) {
      this.lastHungerTime = currentTime;
      return;
    }

    // 檢查是否已過一小時
    const timeDiff = this.getTimeDifferenceInMinutes(this.lastHungerTime, currentTime);
    if (timeDiff >= 60) {
      // 更新上次飢餓時間
      this.lastHungerTime = currentTime;

      // 計算新的飢餓度
      const newHunger = Math.max(0, petStats.currentHunger - petStats.hungerSpeed);

      // 更新電子雞數值
      PetStatsService.updatePetStats({
        currentHunger: newHunger
      });
    }
  }

  private checkHungerState(): void {
    const petStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，重置飢餓狀態時間並返回
    if (petStats.rare === null) {
      this.hungerStateStartTime = null;
      return;
    }

    const stateData = StateDataService.loadStateData();

    // 當 timeStopping 為 true 或當前飢餓度大於 35 時，取消飢餓狀態
    if (petStats.timeStopping || petStats.currentHunger > 35) {
      if (stateData.hungry.isActive === 1) {
        StateDataService.deactivateState('hungry', stateData);
      }
      this.hungerStateStartTime = null;
      return;
    }

    const currentTime = this.getCurrentTimeString();

    // 若進入飢餓狀態時間為 null，則激活飢餓狀態並設定時間
    if (this.hungerStateStartTime === null) {
      StateDataService.activateState('hungry', stateData);
      this.hungerStateStartTime = currentTime;
      return;
    }

    // 檢查是否已進入飢餓狀態 20 分鐘
    const timeDiff = this.getTimeDifferenceInMinutes(this.hungerStateStartTime, currentTime);
    if (timeDiff >= 20) {
      // 重置飢餓狀態開始時間，準備下一輪計算
      this.hungerStateStartTime = currentTime;

      // 根據飢餓度閾值扣除好感度和健康度
      let friendshipDecrease = 0;
      let wellnessDecrease = 0;

      if (petStats.currentHunger >= 16 && petStats.currentHunger <= 35) {
        friendshipDecrease = 5;
        wellnessDecrease = 1;
      } else if (petStats.currentHunger >= 0 && petStats.currentHunger <= 15) {
        friendshipDecrease = 15;
        wellnessDecrease = 2;
      }

      if (friendshipDecrease > 0 || wellnessDecrease > 0) {
        // 計算新的數值，確保不小於 0
        const newFriendship = Math.max(0, petStats.currentFriendship - friendshipDecrease);
        const newWellness = Math.max(0, petStats.currentWellness - wellnessDecrease);

        // 更新電子雞數值
        PetStatsService.updatePetStats({
          currentFriendship: newFriendship,
          currentWellness: newWellness
        });

        // 顯示 toastr 通知
        const petName = petStats.name || 'Achick';
        const message = `${petName}因飢餓對你不滿，健康度-${wellnessDecrease}，好感度-${friendshipDecrease}`;
        ToastrService.show(message, 'warning', 6000);
      }
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
  }
}