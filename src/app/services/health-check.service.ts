import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { LifecycleService } from './lifecycle.service';

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  private checkInterval?: number;

  constructor(private lifecycleService: LifecycleService) {
    // 不再自動啟動定時器，統一由 UnifiedStatsCheckerService 管理
    // this.startHealthCheck();
  }

  /**
   * 啟動生命值檢查計時器
   */
  private startHealthCheck(): void {
    // 每30秒執行一次生命值檢查
    this.checkInterval = window.setInterval(() => {
      this.checkLifeValue();
    }, 30000);
  }

  /**
   * 每30秒執行一次的私有函數：檢查當前電子雞生命值狀態
   */
  public async checkLifeValue(): Promise<void> {
    const currentPetStats = PetStatsService.loadPetStats();

    // 當電子雞當前數值物件的 rare 為 null 時，或是當電子雞當前數值物件的 timeStopping 為 true 時，不往下執行邏輯
    // 且只在 lifeCycle 為 CHILD 或 EVOLUTION 時執行
    if (currentPetStats.rare === null || currentPetStats.timeStopping === true ||
        (currentPetStats.lifeCycle !== 'CHILD' && currentPetStats.lifeCycle !== 'EVOLUTION')) {
      return;
    }

    // 判斷電子雞當前數值物件的當前生命值是否 ≤ 0
    if (currentPetStats.currentHealth <= 0) {
      // 若當前生命值 ≤ 0，則觸發 LifecycleService 的 doKill 函數，將電子雞標記為死亡
      // 並將電子雞當前數值物件的 timeStopping 賦值為 true
      await this.lifecycleService.doKill();

      // doKill 方法已經會設置 timeStopping: true，所以不需要額外設置
    }

    // 若當前生命值 > 0，則什麼也不做
  }

  /**
   * 停止生命值檢查計時器（用於服務銷毀時清理）
   */
  public stopHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * 手動觸發生命值檢查（用於調試或立即檢查）
   */
  public async manualCheck(): Promise<void> {
    await this.checkLifeValue();
  }
}