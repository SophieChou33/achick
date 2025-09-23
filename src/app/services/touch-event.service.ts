import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { PetStatsService } from '../data/pet-stats-data';
import { PetStats } from '../types/pet-stats.type';
import { UserDataService } from '../data/user-data';
import { StateDataService } from '../data/state-data';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { ModalService } from './modal.service';
import { WhiteTransitionService } from './white-transition.service';
import { CollectionService } from '../data/collection-data';
import { CustomTimeService } from './custom-time.service';
import { sources } from '../sources';

@Injectable({
  providedIn: 'root'
})
export class TouchEventService {
  private maxTouchTime: number = 20;
  private isCanTouch: boolean = true;
  private lastTimeReset: string | null = null;
  private touchedTimes: number = 0;
  private resetInterval?: number;
  private readonly TOUCH_DATA_KEY = 'achick_touch_data';

  private static friendshipIncreaseSubject = new Subject<number>();

  constructor(
    private whiteTransitionService: WhiteTransitionService,
    private modalService: ModalService,
    private customTimeService: CustomTimeService
  ) {
    this.loadTouchData();
    this.startResetTimer();

    // 訂閱自定義時間變更，當時間跳躍時立即檢查重置條件
    this.customTimeService.getCustomTime$().subscribe(() => {
      // 延遲100ms確保時間已更新
      setTimeout(() => {
        this.resetTouchTimes();
      }, 100);
    });
  }

  /**
   * 載入撫摸資料
   */
  private loadTouchData(): void {
    try {
      const touchDataString = localStorage.getItem(this.TOUCH_DATA_KEY);
      if (touchDataString) {
        const touchData = JSON.parse(touchDataString);
        this.touchedTimes = touchData.touchedTimes || 0;
        this.lastTimeReset = touchData.lastTimeReset || null;
      }
    } catch (error) {
      console.error('載入撫摸資料時發生錯誤:', error);
      this.touchedTimes = 0;
      this.lastTimeReset = null;
    }
  }

  /**
   * 保存撫摸資料
   */
  private saveTouchData(): void {
    try {
      const touchData = {
        touchedTimes: this.touchedTimes,
        lastTimeReset: this.lastTimeReset
      };
      localStorage.setItem(this.TOUCH_DATA_KEY, JSON.stringify(touchData));
    } catch (error) {
      console.error('保存撫摸資料時發生錯誤:', error);
    }
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

    console.log('撫摸事件開始檢查:', {
      rare: currentPetStats.rare,
      timeStopping: currentPetStats.timeStopping,
      isSleeping: currentStateData.isSleeping.isActive,
      lifeCycle: currentPetStats.lifeCycle,
      isLeaving: currentPetStats.isLeaving,
      isCanTouch: this.isCanTouch,
      touchedTimes: this.touchedTimes
    });

    // 1. 若電子雞當前數值物件的 rare 為 null 時，或是當電子雞當前數值物件的 timeStoping 為 true 時，不往下執行邏輯
    if (currentPetStats.rare === null || currentPetStats.timeStopping === true) {
      console.log('撫摸事件被阻止: rare為null或時間停止');
      return;
    }

    // 2. 當狀態 isSleeping 等於 1 時，不往下執行邏輯
    if (currentStateData.isSleeping.isActive === 1) {
      console.log('撫摸事件被阻止: 電子雞正在睡覺');
      return;
    }

    // 3. 判斷：若touchedTimes≥maxTouchTime，則跳出toastr，將isCanTouch重新賦值為false，並且不往下執行邏輯
    console.log('撫摸事件檢查:', {
      touchedTimes: this.touchedTimes,
      maxTouchTime: this.maxTouchTime,
      lastTimeReset: this.lastTimeReset,
      currentTime: this.getCurrentTimeString()
    });

    if (this.touchedTimes >= this.maxTouchTime) {
      ToastrService.show(`${currentPetStats.name || '電子雞'}暫時不想被摸摸喔！`, 'info');
      this.isCanTouch = false;
      return;
    }

    // 4. 若本service的isCanTouch為false（2秒CD中），則不往下執行邏輯且不顯示toastr
    if (!this.isCanTouch) {
      console.log('撫摸事件被阻止: 冷卻時間中');
      return;
    }

    // 5. 將本service的isCanTouch賦值為false
    this.isCanTouch = false;

    console.log('撫摸事件執行中，當前好感度:', currentPetStats.currentFriendship);

    // 6. 判斷若電子雞當前數值物件的當前好感度≤最大好感度-0.05，則將當前好感度+0.05後重新賦值
    if (currentPetStats.currentFriendship <= currentPetStats.maxFriendship - 0.05) {
      const friendshipIncrease = 0.05;
      const newFriendship = Math.min(currentPetStats.currentFriendship + friendshipIncrease, currentPetStats.maxFriendship);
      const updatedStats = {
        ...currentPetStats,
        currentFriendship: newFriendship
      };
      PetStatsService.savePetStats(updatedStats);

      ToastrService.show(`與${currentPetStats.name || '電子雞'}更親近了，好感度上升！`, 'success');

      // 發送好感度增加事件
      TouchEventService.friendshipIncreaseSubject.next(friendshipIncrease);

      // 執行 getTouchingCoin 函數
      this.getTouchingCoin(currentPetStats);
    } else {
      // 好感度已達上限，顯示提示訊息
      ToastrService.show(`${currentPetStats.name || '電子雞'}的好感度已達上限！`, 'info');

      // 檢查進化條件 - 只在 CHILD 狀態下才檢查進化
      if (currentPetStats.lifeCycle === 'CHILD') {
        this.checkEvolutionConditions(currentPetStats);
      }
    }

    // 7. touchedTimes +1 後重新賦值給 touchedTimes
    this.touchedTimes += 1;
    this.saveTouchData();

    // 8. 兩秒後，本service的isCanTouch賦值為true
    setTimeout(() => {
      this.isCanTouch = true;
    }, 2000);
  }

  /**
   * 每30秒執行一次的私有函數：resetTouchTimes
   */
  private resetTouchTimes(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    console.log('resetTouchTimes 檢查開始:', {
      touchedTimes: this.touchedTimes,
      maxTouchTime: this.maxTouchTime,
      lastTimeReset: this.lastTimeReset,
      currentTime: this.getCurrentTimeString(),
      rare: currentPetStats.rare,
      timeStopping: currentPetStats.timeStopping
    });

    // 1. 當電子雞當前數值物件的 rare 為 null 時，將 lastTimeReset 重置為 null，並且不往下執行邏輯
    if (currentPetStats.rare === null) {
      console.log('resetTouchTimes: rare為null，重置lastTimeReset');
      this.lastTimeReset = null;
      return;
    }

    // 2. 當電子雞當前數值物件的 timeStoping 為 true 時，若 touchedTimes 大於 0，則將 touchedTimes 賦值為 0
    if (currentPetStats.timeStopping === true) {
      console.log('resetTouchTimes: 時間停止中');
      if (this.touchedTimes > 0) {
        console.log('resetTouchTimes: 重置touchedTimes為0 (時間停止)');
        this.touchedTimes = 0;
        this.saveTouchData();
      }
      return;
    }

    // 3. touchedTimes < maxTouchTime 時，不往下執行邏輯
    if (this.touchedTimes < this.maxTouchTime) {
      console.log('resetTouchTimes: touchedTimes < maxTouchTime，無需重置');
      return;
    }

    // 4. 若 lastTimeReset 為 null，則將實際當前時間賦值給 lastTimeReset，並且不往下執行邏輯
    if (this.lastTimeReset === null) {
      console.log('resetTouchTimes: 首次設定lastTimeReset');
      this.lastTimeReset = this.getCurrentTimeString();
      this.saveTouchData();
      return;
    }

    // 5. 取得實際當前時間，若當前時間距離 lastTimeReset 已經過1個小時，則將 touchedTimes 重新賦值為 0
    const currentTimeString = this.getCurrentTimeString();
    const currentTime = this.parseTimeString(currentTimeString);
    const resetTime = this.parseTimeString(this.lastTimeReset);
    const timeDiff = currentTime.getTime() - resetTime.getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1小時 = 3600000毫秒

    console.log('撫摸重置檢查:', {
      currentTime: currentTimeString,
      resetTime: this.lastTimeReset,
      timeDiffHours: timeDiff / (1000 * 60 * 60),
      touchedTimes: this.touchedTimes,
      shouldReset: timeDiff >= oneHourInMs
    });

    if (timeDiff >= oneHourInMs) {
      console.log('撫摸次數重置: 超過1小時，重置為0');
      this.touchedTimes = 0;
      this.lastTimeReset = currentTimeString; // 記錄重置時間作為下一輪的基準
      this.isCanTouch = true; // 重置時也要重置可觸摸狀態
      this.saveTouchData();
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
    // 檢查進化條件：必須是CHILD狀態、好感度>70、健康度>60、並且飼養滿120小時
    if (currentPetStats.lifeCycle === 'CHILD' &&
      currentPetStats.currentFriendship > 70 &&
      currentPetStats.currentWellness > 60 &&
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
    const currentTimeString = this.getCurrentTimeString();
    const currentTime = this.parseTimeString(currentTimeString);
    const timeDiff = currentTime.getTime() - birthTime.getTime();
    const hoursRaised = timeDiff / (1000 * 60 * 60); // 轉換為小時

    return hoursRaised >= 120;
  }

  /**
   * 觸發特殊撫摸事件（進化相關）
   */
  private triggerSpecialTouchEvent(currentPetStats: PetStats): void {
    const random = Math.random() * 100;

    if (random < 10) {
      // 40% 機率額外觸發文字toastr
      ToastrService.show(`${currentPetStats.name || '電子雞'}似乎出現了些變化...`, 'info');
    } else if (random < 88) {
      // 50% 機率額外觸發文字toastr
      ToastrService.show(`${currentPetStats.name || '電子雞'}看起來長大不少`, 'success');
    } else {
      // 10% 機率觸發進化
      this.triggerEvolution(currentPetStats);
    }
  }

  /**
   * 觸發進化事件
   */
  private async triggerEvolution(currentPetStats: PetStats): Promise<void> {
    const petName = currentPetStats.name || '電子雞';
    const confirmed = await this.modalService.confirm(`${petName}發光了！`, '進化確認', '進化', '取消');

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
    const currentTime = this.getCurrentTimeString();

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
    this.saveTouchData();
  }

  /**
   * 重置撫摸次數限制（工程師模式用）
   */
  public resetTouchLimit(): void {
    console.log('工程師模式重置撫摸限制: 重置前狀態', {
      touchedTimes: this.touchedTimes,
      isCanTouch: this.isCanTouch,
      lastTimeReset: this.lastTimeReset
    });

    this.touchedTimes = 0;
    this.isCanTouch = true;
    this.lastTimeReset = null; // 重置時間記錄，讓系統重新開始計時
    this.saveTouchData();

    console.log('工程師模式重置撫摸限制: 重置後狀態', {
      touchedTimes: this.touchedTimes,
      isCanTouch: this.isCanTouch,
      lastTimeReset: this.lastTimeReset
    });
  }

  /**
   * 手動觸發撫摸次數重置檢查（工程師模式用）
   */
  public manualTriggerTouchReset(): void {
    this.resetTouchTimes();
  }

  /**
   * 獲取好感度增加事件的Observable
   */
  public static getFriendshipIncrease$(): Observable<number> {
    return TouchEventService.friendshipIncreaseSubject.asObservable();
  }
}