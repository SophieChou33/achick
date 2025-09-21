import { Injectable } from '@angular/core';
import { DirtyObject } from '../types/dirty-object.type';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';

@Injectable({
  providedIn: 'root'
})
export class DirtyTriggerService {
  private maxDirtyCounts: number = 3;
  private lastAddDirtyTime: string | null = null;
  public dirtyObjects: DirtyObject[] = [];

  private addDirtyInterval?: number;
  private dirtyPunishingInterval?: number;

  constructor() {
    this.startTimers();
  }

  /**
   * 啟動計時器
   */
  private startTimers(): void {
    // 每30秒執行 addDirtyObject
    this.addDirtyInterval = window.setInterval(() => {
      this.addDirtyObject();
    }, 30000);

    // 每30秒執行 dirtyPunishing
    this.dirtyPunishingInterval = window.setInterval(() => {
      this.dirtyPunishing();
    }, 30000);
  }

  /**
   * 每30秒執行一次的私有函數：判斷是否要在 dirtyObjects 陣列新增髒污物件
   */
  private addDirtyObject(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 當電子雞當前數值物件的 rare 為 null 時，將 lastAddDirtyTime 重置為 null，並且不往下執行邏輯
    if (currentPetStats.rare === null) {
      this.lastAddDirtyTime = null;
      return;
    }

    // 2. 當電子雞當前數值物件的 timeStoping 為 true 時，或是 dirtyObjects.length ≥ maxDirtyCounts 時，不往下執行邏輯
    if (currentPetStats.timeStopping === true || this.dirtyObjects.length >= this.maxDirtyCounts) {
      return;
    }

    // 3. 取得實際當前時間
    const currentTime = this.getCurrentTimeString();

    // 4. 若 lastAddDirtyTime 為 null，則將實際當前時間賦值給 lastAddDirtyTime，並且不往下執行邏輯
    if (this.lastAddDirtyTime === null) {
      this.lastAddDirtyTime = currentTime;
      return;
    }

    // 5. 若 lastAddDirtyTime 不為 null，則判斷實際當前時間距離 lastAddDirtyTime 是否已超過 1 小時
    const lastTime = this.parseTimeString(this.lastAddDirtyTime);
    const now = this.parseTimeString(currentTime);
    const timeDiff = now.getTime() - lastTime.getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1小時 = 3600000毫秒

    if (timeDiff >= oneHourInMs) {
      // 5.1 若已超過 1 小時，向 dirtyObjects 陣列 push 一個 DirtyObject 類型物件
      const newDirtyNo = this.getNextDirtyNo();
      const newDirtyObject: DirtyObject = {
        dirtyNo: newDirtyNo,
        dirtyTime: currentTime
      };

      this.dirtyObjects.push(newDirtyObject);
      this.lastAddDirtyTime = currentTime; // 更新最後添加髒污時間
    }
  }

  /**
   * 獲取下一個可用的 dirtyNo
   */
  private getNextDirtyNo(): number {
    // const allDirtyNoArray 陣列，依據 maxDirtyCounts，列出從 1 開始的陣列
    const allDirtyNoArray: number[] = [];
    for (let i = 1; i <= this.maxDirtyCounts; i++) {
      allDirtyNoArray.push(i);
    }

    // forEach 判斷 allDirtyNoArray 陣列中的每一個數字
    for (const num of allDirtyNoArray) {
      // 若該數字不符合 dirtyObjects 陣列中的任何 DirtyObject 的 dirtyNo
      const isUsed = this.dirtyObjects.some(dirty => dirty.dirtyNo === num);
      if (!isUsed) {
        return num; // 將該數字作為 dirtyNo
      }
    }

    // 如果所有數字都被使用，返回 1（理論上不應該發生，因為有 maxDirtyCounts 限制）
    return 1;
  }

  /**
   * 每30秒執行一次的私有函數：判斷是否要執行環境過髒懲罰
   */
  private dirtyPunishing(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 當電子雞當前數值物件的 rare 為 null 時，或是當電子雞當前數值物件的 timeStoping 為 true 時，
    // 或是 dirtyObjects.length 為 0 時，不往下執行邏輯
    if (currentPetStats.rare === null ||
        currentPetStats.timeStopping === true ||
        this.dirtyObjects.length === 0) {
      return;
    }

    // 2. 取得實際當前時間
    const currentTime = this.getCurrentTimeString();
    const now = this.parseTimeString(currentTime);

    // 3. foreach 判斷 dirtyObjects 陣列中的每個 DirtyObject 的 dirtyTime
    this.dirtyObjects.forEach(dirtyObject => {
      const dirtyTime = this.parseTimeString(dirtyObject.dirtyTime);
      const timeDiff = now.getTime() - dirtyTime.getTime();
      const twentyMinutesInMs = 20 * 60 * 1000; // 20分鐘 = 1200000毫秒

      // 若實際當前時間距離該 dirtyTime 超過 20 分鐘
      if (timeDiff >= twentyMinutesInMs) {
        // 扣除電子雞數值
        const updatedStats = {
          ...currentPetStats,
          currentWellness: Math.max(0, currentPetStats.currentWellness - 1),
          currentFriendship: Math.max(0, currentPetStats.currentFriendship - 1)
        };

        PetStatsService.savePetStats(updatedStats);

        // 顯示 toastr 訊息
        const petName = currentPetStats.name || '電子雞';
        ToastrService.show(`${petName}因環境骯髒而身心靈受創，健康度-1，好感度-1`, 'warning');
      }
    });
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
    // 解析 yyyy/mm/dd HH:mm:ss 格式
    const [datePart, timePart] = timeString.split(' ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  /**
   * 停止計時器（用於服務銷毀時清理）
   */
  public stopTimers(): void {
    if (this.addDirtyInterval) {
      clearInterval(this.addDirtyInterval);
      this.addDirtyInterval = undefined;
    }
    if (this.dirtyPunishingInterval) {
      clearInterval(this.dirtyPunishingInterval);
      this.dirtyPunishingInterval = undefined;
    }
  }

  /**
   * 重置所有髒污狀態（用於調試或重置）
   */
  public resetDirtyState(): void {
    this.dirtyObjects = [];
    this.lastAddDirtyTime = null;
  }

  /**
   * 移除指定的髒污物件（用於清理功能）
   */
  public removeDirtyObject(dirtyNo: number): void {
    this.dirtyObjects = this.dirtyObjects.filter(dirty => dirty.dirtyNo !== dirtyNo);
  }

  /**
   * 獲取當前髒污物件數量
   */
  public getDirtyCount(): number {
    return this.dirtyObjects.length;
  }

  /**
   * 檢查是否達到最大髒污數量
   */
  public isMaxDirty(): boolean {
    return this.dirtyObjects.length >= this.maxDirtyCounts;
  }
}