import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { LightService } from './light.service';
import { CustomTimeService } from './custom-time.service';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { ModalService } from './modal.service';

@Injectable({
  providedIn: 'root'
})
export class SleepService {
  private sleepCheckInterval?: number;

  constructor(
    private lightService: LightService,
    private customTimeService: CustomTimeService,
    private modalService: ModalService
  ) {
    this.startSleepMonitoring();
    // 初始化時立即執行一次檢查
    setTimeout(() => {
      this.checkSleepTime();
    }, 1000);
  }

  /**
   * 啟動睡眠監控定時器
   */
  private startSleepMonitoring(): void {
    // 每30秒執行一次睡眠時間檢查
    this.sleepCheckInterval = window.setInterval(() => {
      this.checkSleepTime();
    }, 30000); // 30秒
  }

  /**
   * 每30秒執行一次的私有函數：檢查睡眠時間狀態
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
    const now = this.customTimeService.getCurrentTime();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 檢查是否處於睡眠時間（22:59~7:00）
    const isSleepTime = this.isSleepTime(currentHour, currentMinute);


    if (isSleepTime) {
      // 當當前時間處於 22:59~7:00 之間時
      if (currentStateData.isSleeping.isActive === 1) {
        // 若『狀態資料物件』的『isSleeping』的 isActive 為 1，則不執行檢查
        return;
      } else {
        // 若『狀態資料物件』的『isSleeping』的 isActive 為 0，則將『狀態資料物件』的『needSleep』的 isActive 賦值為 1
        if (currentStateData.needSleep?.isActive !== 1) {
          StateDataService.activateState('needSleep', currentStateData);
        }
      }
    } else {
      // 當當前時間不處於 22:59~7:00 之間時

      // 如果電子雞還在睡眠中，強制喚醒（自己起床）
      if (currentStateData.isSleeping.isActive === 1) {

        // 將『狀態資料物件』的『isSleeping』的 isActive 賦值為 0
        StateDataService.deactivateState('isSleeping', currentStateData);

        // 顯示起床通知
        const petName = currentPetStats.name || '電子雞';
        ToastrService.show(`${petName} 自然醒來，開始新的一天！`, 'success');
      }

      // 將『狀態資料物件』的『needSleep』的 isActive 賦值為 0
      if (currentStateData.needSleep?.isActive === 1) {
        StateDataService.deactivateState('needSleep', currentStateData);
      }
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
    // 檢查寵物狀態
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，不往下執行邏輯
    if (currentPetStats.rare === null) {
      return;
    }

    // 當電子雞當前數值物件的 timeStopping 為 true 時，不往下執行邏輯
    if (currentPetStats.timeStopping === true) {
      return;
    }

    const now = this.customTimeService.getCurrentTime();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();


    // 當當前時間處於 22:59~7:00 之間時，允許執行此函數，否則什麼也不執行
    if (!this.isSleepTime(currentHour, currentMinute)) {
      return;
    }


    // 檢查是否已經在睡眠中
    const currentStateData = StateDataService.loadStateData();
    if (currentStateData.isSleeping.isActive === 1) {
      ToastrService.show('電子雞已經在睡眠中了。', 'info');
      return;
    }

    // 檢查光線條件 - 睡眠需要無光線環境（沒有日照且電燈關閉）
    const lightStatus = this.lightService.getLightStatus();

    if (lightStatus.hasLight) {

      // 根據光線來源給出不同的提示
      if (lightStatus.isDay && lightStatus.isLightOn) {
        ToastrService.show('現在是白天且電燈開啟，請等待天黑並關燈後再睡眠。', 'warning');
      } else if (lightStatus.isDay) {
        ToastrService.show('現在是白天，請等待天黑後再睡眠。', 'warning');
      } else if (lightStatus.isLightOn) {
        ToastrService.show('請關閉電燈後再睡眠。', 'warning');
      }
      return;
    }

    // 執行時將『狀態資料物件』的『isSleeping』的 isActive 賦值為 1
    const updatedStateData1 = StateDataService.activateState('isSleeping', currentStateData);

    // 執行時將『狀態資料物件』的『needSleep』的 isActive 賦值為 0
    StateDataService.deactivateState('needSleep', updatedStateData1);

    // 驗證狀態是否真的改變了
    const updatedStateData = StateDataService.loadStateData();

    // 床圖片會由 BedComponent 根據光線和睡眠狀態自動更新
  }

  /**
   * 公開函數：帶確認對話框的強制喚醒電子雞（用於床點擊）
   */
  public async forceWakeUpWithConfirmation(): Promise<void> {
    const currentStateData = StateDataService.loadStateData();

    // 檢查電子雞是否在睡眠中
    if (currentStateData.isSleeping.isActive === 0) {
      // ToastrService.show('電子雞沒有在睡眠中。', 'info');
      return;
    }

    const currentPetStats = PetStatsService.loadPetStats();
    const petName = currentPetStats.name || '電子雞';

    // 計算自然醒來時間
    const naturalWakeTime = this.calculateNaturalWakeTime();
    const wakeTimeString = this.formatTimeString(naturalWakeTime);

    // 計算懲罰
    const now = this.customTimeService.getCurrentTime();
    const hoursUntil7AM = this.calculateHoursUntil7AM(now);
    const friendshipPenalty = hoursUntil7AM;
    const wellnessPenalty = Math.ceil(hoursUntil7AM / 2);

    // 顯示確認對話框
    const confirmMessage = `${petName} 正在睡眠中。\n\n自然醒來時間：${wakeTimeString}\n\n強制喚醒將會：\n• 好感度 -${friendshipPenalty}\n• 健康度 -${wellnessPenalty}\n\n確定要強制喚醒嗎？`;

    const confirmed = await this.modalService.confirm(confirmMessage, '強制喚醒確認');

    if (confirmed) {
      this.wakeUp();
    }
  }

  /**
   * 內部函數：喚醒電子雞（不含確認對話框）
   */
  private wakeUp(): void {
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
    const now = this.customTimeService.getCurrentTime();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (this.isSleepTime(currentHour, currentMinute)) {
      // 若觸發時當前時間處於 22:59~7:00 之間
      const petName = currentPetStats.name || '電子雞';
      ToastrService.show(`${petName}在還沒睡飽的情況下被吵醒了，健康和情緒都受到了影響。`, 'warning');

      // 計算當前時間距離 7:00 尚有多少個小時（無條件進位）
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
   * 計算自然醒來時間（7:00）
   */
  private calculateNaturalWakeTime(): Date {
    const now = this.customTimeService.getCurrentTime();
    const target = new Date(now);

    // 設定目標時間為今天或明天的7:00
    target.setHours(7, 0, 0, 0);

    // 如果現在已經過了今天的7:00，則目標設為明天的7:00
    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }

  /**
   * 格式化時間字串為可讀格式
   */
  private formatTimeString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
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
    const now = this.customTimeService.getCurrentTime();
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
    const now = this.customTimeService.getCurrentTime();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return {
      isSleeping: currentStateData.isSleeping.isActive === 1,
      needSleep: currentStateData.needSleep.isActive === 1,
      isSleepTime: this.isSleepTime(currentHour, currentMinute)
    };
  }
}
