import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { ModalService } from './modal.service';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class LowLikabilityEventService {
  private lastPunishTime: string | null = null;
  private punishingInterval?: number;

  private static readonly LOW_LIKABILITY_STORAGE_KEY = 'achick_low_likability_times';

  constructor(
    private customTimeService: CustomTimeService,
    private modalService: ModalService
  ) {
    this.loadLowLikabilityTimes();
    this.startTimer();
  }

  /**
   * 啟動計時器
   */
  private startTimer(): void {
    this.punishingInterval = window.setInterval(() => {
      this.likabilityPunishing();
    }, 30000);
  }

  /**
   * 每30秒執行一次的私有函數：判斷是否要執行低好感度懲罰（健康度扣除）
   */
  private likabilityPunishing(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 當電子雞當前數值物件的 rare 為 null 時，將 lastPunishTime 重置為 null，並且不往下執行邏輯
    if (currentPetStats.rare === null) {
      this.lastPunishTime = null;
      return;
    }

    // 2. 當電子雞當前數值物件的 timeStopping 為 true 時，或是當前好感度 > 30 時
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (currentPetStats.timeStopping === true || currentPetStats.currentFriendship > 30 ||
        (currentPetStats.lifeCycle !== 'CHILD' && currentPetStats.lifeCycle !== 'EVOLUTION')) {
      const currentStateData = StateDataService.loadStateData();
      StateDataService.deactivateState('lowLikability', currentStateData);
      return;
    }

    // 3. 將狀態資料物件的 lowLikability 的 isActive 賦值為 1
    const currentStateData = StateDataService.loadStateData();
    StateDataService.activateState('lowLikability', currentStateData);

    // 4. 取得實際當前時間
    const currentTime = this.getCurrentTimeString();

    // 5. 若 lastPunishTime 為 null，則將實際當前時間賦值給 lastPunishTime，並且不往下執行邏輯
    if (this.lastPunishTime === null) {
      this.lastPunishTime = currentTime;
      this.saveLowLikabilityTimes();
      return;
    }

    // 6. 若 lastPunishTime 不為 null，則計算應該執行的懲罰次數
    const lastTime = this.parseTimeString(this.lastPunishTime);
    const now = this.parseTimeString(currentTime);
    const timeDiffMs = now.getTime() - lastTime.getTime();
    const twentyMinutesInMs = 20 * 60 * 1000; // 20分鐘 = 1200000毫秒

    if (timeDiffMs >= twentyMinutesInMs) {
      // 6.1 計算應該執行懲罰的次數（向下取整）
      const punishmentCount = Math.floor(timeDiffMs / twentyMinutesInMs);
      const totalWellnessDecrease = punishmentCount * 2;

      // 6.2 執行累積懲罰
      const updatedStats = {
        ...currentPetStats,
        currentWellness: Math.max(0, currentPetStats.currentWellness - totalWellnessDecrease)
      };

      PetStatsService.savePetStats(updatedStats);

      // 6.3 更新 lastPunishTime 為最後一次懲罰的時間點
      const lastPunishmentTime = new Date(lastTime.getTime() + (punishmentCount * twentyMinutesInMs));
      this.lastPunishTime = this.formatTimeFromDate(lastPunishmentTime);
      this.saveLowLikabilityTimes();

      const petName = currentPetStats.name || '電子雞';
      ToastrService.show(`${petName}因長時間缺乏關愛而身心靈受創，健康度-${totalWellnessDecrease}（${punishmentCount}次懲罰）`, 'warning');
    }

    // 檢查是否應該觸發離家出走
    this.shouldLeaveHouse();
  }

  /**
   * 判斷是否觸發電子雞離家出走事件
   */
  private async shouldLeaveHouse(): Promise<boolean> {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 timeStopping 為 true 時，不往下執行邏輯
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行離家出走檢查
    if (currentPetStats.timeStopping === true ||
        (currentPetStats.lifeCycle !== 'CHILD' && currentPetStats.lifeCycle !== 'EVOLUTION')) {
      return false;
    }

    if (currentPetStats.currentFriendship >= 10) {
      // 好感度 >= 10，設置 isLeaving 為 false
      const updatedStats = {
        ...currentPetStats,
        isLeaving: false
      };
      PetStatsService.savePetStats(updatedStats);
      return false;
    } else {
      // 好感度 < 10，觸發離家出走
      const petName = currentPetStats.name || '電子雞';

      // 先設置離家出走狀態
      const updatedStats = {
        ...currentPetStats,
        isLeaving: true,
        timeStopping: true
      };
      PetStatsService.savePetStats(updatedStats);

      // 顯示離家出走確認彈窗
      await this.modalService.info(
        `${petName}因為缺乏關愛憤而離家，\n\n請點擊窗戶關注他有沒有回家。`,
        '離家出走'
      );

      return true;
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
   * 停止計時器（用於服務銷毀時清理）
   */
  public stopTimer(): void {
    if (this.punishingInterval) {
      clearInterval(this.punishingInterval);
      this.punishingInterval = undefined;
    }
  }

  /**
   * 重置懲罰時間（用於調試或重置）
   */
  public resetPunishTime(): void {
    this.lastPunishTime = null;
    this.saveLowLikabilityTimes();
  }

  /**
   * 手動觸發低好感度檢查（工程師模式使用）
   */
  public manualTriggerLikabilityCheck(): void {
    console.log('手動觸發低好感度檢查');
    this.likabilityPunishing();
  }

  /**
   * 手動觸發離家出走檢查（工程師模式使用）
   */
  public manualTriggerLeavingCheck(): void {
    console.log('手動觸發離家出走檢查');
    this.shouldLeaveHouse();
  }

  /**
   * 載入低好感度時間資料
   */
  private loadLowLikabilityTimes(): void {
    try {
      const savedData = localStorage.getItem(LowLikabilityEventService.LOW_LIKABILITY_STORAGE_KEY);
      if (savedData) {
        const likabilityData = JSON.parse(savedData);
        this.lastPunishTime = likabilityData.lastPunishTime || null;
      }
    } catch (error) {
      console.error('Failed to load low likability times:', error);
      this.lastPunishTime = null;
    }
  }

  /**
   * 儲存低好感度時間資料
   */
  private saveLowLikabilityTimes(): void {
    try {
      const likabilityData = {
        lastPunishTime: this.lastPunishTime
      };
      localStorage.setItem(LowLikabilityEventService.LOW_LIKABILITY_STORAGE_KEY, JSON.stringify(likabilityData));
    } catch (error) {
      console.error('Failed to save low likability times:', error);
    }
  }
}
