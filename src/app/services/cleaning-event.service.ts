import { Injectable } from '@angular/core';
import { DirtyTriggerService } from './dirty-trigger.service';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { CoinsService } from './coins.service';
import { ToastrService } from '../components/shared/toastr/toastr.component';

@Injectable({
  providedIn: 'root'
})
export class CleaningEventService {

  constructor(
    private dirtyTriggerService: DirtyTriggerService,
    private coinsService: CoinsService
  ) {}

  /**
   * 判斷是否給予清潔事件獎勵金幣
   */
  private getCleaningCoin(): void {
    const shouldGetCoins: boolean = Math.random() < 0.2; // 20% 機率為 true
    let getCoinsCount: number = 0;

    const currentPetStats = PetStatsService.loadPetStats();

    if (currentPetStats.lifeCycle === 'CHILD') {
      getCoinsCount = 20;
    } else if (currentPetStats.lifeCycle === 'EVOLUTION') {
      getCoinsCount = 30;
    }

    if (shouldGetCoins && getCoinsCount > 0) {
      this.coinsService.addCoins(getCoinsCount, true, '清潔獎勵');
    }
  }

  /**
   * 處理點擊畫面上的髒污圖片時的事件
   */
  public cleanEvent(dirtyNo: number): void {
    const targetDirtyObject = this.dirtyTriggerService.dirtyObjects.find(
      dirty => dirty.dirtyNo === dirtyNo
    );

    if (!targetDirtyObject) {
      return;
    }

    this.getCleaningCoin();
    this.dirtyTriggerService.removeDirtyObject(dirtyNo);
  }

  /**
   * 清理指定的髒污物件
   */
  cleanDirtyObject(dirtyNo: number): void {
    const currentPetStats = PetStatsService.loadPetStats();

    if (currentPetStats.rare === null) {
      return;
    }

    const dirtyObjectExists = this.dirtyTriggerService.dirtyObjects.some(
      dirty => dirty.dirtyNo === dirtyNo
    );

    if (!dirtyObjectExists) {
      return;
    }

    this.dirtyTriggerService.removeDirtyObject(dirtyNo);

    const petName = currentPetStats.name || '電子雞';
    ToastrService.show(`${petName}的環境變乾淨了！髒污物件${dirtyNo}已清除`, 'success');

    const updatedStats = {
      ...currentPetStats,
      currentWellness: Math.min(currentPetStats.maxWellness, currentPetStats.currentWellness + 1),
      currentFriendship: Math.min(currentPetStats.maxFriendship, currentPetStats.currentFriendship + 0.5)
    };

    PetStatsService.savePetStats(updatedStats);
  }

  /**
   * 清理所有髒污物件
   */
  cleanAllDirtyObjects(): void {
    const currentPetStats = PetStatsService.loadPetStats();

    if (currentPetStats.rare === null || this.dirtyTriggerService.dirtyObjects.length === 0) {
      return;
    }

    const cleanedCount = this.dirtyTriggerService.dirtyObjects.length;
    this.dirtyTriggerService.resetDirtyState();

    const petName = currentPetStats.name || '電子雞';
    ToastrService.show(`${petName}的環境完全乾淨了！清除了${cleanedCount}個髒污物件`, 'success');

    const wellnessBonus = cleanedCount * 1;
    const friendshipBonus = cleanedCount * 0.5;

    const updatedStats = {
      ...currentPetStats,
      currentWellness: Math.min(currentPetStats.maxWellness, currentPetStats.currentWellness + wellnessBonus),
      currentFriendship: Math.min(currentPetStats.maxFriendship, currentPetStats.currentFriendship + friendshipBonus)
    };

    PetStatsService.savePetStats(updatedStats);
  }

  /**
   * 檢查是否有髒污物件需要清理
   */
  hasDirtyObjects(): boolean {
    return this.dirtyTriggerService.dirtyObjects.length > 0;
  }

  /**
   * 獲取當前髒污物件數量
   */
  getDirtyCount(): number {
    return this.dirtyTriggerService.getDirtyCount();
  }
}