import { Injectable } from '@angular/core';
import { PetStatsService, defaultPetStats } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { StateDataService } from '../data/state-data';
import { DirtyTriggerService } from './dirty-trigger.service';
import { WhiteTransitionService } from './white-transition.service';
import { ModalService } from './modal.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class LifecycleService {

  constructor(
    private dirtyTriggerService: DirtyTriggerService,
    private whiteTransitionService: WhiteTransitionService,
    private modalService: ModalService,
    private appStateService: AppStateService
  ) {}

  /**
   * 設定電子雞死亡
   */
  public async doKill(customDeathReason?: string): Promise<void> {
    const currentPetStats = PetStatsService.loadPetStats();
    const petName = currentPetStats.name || '電子雞';

    // 1. 將電子雞當前數值物件的 timeStopping 賦值為 true
    // 2. 將電子雞設定為死亡狀態
    const updatedStats = {
      ...currentPetStats,
      timeStopping: true,
      isDead: true
    };

    PetStatsService.savePetStats(updatedStats);

    // 3. 立即清除睡眠狀態（如果電子雞在睡眠中死亡）
    const currentStateData = StateDataService.loadStateData();
    if (currentStateData.isSleeping.isActive === 1) {
      StateDataService.deactivateState('isSleeping', currentStateData);
      console.log('電子雞死亡，已清除睡眠狀態');
    }

    // 4. 跳出確認彈窗 - 使用自定義死亡原因或預設原因
    const deathMessage = customDeathReason || `${petName}因疏於照顧而死亡...`;
    await this.modalService.info(`${deathMessage}\n\n永別了${petName}，希望你去了更美好的世界，RIP🕊️`, '寵物已死亡');

    // 角色DOM元素會自動切換為顯示 sources.character.dead.dead
    // 這個邏輯已經在 CharacterComponent 的 setCharacterImage 方法中實現
  }

  /**
   * 將當前的電子雞資料記錄到飼養紀錄中，並且將當前的電子雞資料清除
   */
  public clearCurrentChickenState(skipWelcomePage: boolean = false): void {
    const currentPetStats = PetStatsService.loadPetStats();
    const currentUserData = UserDataService.loadUserData();
    const currentStateData = StateDataService.loadStateData();

    // 1. 飼養歷程記錄
    // 將當前實際時間記錄到使用者資料飼養歷程陣列中最新一個物件的死亡時間屬性
    const currentTime = UserDataService.formatDateTime(new Date());
    const currentPetRecord = UserDataService.getCurrentPetRecord(currentUserData);

    if (currentPetRecord) {
      const updatedHistory = [...currentUserData.petHistory];
      const lastRecordIndex = updatedHistory.length - 1;

      if (lastRecordIndex >= 0) {
        updatedHistory[lastRecordIndex] = {
          ...updatedHistory[lastRecordIndex],
          deathTime: currentTime
        };

        const updatedUserData = {
          ...currentUserData,
          petHistory: updatedHistory
        };

        UserDataService.saveUserData(updatedUserData);
      }
    }

    // 2. 電子雞當前數值重置
    const resetStats = {
      ...defaultPetStats,
      rare: null,
      lifeCycle: null,
      breedName: null,
      name: null,
      currentHealth: 0,
      currentHunger: 0,
      maxHunger: 100,
      maxHealth: 0,
      hungerSpeed: 0,
      currentFriendship: 0,
      maxFriendship: 100,
      currentWellness: 0,
      maxWellness: 100,
      timeStopping: false,
      isLeaving: false,
      isFreezing: false,
      isDead: false,
      isCooked: false
    };

    PetStatsService.savePetStats(resetStats);

    // 3. 其他狀態重置
    // 將狀態資料物件中每個物件的 isActive 屬性都設定為 0
    const resetStateData = { ...currentStateData };
    Object.keys(resetStateData).forEach(key => {
      const stateValue = resetStateData[key as keyof typeof resetStateData];
      // 只有 StateDataType 有 isActive 屬性，位置資料沒有
      if ('isActive' in stateValue) {
        (stateValue as any).isActive = 0;
      }
    });
    StateDataService.saveStateData(resetStateData);

    // 將髒污觸發邏輯 service 的 dirtyObjects 陣列清空
    this.dirtyTriggerService.resetDirtyState();

    // 4. 執行完畢後的行為
    // 只有在不跳過歡迎頁時才顯示歡迎頁
    if (!skipWelcomePage) {
      this.showWelcomePage();
    }
  }

  /**
   * 重新顯示歡迎頁
   */
  private showWelcomePage(): void {
    // 重置白光過渡服務
    this.whiteTransitionService.reset();

    // 顯示歡迎頁面
    this.appStateService.showWelcomePage();
  }

  /**
   * 顯示死亡確認對話框
   */
  public async showDeathConfirmDialog(): Promise<boolean> {
    const currentPetStats = PetStatsService.loadPetStats();

    if (currentPetStats.isDead || currentPetStats.isCooked) {
      const confirm = await this.modalService.confirm('是否開始飼養新的電子雞？', '確認重新開始');
      if (confirm) {
        // 設置一次性回調來處理重置邏輯
        this.whiteTransitionService.setOneTimeCallback(() => {
          // 重置遊戲狀態但不立即顯示歡迎頁
          this.clearCurrentChickenState(true);

          // 顯示歡迎頁面
          this.showWelcomePage();

          // 通知場景準備完成，觸發 fadeOut
          this.whiteTransitionService.onSceneReady();
        });

        // 觸發白光過渡
        this.whiteTransitionService.fadeIn();

        return true;
      }
      return false;
    }

    return false;
  }
}
