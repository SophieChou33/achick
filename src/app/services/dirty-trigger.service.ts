import { Injectable } from '@angular/core';
import { DirtyObject } from '../types/dirty-object.type';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class DirtyTriggerService {
  private maxDirtyCounts: number = 3;
  private lastAddDirtyTime: string | null = null;
  public dirtyObjects: DirtyObject[] = [];

  private addDirtyInterval?: number;
  private dirtyPunishingInterval?: number;

  private static readonly DIRTY_STORAGE_KEY = 'achick_dirty_data';

  constructor(private customTimeService: CustomTimeService) {
    this.loadDirtyData();
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
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (currentPetStats.timeStopping === true || this.dirtyObjects.length >= this.maxDirtyCounts ||
        (currentPetStats.lifeCycle !== 'CHILD' && currentPetStats.lifeCycle !== 'EVOLUTION')) {
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
      // 5.1 計算應該產生多少個髒污物件（每小時一個）
      const hoursElapsed = Math.floor(timeDiff / oneHourInMs);

      // 計算實際可以產生的髒污數量（不超過最大限制）
      const availableSlots = this.maxDirtyCounts - this.dirtyObjects.length;
      const dirtyToCreate = Math.min(hoursElapsed, availableSlots);

      // 產生對應數量的髒污物件
      for (let i = 0; i < dirtyToCreate; i++) {
        const newDirtyNo = this.getNextDirtyNo();
        const newDirtyObject: DirtyObject = {
          dirtyNo: newDirtyNo,
          dirtyTime: currentTime,
          lastPunishTime: currentTime
        };

        this.dirtyObjects.push(newDirtyObject);
      }

      // 更新最後添加髒污時間
      this.lastAddDirtyTime = currentTime;

      // 儲存髒污資料
      if (dirtyToCreate > 0) {
        this.saveDirtyData();
      }
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
    const currentTime = this.getCurrentTimeString();

    // 1. 當電子雞當前數值物件的 rare 為 null 時，或是當電子雞當前數值物件的 timeStoping 為 true 時，
    // 或是 dirtyObjects.length 為 0 時，不往下執行邏輯
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (currentPetStats.rare === null ||
        currentPetStats.timeStopping === true ||
        this.dirtyObjects.length === 0 ||
        (currentPetStats.lifeCycle !== 'CHILD' && currentPetStats.lifeCycle !== 'EVOLUTION')) {
      return;
    }

    // 2. 使用已取得的當前時間
    const now = this.parseTimeString(currentTime);

    // 3. 計算總懲罰次數
    let totalPenalties = 0;
    let dataChanged = false;

    this.dirtyObjects.forEach((dirtyObject, index) => {
      const dirtyTime = this.parseTimeString(dirtyObject.dirtyTime);
      const timeDiffFromCreation = now.getTime() - dirtyTime.getTime();
      const twentyMinutesInMs = 20 * 60 * 1000; // 20分鐘 = 1200000毫秒

      // 只有當髒污存在超過20分鐘才開始懲罰
      if (timeDiffFromCreation >= twentyMinutesInMs) {
        // 計算從髒污產生到現在應該懲罰多少次（每20分鐘一次）
        const totalIntervalsFromCreation = Math.floor(timeDiffFromCreation / twentyMinutesInMs);

        // 計算已經懲罰過多少次
        let alreadyPunished = 0;
        if (dirtyObject.lastPunishTime) {
          const lastPunishTime = this.parseTimeString(dirtyObject.lastPunishTime);
          const timeDiffFromLastPunish = lastPunishTime.getTime() - dirtyTime.getTime();
          alreadyPunished = Math.floor(timeDiffFromLastPunish / twentyMinutesInMs);
        }

        // 計算需要新增的懲罰次數
        const newPenalties = totalIntervalsFromCreation - alreadyPunished;

        if (newPenalties > 0) {
          totalPenalties += newPenalties;

          // 更新最後懲罰時間
          this.dirtyObjects[index].lastPunishTime = currentTime;
          dataChanged = true;
        }
      }
    });

    // 如果有懲罰，扣除電子雞數值
    if (totalPenalties > 0) {

      const updatedStats = {
        ...currentPetStats,
        currentWellness: Math.max(0, currentPetStats.currentWellness - totalPenalties),
        currentFriendship: Math.max(0, currentPetStats.currentFriendship - totalPenalties)
      };

      PetStatsService.savePetStats(updatedStats);

      // 驗證是否成功儲存
      const verifyStats = PetStatsService.loadPetStats();

      // 顯示 toastr 訊息
      const petName = currentPetStats.name || '電子雞';
      ToastrService.show(`${petName}因環境骯髒而身心靈受創，健康度-${totalPenalties}，好感度-${totalPenalties}`, 'warning');
    }

    // 如果有更新髒污物件的懲罰時間，儲存資料
    if (dataChanged) {
      this.saveDirtyData();
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
    this.lastAddDirtyTime = this.getCurrentTimeString(); // 設定為當前時間
    this.saveDirtyData();
  }

  /**
   * 清除所有髒污並設定上次添加髒污時間為當前時間
   */
  public clearAllDirtyObjects(): void {
    this.dirtyObjects = [];
    this.lastAddDirtyTime = this.getCurrentTimeString(); // 設定為當前時間
    this.saveDirtyData();
  }

  /**
   * 移除指定的髒污物件（用於清理功能）
   */
  public removeDirtyObject(dirtyNo: number): void {
    this.dirtyObjects = this.dirtyObjects.filter(dirty => dirty.dirtyNo !== dirtyNo);

    // 如果清除所有髒污，設定上次添加髒污時間為當前時間
    if (this.dirtyObjects.length === 0) {
      this.lastAddDirtyTime = this.getCurrentTimeString();
    }

    this.saveDirtyData();
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

  /**
   * 載入髒污資料
   */
  private loadDirtyData(): void {
    try {
      const savedData = localStorage.getItem(DirtyTriggerService.DIRTY_STORAGE_KEY);
      if (savedData) {
        const dirtyData = JSON.parse(savedData);
        this.dirtyObjects = dirtyData.dirtyObjects || [];
        this.lastAddDirtyTime = dirtyData.lastAddDirtyTime || null;
      }
    } catch (error) {
      console.error('Failed to load dirty data:', error);
      this.dirtyObjects = [];
      this.lastAddDirtyTime = null;
    }
  }

  /**
   * 儲存髒污資料
   */
  public saveDirtyData(): void {
    try {
      const dirtyData = {
        dirtyObjects: this.dirtyObjects,
        lastAddDirtyTime: this.lastAddDirtyTime
      };
      localStorage.setItem(DirtyTriggerService.DIRTY_STORAGE_KEY, JSON.stringify(dirtyData));
    } catch (error) {
      console.error('Failed to save dirty data:', error);
    }
  }

  /**
   * 載入髒污資料（用於匯入功能）
   */
  public loadDirtyDataFromObject(data: any): void {
    if (data && typeof data === 'object') {
      this.dirtyObjects = data.dirtyObjects || [];
      this.lastAddDirtyTime = data.lastAddDirtyTime || null;
      this.saveDirtyData();
    }
  }

  /**
   * 匯出髒污資料（用於匯出功能）
   */
  public exportDirtyData(): any {
    return {
      dirtyObjects: this.dirtyObjects,
      lastAddDirtyTime: this.lastAddDirtyTime
    };
  }
}
