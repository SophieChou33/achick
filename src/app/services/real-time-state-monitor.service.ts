import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PetStatsService } from '../data/pet-stats-data';
import { StateDataService } from '../data/state-data';
import { PetStats } from '../types/pet-stats.type';

@Injectable({
  providedIn: 'root'
})
export class RealTimeStateMonitorService implements OnDestroy {
  private petStatsSubscription?: Subscription;
  private lastCheckedStats: PetStats | null = null;

  constructor() {
    this.startMonitoring();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  /**
   * 啟動即時監控
   */
  private startMonitoring(): void {
    // 訂閱電子雞數值變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(currentStats => {
      // 只有當 rare 有值時才進行狀態檢查
      if (currentStats.rare === null) {
        return;
      }

      // 檢查關鍵數值是否有變化
      if (this.hasRelevantChanges(currentStats)) {
        this.updateStatesBasedOnStats(currentStats);
      }

      this.lastCheckedStats = { ...currentStats };
    });
  }

  /**
   * 停止監控
   */
  public stopMonitoring(): void {
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
      this.petStatsSubscription = undefined;
    }
  }

  /**
   * 檢查是否有相關數值變化
   */
  private hasRelevantChanges(currentStats: PetStats): boolean {
    if (!this.lastCheckedStats) {
      return true; // 第一次檢查，需要更新所有狀態
    }

    const last = this.lastCheckedStats;

    return (
      currentStats.currentHunger !== last.currentHunger ||
      currentStats.currentFriendship !== last.currentFriendship ||
      currentStats.currentWellness !== last.currentWellness ||
      currentStats.isLeaving !== last.isLeaving ||
      currentStats.isFreezing !== last.isFreezing ||
      currentStats.isDead !== last.isDead ||
      currentStats.timeStopping !== last.timeStopping ||
      currentStats.lifeCycle !== last.lifeCycle
    );
  }

  /**
   * 根據數值變化更新狀態
   */
  private updateStatesBasedOnStats(petStats: PetStats): void {
    const currentStateData = StateDataService.loadStateData();

    // 1. 飢餓狀態 (currentHunger <= 35)
    this.updateHungryState(petStats, currentStateData);

    // 2. 低好感度狀態 (currentFriendship <= 30)
    this.updateLowLikabilityState(petStats, currentStateData);

    // 3. 虛弱狀態 (currentWellness < 40)
    this.updateWeakState(petStats, currentStateData);

    // 4. 離家出走狀態處理
    this.updateLeavingRelatedStates(petStats, currentStateData);

    // 5. 冷凍狀態處理
    this.updateFreezingRelatedStates(petStats, currentStateData);
  }

  /**
   * 更新飢餓狀態
   */
  private updateHungryState(petStats: PetStats, stateData: any): void {
    const shouldBeHungry = petStats.currentHunger <= 35 &&
                          !petStats.timeStopping &&
                          (petStats.lifeCycle === 'CHILD' || petStats.lifeCycle === 'EVOLUTION');

    if (shouldBeHungry && stateData.hungry.isActive === 0) {
      StateDataService.activateState('hungry', stateData);
    } else if (!shouldBeHungry && stateData.hungry.isActive === 1) {
      StateDataService.deactivateState('hungry', stateData);
    }
  }

  /**
   * 更新低好感度狀態
   */
  private updateLowLikabilityState(petStats: PetStats, stateData: any): void {
    const shouldBeLowLikability = petStats.currentFriendship <= 30 &&
                                 !petStats.timeStopping &&
                                 (petStats.lifeCycle === 'CHILD' || petStats.lifeCycle === 'EVOLUTION');

    if (shouldBeLowLikability && stateData.lowLikability.isActive === 0) {
      StateDataService.activateState('lowLikability', stateData);
    } else if (!shouldBeLowLikability && stateData.lowLikability.isActive === 1) {
      StateDataService.deactivateState('lowLikability', stateData);
    }
  }

  /**
   * 更新虛弱狀態
   */
  private updateWeakState(petStats: PetStats, stateData: any): void {
    const shouldBeWeak = petStats.currentWellness < 40 &&
                        !petStats.timeStopping &&
                        (petStats.lifeCycle === 'CHILD' || petStats.lifeCycle === 'EVOLUTION');

    if (shouldBeWeak && stateData.weak.isActive === 0) {
      StateDataService.activateState('weak', stateData);
    } else if (!shouldBeWeak && stateData.weak.isActive === 1) {
      StateDataService.deactivateState('weak', stateData);
    }
  }

  /**
   * 處理離家出走相關狀態
   */
  private updateLeavingRelatedStates(petStats: PetStats, stateData: any): void {
    // 當離家出走時，可能需要特殊的狀態處理
    // 這裡可以根據需求添加相關邏輯
  }

  /**
   * 處理冷凍狀態相關
   */
  private updateFreezingRelatedStates(petStats: PetStats, stateData: any): void {
    // 當冷凍時，可能需要特殊的狀態處理
    // 這裡可以根據需求添加相關邏輯
  }

  /**
   * 手動觸發狀態檢查（用於調試或強制更新）
   */
  public forceStateUpdate(): void {
    const currentStats = PetStatsService.loadPetStats();
    if (currentStats.rare !== null) {
      this.updateStatesBasedOnStats(currentStats);
      this.lastCheckedStats = { ...currentStats };
    }
  }
}