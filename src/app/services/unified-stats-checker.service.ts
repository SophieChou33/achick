import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { HungerManagerService } from './hunger-manager.service';
import { DirtyTriggerService } from './dirty-trigger.service';
import { LowLikabilityEventService } from './low-likability-event.service';
import { WellnessCheckService } from './wellness-check.service';
import { HealthCheckService } from './health-check.service';

@Injectable({
  providedIn: 'root'
})
export class UnifiedStatsCheckerService {
  private checkInterval?: number;
  private isRunning = false;

  constructor(
    private hungerManagerService: HungerManagerService,
    private dirtyTriggerService: DirtyTriggerService,
    private lowLikabilityEventService: LowLikabilityEventService,
    private wellnessCheckService: WellnessCheckService,
    private healthCheckService: HealthCheckService
  ) {}

  /**
   * 啟動統一的數值檢查系統
   */
  public startUnifiedCheck(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // 每30秒執行一次統一檢查
    this.checkInterval = window.setInterval(() => {
      this.executeAllChecks();
    }, 30000);
  }

  /**
   * 停止統一的數值檢查系統
   */
  public stopUnifiedCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.isRunning = false;
  }

  /**
   * 手動執行一次完整的數值檢查（用於場景載入和孵化時）
   */
  public async executeAllChecks(): Promise<void> {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，不執行任何檢查
    if (currentPetStats.rare === null) {
      return;
    }

    try {
      // 1. 執行低飽足感相關檢查
      this.hungerManagerService.decreaseHunger();
      this.hungerManagerService.checkHungerState();

      // 2. 執行髒污相關檢查
      this.dirtyTriggerService.addDirtyObject();
      this.dirtyTriggerService.dirtyPunishing();

      // 3. 執行低好感度檢查與懲罰
      this.lowLikabilityEventService.likabilityPunishing();

      // 4. 執行健康度相關檢查
      await this.wellnessCheckService.healthCheck();
      this.wellnessCheckService.diseaseEffects();

      // 5. 執行低生命值檢查與懲罰
      await this.healthCheckService.checkLifeValue();

    } catch (error) {
      console.error('Error executing unified stats check:', error);
    }
  }

  /**
   * 檢查服務是否正在運行
   */
  public isCheckRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 重置所有服務的定時器（當離家出走回來時使用）
   */
  public resetAllTimers(): void {
    // 這個功能已經在 LeavingService 中實現，這裡提供統一接口
    console.log('Timer reset should be handled by LeavingService.resetAllTimersOnReturn()');
  }
}