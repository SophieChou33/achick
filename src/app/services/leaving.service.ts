import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { LifecycleService } from './lifecycle.service';

@Injectable({
  providedIn: 'root'
})
export class LeavingService {
  private maxClickTime: number = 20;
  private isCanClick: boolean = true;
  private lastTimeReset: string | null = null;
  private clickTimes: number = 0;
  private resetInterval?: number;

  constructor(private lifecycleService: LifecycleService) {
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
  public leavingWindowEvent(): void {
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
    this.observing();

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
  private observing(): void {
    const currentPetStats = PetStatsService.loadPetStats();
    const petName = currentPetStats.name || '電子雞';
    const randomValue = Math.random();

    if (randomValue < 0.1) {
      // 10%機率：電子雞回家
      this.clickTimes = 0;

      const updatedStats = {
        ...currentPetStats,
        isLeaving: false,
        timeStopping: false,
        currentFriendship: 50,
        currentHealth: Math.max(50, currentPetStats.currentHealth)
      };

      PetStatsService.savePetStats(updatedStats);
      ToastrService.show(`${petName}因為受不了對你的思念而回家了，請好好對待他哦～`, 'success');

    } else if (randomValue < 0.2) {
      // 10%機率：電子雞死亡
      this.clickTimes = 0;
      ToastrService.show(`${petName}在弱肉強食的世界中不幸被淘汰了，愛要及時啊！`, 'error');
      this.lifecycleService.doKill();

    } else {
      // 80%機率：沒有找到
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
    }
  }

  /**
   * 獲取當前時間字串 (yyyy/mm/dd HH:mm:ss)
   */
  private getCurrentTimeString(): string {
    return UserDataService.formatDateTime(new Date());
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
  }
}