import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { PetStats } from '../types/pet-stats.type';
import { UserDataService } from '../data/user-data';
import { StateDataService } from '../data/state-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { WhiteTransitionService } from './white-transition.service';
import { CollectionService } from '../data/collection-data';
import { sources } from '../sources';

@Injectable({
  providedIn: 'root'
})
export class TouchEventService {
  private maxTouchTime: number = 15;
  private isCanTouch: boolean = true;
  private lastTimeReset: string | null = null;
  private touchedTimes: number = 0;
  private resetInterval?: number;

  constructor(private whiteTransitionService: WhiteTransitionService) {
    this.startResetTimer();
  }

  /**
   * 每30秒執行一次的重置撫摸次數函數
   */
  private startResetTimer(): void {
    this.resetInterval = window.setInterval(() => {
      this.resetTouchTimes();
    }, 30000); // 30秒
  }

  /**
   * 撫摸事件主函數
   */
  public touchingEvent(): void {
    const currentPetStats = PetStatsService.loadPetStats();
    const currentStateData = StateDataService.loadStateData();

    // 1. 若電子雞當前數值物件的 rare 為 null 時，或是當電子雞當前數值物件的 timeStoping 為 true 時，不往下執行邏輯
    if (currentPetStats.rare === null || currentPetStats.timeStopping === true) {
      return;
    }

    // 2. 當狀態 isSleeping 等於 1 時，不往下執行邏輯
    if (currentStateData.isSleeping.isActive === 1) {
      return;
    }

    // 3. 判斷：若本service的isCanTouch為false，或是touchedTimes≥maxTouchTime，則跳出toastr，將isCanTouch重新賦值為false，並且不往下執行邏輯
    if (!this.isCanTouch || this.touchedTimes >= this.maxTouchTime) {
      ToastrService.show(`${currentPetStats.name || '電子雞'}暫時不想被摸摸喔！`, 'info');
      this.isCanTouch = false;
      return;
    }

    // 4. 將本service的isCanTouch賦值為false
    this.isCanTouch = false;

    // 5. 判斷若電子雞當前數值物件的當前好感度≤最大好感度-0.05，則將當前好感度+0.05後重新賦值
    if (currentPetStats.currentFriendship <= currentPetStats.maxFriendship - 0.05) {
      const newFriendship = Math.min(currentPetStats.currentFriendship + 0.05, currentPetStats.maxFriendship);
      const updatedStats = {
        ...currentPetStats,
        currentFriendship: newFriendship
      };
      PetStatsService.savePetStats(updatedStats);

      ToastrService.show(`與${currentPetStats.name || '電子雞'}更親近了，好感度上升！`, 'success');

      // 執行 getTouchingCoin 函數
      this.getTouchingCoin(currentPetStats);
    } else {
      ToastrService.show(`${currentPetStats.name || '電子雞'}對你的愛意達到了頂點`, 'info');

      // 檢查進化條件
      this.checkEvolutionConditions(currentPetStats);
    }

    // 6. touchedTimes +1 後重新賦值給 touchedTimes
    this.touchedTimes += 1;

    // 7. 兩秒後，本service的isCanTouch賦值為true
    setTimeout(() => {
      this.isCanTouch = true;
    }, 2000);
  }

  /**
   * 每30秒執行一次的私有函數：resetTouchTimes
   */
  private resetTouchTimes(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    // 1. 當電子雞當前數值物件的 rare 為 null 時，將 lastTimeReset 重置為 null，並且不往下執行邏輯
    if (currentPetStats.rare === null) {
      this.lastTimeReset = null;
      return;
    }

    // 2. 當電子雞當前數值物件的 timeStoping 為 true 時，若 touchedTimes 大於 0，則將 touchedTimes 賦值為 0
    if (currentPetStats.timeStopping === true) {
      if (this.touchedTimes > 0) {
        this.touchedTimes = 0;
      }
      return;
    }

    // 3. touchedTimes < maxTouchTime 時，不往下執行邏輯
    if (this.touchedTimes < this.maxTouchTime) {
      return;
    }

    // 4. 若 lastTimeReset 為 null，則將實際當前時間賦值給 lastTimeReset，並且不往下執行邏輯
    if (this.lastTimeReset === null) {
      this.lastTimeReset = this.getCurrentTimeString();
      return;
    }

    // 5. 取得實際當前時間，若當前時間距離 lastTimeReset 已經過1個小時，則將 touchedTimes 重新賦值為 0
    const currentTime = new Date();
    const resetTime = this.parseTimeString(this.lastTimeReset);
    const timeDiff = currentTime.getTime() - resetTime.getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1小時 = 3600000毫秒

    if (timeDiff >= oneHourInMs) {
      this.touchedTimes = 0;
      this.lastTimeReset = null;
    }
  }

  /**
   * 私有的函數：getTouchingCoin，用於執行判斷是否給予撫摸事件獎勵金幣
   */
  private getTouchingCoin(currentPetStats: PetStats): void {
    // 1. 寫一個布林值變數: shouldGetCoins，每次都只有 15% 機率可以賦值為 true，85% 機率賦值為 false
    const shouldGetCoins: boolean = Math.random() < 0.15;

    // 2. 寫一個 number 變數: getCoinsCount，初始值為 0
    let getCoinsCount: number = 0;

    // 3. 依照表格判斷各個符合狀況下該賦值多少給 getCoinsCount
    switch (currentPetStats.lifeCycle) {
      case 'CHILD':
        getCoinsCount = 10;
        break;
      case 'EVOLUTION':
        getCoinsCount = 15;
        break;
      default:
        getCoinsCount = 0;
        break;
    }

    // 4. 判斷若 shouldGetCoins 為 true，則將使用者資料的使用者持有金幣增加 getCoinsCount
    if (shouldGetCoins && getCoinsCount > 0) {
      const currentUserData = UserDataService.loadUserData();
      UserDataService.addCoins(getCoinsCount, currentUserData);
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
    // 解析 yyyy/mm/dd HH:mm:ss 格式
    const [datePart, timePart] = timeString.split(' ');
    const [year, month, day] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  /**
   * 停止重置計時器（用於服務銷毀時清理）
   */
  public stopResetTimer(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = undefined;
    }
  }

  /**
   * 檢查進化條件
   */
  private checkEvolutionConditions(currentPetStats: PetStats): void {
    // 檢查進化條件：好感度100，健康度100，並且飼養滿120小時
    if (currentPetStats.currentFriendship === 100 &&
        currentPetStats.currentWellness === 100 &&
        this.hasRaisedFor120Hours(currentPetStats)) {

      this.triggerSpecialTouchEvent(currentPetStats);
    }
  }

  /**
   * 檢查是否已飼養滿120小時
   */
  private hasRaisedFor120Hours(currentPetStats: PetStats): boolean {
    const currentUserData = UserDataService.loadUserData();
    const currentPetRecord = UserDataService.getCurrentPetRecord(currentUserData);

    if (!currentPetRecord || !currentPetRecord.birthTime) {
      return false;
    }

    const birthTime = this.parseTimeString(currentPetRecord.birthTime);
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - birthTime.getTime();
    const hoursRaised = timeDiff / (1000 * 60 * 60); // 轉換為小時

    return hoursRaised >= 120;
  }

  /**
   * 觸發特殊撫摸事件（進化相關）
   */
  private triggerSpecialTouchEvent(currentPetStats: PetStats): void {
    const random = Math.random() * 100;

    if (random < 40) {
      // 40% 機率額外觸發文字toastr
      ToastrService.show(`${currentPetStats.name || '電子雞'}蹭蹭你的手`, 'info');
    } else if (random < 90) {
      // 50% 機率額外觸發文字toastr
      ToastrService.show(`${currentPetStats.name || '電子雞'}充滿活力`, 'success');
    } else {
      // 10% 機率觸發進化
      this.triggerEvolution(currentPetStats);
    }
  }

  /**
   * 觸發進化事件
   */
  private triggerEvolution(currentPetStats: PetStats): void {
    const petName = currentPetStats.name || '電子雞';
    const confirmed = confirm(`${petName}發光了！`);

    if (confirmed) {
      this.executeEvolution(currentPetStats);
    }
  }

  /**
   * 執行進化過程
   */
  private executeEvolution(currentPetStats: PetStats): void {
    // 設置白光回調，在白光遮住畫面時執行進化
    this.whiteTransitionService.onWhiteReady(() => {
      this.performEvolutionChanges(currentPetStats);
    });

    // 觸發白光淡入
    this.whiteTransitionService.fadeIn();

    // 1秒後觸發白光淡出
    setTimeout(() => {
      this.whiteTransitionService.onSceneReady();
    }, 1000);
  }

  /**
   * 執行進化改變（在白光遮住畫面時）
   */
  private performEvolutionChanges(currentPetStats: PetStats): void {
    // 更新生命週期為進化狀態
    const updatedStats = {
      ...currentPetStats,
      lifeCycle: 'EVOLUTION' as const
    };
    PetStatsService.savePetStats(updatedStats);

    // 記錄進化時間到使用者飼養歷程
    const currentUserData = UserDataService.loadUserData();
    const currentTime = UserDataService.formatDateTime(new Date());

    const lastRecordIndex = currentUserData.petHistory.length - 1;
    if (lastRecordIndex >= 0) {
      UserDataService.updatePetRecord(lastRecordIndex, {
        evolutionTime: currentTime
      }, currentUserData);
    }

    // 解鎖圖鑑中的進化形態
    if (currentPetStats.breedName) {
      const currentCollectionData = CollectionService.loadCollectionData();
      CollectionService.unlockBreed(currentPetStats.breedName, 'EVOLUTION', currentCollectionData);
    }
  }

  /**
   * 重置所有撫摸狀態（用於調試或重置）
   */
  public resetTouchState(): void {
    this.touchedTimes = 0;
    this.isCanTouch = true;
    this.lastTimeReset = null;
  }
}