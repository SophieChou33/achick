import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class LowLikabilityEventService {
  private lastPunishTime: string | null = null;
  private punishingInterval?: number;

  constructor(private customTimeService: CustomTimeService) {
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
   * 每30秒執行一次的私有函數：判斷是否要執行低好感度懲罰
   */
  private likabilityPunishing(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 當電子雞當前數值物件的 rare 為 null 時，將 lastPunishTime 重置為 null，並且不往下執行邏輯
    if (currentPetStats.rare === null) {
      this.lastPunishTime = null;
      return;
    }

    // 2. 當電子雞當前數值物件的 timeStopping 為 true 時，或是當前好感度 > 30 時
    if (currentPetStats.timeStopping === true || currentPetStats.currentFriendship > 30) {
      const currentStateData = StateDataService.loadStateData();
      StateDataService.deactivateState('lowLikability', currentStateData);
      return;
    }

    // 3. 執行 shouldLeaveHouse 函數
    this.shouldLeaveHouse();

    // 4. 將狀態資料物件的 lowLikability 的 isActive 賦值為 1
    const currentStateData = StateDataService.loadStateData();
    StateDataService.activateState('lowLikability', currentStateData);

    // 5. 取得實際當前時間
    const currentTime = this.getCurrentTimeString();

    // 6. 若 lastPunishTime 為 null，則將實際當前時間賦值給 lastPunishTime，並且不往下執行邏輯
    if (this.lastPunishTime === null) {
      this.lastPunishTime = currentTime;
      return;
    }

    // 7. 若 lastPunishTime 不為 null，則判斷實際當前時間距離 lastPunishTime 是否已過 20 分鐘
    const lastTime = this.parseTimeString(this.lastPunishTime);
    const now = this.parseTimeString(currentTime);
    const timeDiff = now.getTime() - lastTime.getTime();
    const twentyMinutesInMs = 20 * 60 * 1000; // 20分鐘 = 1200000毫秒

    if (timeDiff >= twentyMinutesInMs) {
      // 7.2 若已過 20 分鐘，則執行懲罰
      const updatedStats = {
        ...currentPetStats,
        currentHealth: Math.max(0, currentPetStats.currentHealth - 2)
      };

      PetStatsService.savePetStats(updatedStats);
      this.lastPunishTime = currentTime;

      const petName = currentPetStats.name || '電子雞';
      ToastrService.show(`${petName}因過度缺乏關愛而身心靈受創，健康度-2`, 'warning');
    }
  }

  /**
   * 判斷是否觸發電子雞離家出走事件
   */
  private shouldLeaveHouse(): boolean {
    const currentPetStats = PetStatsService.loadPetStats();

    if (currentPetStats.currentFriendship >= 10) {
      // 好感度 >= 10，設置 isLeaving 為 false
      const updatedStats = {
        ...currentPetStats,
        isLeaving: false
      };
      PetStatsService.savePetStats(updatedStats);
      return false;
    } else {
      // 好感度 < 10，設置 isLeaving 為 true，timeStoping 為 true
      const updatedStats = {
        ...currentPetStats,
        isLeaving: true,
        timeStopping: true
      };
      PetStatsService.savePetStats(updatedStats);
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
  }
}