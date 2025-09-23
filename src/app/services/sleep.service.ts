import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { LightService } from './light.service';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { getBreedByName } from '../data/breed-data';
import { sources } from '../sources';

@Injectable({
  providedIn: 'root'
})
export class SleepService {
  private sleepCheckInterval?: number;

  constructor(private lightService: LightService) {
    this.startSleepMonitoring();
  }

  /**
   * 啟動睡眠監控定時器
   */
  private startSleepMonitoring(): void {
    // 每30分鐘執行一次睡眠時間檢查
    this.sleepCheckInterval = window.setInterval(() => {
      this.checkSleepTime();
    }, 30 * 60 * 1000); // 30分鐘
  }

  /**
   * 每30分鐘執行一次的私有函數：檢查睡眠時間狀態
   */
  private checkSleepTime(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，不往下執行邏輯
    if (currentPetStats.rare === null) {
      return;
    }

    // 當電子雞當前數值物件的 timeStopping 為 true 時，不往下執行邏輯
    if (currentPetStats.timeStopping === true) {
      return;
    }

    const currentStateData = StateDataService.loadStateData();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 檢查是否處於睡眠時間（22:59~7:00）
    const isSleepTime = this.isSleepTime(currentHour, currentMinute);

    if (isSleepTime) {
      // 當實際時間處於 22:59~7:00 之間時
      if (currentStateData.isSleeping.isActive === 1) {
        // 若『狀態資料物件』的『isSleeping』的 isActive 為 1，則不執行檢查
        return;
      } else {
        // 若『狀態資料物件』的『isSleeping』的 isActive 為 0，則將『狀態資料物件』的『needSleep』的 isActive 賦值為 1
        StateDataService.activateState('needSleep', currentStateData);
      }
    } else {
      // 當實際時間不處於 22:59~7:00 之間時，將『狀態資料物件』的『needSleep』的 isActive 賦值為 0
      StateDataService.deactivateState('needSleep', currentStateData);
    }
  }

  /**
   * 檢查是否為睡眠時間（22:59~7:00）
   */
  private isSleepTime(hour: number, minute: number): boolean {
    // 22:59 到 23:59
    if (hour === 22 && minute >= 59) return true;
    if (hour === 23) return true;

    // 00:00 到 06:59
    if (hour >= 0 && hour < 7) return true;

    // 07:00 整點不算睡眠時間
    return false;
  }

  /**
   * 公開函數：開始睡眠
   */
  public startSleep(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 當實際時間處於 22:59~7:00 之間時，允許執行此函數，否則什麼也不執行
    if (!this.isSleepTime(currentHour, currentMinute)) {
      return;
    }

    const currentStateData = StateDataService.loadStateData();

    // 執行時將『狀態資料物件』的『isSleeping』的 isActive 賦值為 1
    StateDataService.activateState('isSleeping', currentStateData);

    // 執行時將『狀態資料物件』的『needSleep』的 isActive 賦值為 0
    StateDataService.deactivateState('needSleep', currentStateData);

    // 床圖片會由 BedComponent 根據光線和睡眠狀態自動更新
  }

  /**
   * 公開函數：喚醒電子雞
   */
  public wakeUp(): void {
    const currentPetStats = PetStatsService.loadPetStats();
    const currentStateData = StateDataService.loadStateData();

    // 若『狀態資料物件』的『isSleeping』的 isActive 值為 0，則什麼也不執行
    if (currentStateData.isSleeping.isActive === 0) {
      return;
    }

    // 需避免以下情況：電子雞尚未生成（rare 為 null）、已死亡（isDead 為 true）、離家出走（isLeaving 為 true）、冷凍（timeStopping 為 true）
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (currentPetStats.rare === null ||
        currentPetStats.isDead === true ||
        currentPetStats.isLeaving === true ||
        currentPetStats.timeStopping === true ||
        (currentPetStats.lifeCycle !== 'CHILD' && currentPetStats.lifeCycle !== 'EVOLUTION')) {
      return;
    }

    // 執行時將『狀態資料物件』的『isSleeping』的 isActive 賦值為 0
    StateDataService.deactivateState('isSleeping', currentStateData);

    // 檢查是否在睡眠時間被喚醒
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (this.isSleepTime(currentHour, currentMinute)) {
      // 若觸發時實際時間處於 22:59~7:00 之間
      const petName = currentPetStats.name || '電子雞';
      ToastrService.show(`${petName}在還沒睡飽的情況下被吵醒了，健康和情緒都受到了影響。`, 'warning');

      // 計算當前實際時間距離 7:00 尚有多少個小時（無條件進位）
      const hoursUntil7AM = this.calculateHoursUntil7AM(now);

      // 將『電子雞當前數值物件』的『當前好感度』扣除計算出來的小時數
      const friendshipPenalty = hoursUntil7AM;
      // 將『電子雞當前數值物件』的『當前健康度』扣除『計算出來的小時數除以二無條件進位後的數值』
      const wellnessPenalty = Math.ceil(hoursUntil7AM / 2);

      const updatedStats = {
        ...currentPetStats,
        currentFriendship: Math.max(0, currentPetStats.currentFriendship - friendshipPenalty),
        currentWellness: Math.max(0, currentPetStats.currentWellness - wellnessPenalty)
      };

      PetStatsService.savePetStats(updatedStats);
    }

    // 角色圖片會由 CharacterComponent 根據 lifeCycle 和 breed 自動更新
  }

  /**
   * 計算當前時間距離7:00還有多少小時（無條件進位）
   */
  private calculateHoursUntil7AM(currentTime: Date): number {
    const now = new Date(currentTime);
    const target = new Date(now);

    // 設定目標時間為今天或明天的7:00
    target.setHours(7, 0, 0, 0);

    // 如果現在已經過了今天的7:00，則目標設為明天的7:00
    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    // 計算時間差（毫秒）
    const timeDiff = target.getTime() - now.getTime();
    // 轉換為小時並無條件進位
    const hours = Math.ceil(timeDiff / (1000 * 60 * 60));

    return Math.max(1, hours); // 至少返回1小時
  }

  /**
   * 停止睡眠監控定時器（用於服務銷毀時清理）
   */
  public stopMonitoring(): void {
    if (this.sleepCheckInterval) {
      clearInterval(this.sleepCheckInterval);
      this.sleepCheckInterval = undefined;
    }
  }

  /**
   * 手動觸發睡眠時間檢查（用於調試）
   */
  public manualSleepCheck(): void {
    this.checkSleepTime();
  }

  /**
   * 獲取當前睡眠狀態（用於UI顯示）
   */
  public getSleepStatus(): {
    isSleeping: boolean;
    needSleep: boolean;
    isSleepTime: boolean;
  } {
    const currentStateData = StateDataService.loadStateData();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return {
      isSleeping: currentStateData.isSleeping.isActive === 1,
      needSleep: currentStateData.needSleep.isActive === 1,
      isSleepTime: this.isSleepTime(currentHour, currentMinute)
    };
  }
}