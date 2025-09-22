import { Injectable } from '@angular/core';
import { PetStatsService, defaultPetStats } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { StateDataService } from '../data/state-data';
import { DirtyTriggerService } from './dirty-trigger.service';
import { WhiteTransitionService } from './white-transition.service';
import { ToastrService } from '../components/shared/toastr/toastr.component';
import { ModalService } from './modal.service';
import { sources } from '../sources';

@Injectable({
  providedIn: 'root'
})
export class LifecycleService {

  constructor(
    private dirtyTriggerService: DirtyTriggerService,
    private whiteTransitionService: WhiteTransitionService,
    private modalService: ModalService
  ) {}

  /**
   * 設定電子雞死亡
   */
  public doKill(): void {
    const currentPetStats = PetStatsService.loadPetStats();
    const petName = currentPetStats.name || '電子雞';

    // 1. 將電子雞當前數值物件的 timeStopping 賦值為 true
    // 2. 將電子雞當前數值物件的 lifeCycle 賦值為 'DEAD'
    const updatedStats = {
      ...currentPetStats,
      timeStopping: true,
      lifeCycle: 'DEAD' as const
    };

    PetStatsService.savePetStats(updatedStats);

    // 4. 跳出 toastr
    ToastrService.show(`永別了${petName}，希望你去了更美好的世界，RIP🕊️`, 'error');

    // 角色DOM元素會自動切換為顯示 sources.character.dead.dead
    // 這個邏輯已經在 CharacterComponent 的 setCharacterImage 方法中實現
  }

  /**
   * 將當前的電子雞資料記錄到飼養紀錄中，並且將當前的電子雞資料清除
   */
  public clearCurrentChickenState(): void {
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
      isFreezing: false
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
    // 重新顯示歡迎頁
    this.showWelcomePage();
  }

  /**
   * 重新顯示歡迎頁
   */
  private showWelcomePage(): void {
    // 重置白光過渡服務
    this.whiteTransitionService.reset();

    // 觸發頁面重新載入或重新顯示歡迎頁
    // 由於我們已經重置了所有狀態，角色組件會自動顯示出生按鈕
    window.location.reload();
  }

  /**
   * 顯示死亡確認對話框
   */
  public async showDeathConfirmDialog(): Promise<boolean> {
    const currentPetStats = PetStatsService.loadPetStats();

    if (currentPetStats.lifeCycle === 'DEAD' || currentPetStats.lifeCycle === 'COOKED') {
      const firstConfirm = await this.modalService.confirm('是否開始飼養新的電子雞？');
      if (firstConfirm) {
        const secondConfirm = await this.modalService.confirm('是否開始飼養新的電子雞？', '確認重新開始');
        if (secondConfirm) {
          this.clearCurrentChickenState();
          return true;
        }
      }
      return false;
    }

    return false;
  }
}