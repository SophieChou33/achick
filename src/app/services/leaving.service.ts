import { Injectable, Injector } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { ModalService } from './modal.service';
import { CustomTimeService } from './custom-time.service';
import { LifecycleService } from './lifecycle.service';
import { DirtyTriggerService } from './dirty-trigger.service';
import { LightService } from './light.service';
import { TouchEventService } from './touch-event.service';
import { WellnessCheckService } from './wellness-check.service';
import { LowLikabilityEventService } from './low-likability-event.service';
import { HungerManagerService } from './hunger-manager.service';

@Injectable({
  providedIn: 'root'
})
export class LeavingService {
  private maxClickTime: number = 20;
  private isCanClick: boolean = true;
  private lastTimeReset: string | null = null;
  private clickTimes: number = 0;
  private resetInterval?: number;

  private static readonly LEAVING_STORAGE_KEY = 'achick_leaving_times';

  constructor(
    private lifecycleService: LifecycleService,
    private customTimeService: CustomTimeService,
    private modalService: ModalService,
    private injector: Injector
  ) {
    this.loadLeavingTimes();
    this.startResetTimer();
  }

  /**
   * 啟動重置計時器
   */
  private startResetTimer(): void {
    this.resetInterval = window.setInterval(() => {
      this.resetClickTimes();
    }, 30000);
  }

  /**
   * 每當點擊窗戶DOM元素時觸發此事件
   */
  public async leavingWindowEvent(): Promise<void> {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 若電子雞當前數值物件的 isLeaving 為 false，不往下執行邏輯
    if (!currentPetStats.isLeaving) {
      return;
    }

    // 2. 若 isLeaving 為 true，clickTimes 等於 maxClickTime，則跳出 toastr
    if (currentPetStats.isLeaving && this.clickTimes === this.maxClickTime) {
      const petName = currentPetStats.name || '電子雞';
      ToastrService.show(`暫時沒有${petName}的消息，晚點再試試吧！`, 'info');
      return;
    }

    // 3. 將本 service 的 isCanClick 賦值為 false
    this.isCanClick = false;

    // 4. 執行 observing 函數
    await this.observing();

    // 5. clickTimes +1 後重新賦值給 clickTimes
    this.clickTimes += 1;

    // 6. 兩秒後，本 service 的 isCanClick 賦值為 true
    setTimeout(() => {
      this.isCanClick = true;
    }, 2000);
  }

  /**
   * 判斷是否切換 isLeaving 的值
   */
  private async observing(): Promise<void> {
    const currentPetStats = PetStatsService.loadPetStats();
    const petName = currentPetStats.name || '電子雞';
    const randomValue = Math.random();

    if (randomValue < 0.22) {
      // 22%機率：電子雞回家
      this.clickTimes = 0;

      const updatedStats = {
        ...currentPetStats,
        isLeaving: false,
        timeStopping: false,
        isDead: false,
        currentFriendship: 50,
        currentHealth: Math.max(50, currentPetStats.currentHealth)
      };

      PetStatsService.savePetStats(updatedStats);

      // 重置所有定時檢查器的時間，避免累積扣除過多
      this.resetAllTimersOnReturn();

      await this.modalService.info(`${petName}因為受不了對你的思念而回家了，請好好對待他哦～`, '電子雞回家了！');

    } else if (randomValue < 0.35) {
      // 13%機率：電子雞死亡
      this.clickTimes = 0;
      ToastrService.show(`${petName}在弱肉強食的世界中不幸被淘汰了，愛要及時啊！`, 'error');

      // 設定 isLeaving 為 false，因為電子雞已死亡
      const updatedStats = {
        ...currentPetStats,
        isLeaving: false
      };
      PetStatsService.savePetStats(updatedStats);

      // 重置所有定時檢查器的時間，避免後續邏輯異常
      this.resetAllTimersOnReturn();

      // 使用自定義死亡原因
      await this.lifecycleService.doKill(`${petName}在外面的世界遭遇不測，再也回不來了...`);

    } else {
      // 65%機率：沒有找到
      ToastrService.show(`你向窗外尋找${petName}的蹤影，卻連顆蛋都沒找到`, 'warning');
    }
  }


  /**
   * 每30秒執行一次：重置窗戶累積點擊次數
   */
  private resetClickTimes(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 檢查重置條件
    if (currentPetStats.rare === null ||
        currentPetStats.timeStopping === true ||
        !currentPetStats.isLeaving) {
      if (this.clickTimes > 0) {
        this.clickTimes = 0;
      }
      return;
    }

    // 2. 若 clickTimes < maxClickTime 時，不往下執行邏輯
    if (this.clickTimes < this.maxClickTime) {
      return;
    }

    // 3. 若 lastTimeReset 為 null，則將實際當前時間賦值給 lastTimeReset
    if (this.lastTimeReset === null) {
      this.lastTimeReset = this.getCurrentTimeString();
      this.saveLeavingTimes();
      return;
    }

    // 4. 取得實際當前時間，若當前時間距離 lastTimeReset 已經過1個小時
    const currentTime = this.getCurrentTimeString();
    const lastTime = this.parseTimeString(this.lastTimeReset);
    const now = this.parseTimeString(currentTime);
    const timeDiff = now.getTime() - lastTime.getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1小時 = 3600000毫秒

    if (timeDiff >= oneHourInMs) {
      this.clickTimes = 0;
      this.lastTimeReset = currentTime;
      this.saveLeavingTimes();
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
   * 檢查是否可以點擊
   */
  public getIsCanClick(): boolean {
    return this.isCanClick;
  }

  /**
   * 獲取當前點擊次數
   */
  public getClickTimes(): number {
    return this.clickTimes;
  }

  /**
   * 停止計時器（用於服務銷毀時清理）
   */
  public stopTimer(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = undefined;
    }
  }

  /**
   * 重置所有狀態（用於調試或重置）
   */
  public resetAllState(): void {
    this.clickTimes = 0;
    this.lastTimeReset = null;
    this.isCanClick = true;
    this.saveLeavingTimes();
  }

  /**
   * 重置點擊次數限制（工程師模式用）
   */
  public resetClickLimit(): void {
    this.clickTimes = 0;
    this.isCanClick = true;
  }

  /**
   * 載入離家時間資料
   */
  private loadLeavingTimes(): void {
    try {
      const savedData = localStorage.getItem(LeavingService.LEAVING_STORAGE_KEY);
      if (savedData) {
        const leavingData = JSON.parse(savedData);
        this.lastTimeReset = leavingData.lastTimeReset || null;
        this.clickTimes = leavingData.clickTimes || 0;
      }
    } catch (error) {
      console.error('Failed to load leaving times:', error);
      this.lastTimeReset = null;
      this.clickTimes = 0;
    }
  }

  /**
   * 儲存離家時間資料
   */
  private saveLeavingTimes(): void {
    try {
      const leavingData = {
        lastTimeReset: this.lastTimeReset,
        clickTimes: this.clickTimes
      };
      localStorage.setItem(LeavingService.LEAVING_STORAGE_KEY, JSON.stringify(leavingData));
    } catch (error) {
      console.error('Failed to save leaving times:', error);
    }
  }

  /**
   * 重置所有定時檢查器的時間（避免循環依賴，直接操作各服務）
   */
  private resetAllTimersOnReturn(): void {
    const currentTime = this.customTimeService.formatTime();

    // 使用 Injector 延遲獲取服務，避免循環依賴
    const dirtyTriggerService = this.injector.get(DirtyTriggerService, null);
    const lightService = this.injector.get(LightService, null);
    const touchEventService = this.injector.get(TouchEventService, null);
    const wellnessCheckService = this.injector.get(WellnessCheckService, null);
    const lowLikabilityEventService = this.injector.get(LowLikabilityEventService, null);
    const hungerManagerService = this.injector.get(HungerManagerService, null);

    // 重置各服務的時間
    if (dirtyTriggerService) {
      (dirtyTriggerService as any).lastAddDirtyTime = currentTime;
      (dirtyTriggerService as any).saveDirtyData?.();
    }

    if (lightService) {
      (lightService as any).lastLightCheckTime = currentTime;
      (lightService as any).saveLightTimes?.();
    }

    if (touchEventService) {
      (touchEventService as any).lastTimeReset = currentTime;
      (touchEventService as any).saveTouchData?.();
    }

    if (wellnessCheckService) {
      (wellnessCheckService as any).lastSickCheckTime = currentTime;
      (wellnessCheckService as any).lastLifeDamageTime = currentTime;
      (wellnessCheckService as any).lastDiseaseCheckTime = currentTime;
      (wellnessCheckService as any).saveWellnessTimes?.();
    }

    if (lowLikabilityEventService) {
      (lowLikabilityEventService as any).lastPunishTime = currentTime;
      (lowLikabilityEventService as any).saveLowLikabilityTimes?.();
    }

    if (hungerManagerService) {
      (hungerManagerService as any).lastHungerTime = currentTime;
      (hungerManagerService as any).hungerStateStartTime = currentTime;
      (hungerManagerService as any).lastHungerPenaltyTime = currentTime;
      (hungerManagerService as any).saveHungerTimes?.();
    }

    // 重置自己的時間
    this.lastTimeReset = currentTime;
    this.saveLeavingTimes();
  }
}
