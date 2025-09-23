import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PetStatsService } from '../../../data/pet-stats-data';
import { UserDataService } from '../../../data/user-data';
import { CoinsService } from '../../../services/coins.service';
import { CustomTimeService } from '../../../services/custom-time.service';
import { DirtyTriggerService } from '../../../services/dirty-trigger.service';
import { HungerManagerService } from '../../../services/hunger-manager.service';
import { HealthCheckService } from '../../../services/health-check.service';
import { WellnessCheckService } from '../../../services/wellness-check.service';
import { LeavingService } from '../../../services/leaving.service';
import { LowLikabilityEventService } from '../../../services/low-likability-event.service';
import { LightService } from '../../../services/light.service';
import { SleepService } from '../../../services/sleep.service';
import { TouchEventService } from '../../../services/touch-event.service';
import { LastCheckTimeManagerService } from '../../../services/last-check-time-manager.service';
import { ModalService } from '../../../services/modal.service';
import { PetStats } from '../../../types/pet-stats.type';
import { DirtyObject } from '../../../types/dirty-object.type';

@Component({
  selector: 'app-engineer-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="engineer-modal" [class.show]="isVisible">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">🔧 工程師模式</h3>
            <button type="button" class="close-btn" (click)="onClose()">×</button>
          </div>

          <div class="modal-body">
            <div class="tabs">
              <button
                *ngFor="let tab of tabs"
                class="tab-btn"
                [class.active]="activeTab === tab.id"
                (click)="activeTab = tab.id">
                {{ tab.label }}
              </button>
            </div>

            <!-- 電子雞資訊 -->
            <div class="tab-content" *ngIf="activeTab === 'info'">
              <h4>電子雞數值查看</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>當前生命值:</label>
                  <span>{{ petStats.currentHealth }}</span>
                </div>
                <div class="info-item">
                  <label>最大生命值:</label>
                  <span>{{ petStats.maxHealth }}</span>
                </div>
                <div class="info-item">
                  <label>當前好感度:</label>
                  <span>{{ petStats.currentFriendship.toFixed(2) }}</span>
                </div>
                <div class="info-item">
                  <label>當前健康度:</label>
                  <span>{{ petStats.currentWellness }}</span>
                </div>
                <div class="info-item">
                  <label>當前飽足感:</label>
                  <span>{{ petStats.currentHunger }}</span>
                </div>
                <div class="info-item">
                  <label>飢餓速度:</label>
                  <span>{{ petStats.hungerSpeed }}</span>
                </div>
                <div class="info-item">
                  <label>電子雞品種:</label>
                  <span>{{ petStats.breedName || '未設定' }}</span>
                </div>
                <div class="info-item">
                  <label>電子雞稀有度:</label>
                  <span>{{ petStats.rare || '未設定' }}</span>
                </div>
                <div class="info-item">
                  <label>是否離家出走:</label>
                  <span>{{ petStats.isLeaving ? '是' : '否' }}</span>
                </div>
                <div class="info-item">
                  <label>生命週期:</label>
                  <span>{{ petStats.lifeCycle || '未設定' }}</span>
                </div>
              </div>
            </div>

            <!-- 數值調整 -->
            <div class="tab-content" *ngIf="activeTab === 'adjust'">
              <h4>電子雞數值調整</h4>
              <div class="adjust-grid">
                <div class="adjust-item">
                  <label>生命值:</label>
                  <input type="number" [(ngModel)]="editableStats.currentHealth" min="0" [max]="editableStats.maxHealth || 100">
                </div>
                <div class="adjust-item">
                  <label>最大生命值:</label>
                  <input type="number" [(ngModel)]="editableStats.maxHealth" min="1">
                </div>
                <div class="adjust-item">
                  <label>好感度:</label>
                  <input type="number" [(ngModel)]="editableStats.currentFriendship" min="0" max="100" step="0.01">
                </div>
                <div class="adjust-item">
                  <label>健康度:</label>
                  <input type="number" [(ngModel)]="editableStats.currentWellness" min="0" max="100">
                </div>
                <div class="adjust-item">
                  <label>飽足感:</label>
                  <input type="number" [(ngModel)]="editableStats.currentHunger" min="0" max="100">
                </div>
                <div class="adjust-item">
                  <label>飢餓速度:</label>
                  <input type="number" [(ngModel)]="editableStats.hungerSpeed" min="0" step="0.1">
                </div>
              </div>
              <button class="btn btn-primary" (click)="applyStatsChanges()">套用變更</button>
            </div>

            <!-- 定時檢查器 -->
            <div class="tab-content" *ngIf="activeTab === 'timers'">
              <h4>手動觸發定時檢查器</h4>
              <div class="timer-grid">
                <button class="btn btn-secondary" (click)="triggerTimer('hungerDecrease')">飽足感減少檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('hungerPenalty')">飽足感懲罰扣值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('health')">生命值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('wellness')">健康度檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('leaving')">離家出走檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('lowLikability')">低好感度扣值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('dirty')">髒汙產生</button>
                <button class="btn btn-secondary" (click)="triggerTimer('dirtyPunish')">髒汙懲罰</button>
                <button class="btn btn-secondary" (click)="triggerTimer('light')">燈光檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('sleep')">睡眠檢查</button>
              </div>
            </div>

            <!-- 時間設定 -->
            <div class="tab-content" *ngIf="activeTab === 'time'">
              <h4>自定義時間設定</h4>
              <div class="time-settings">
                <div class="toggle-group">
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="isCustomTimeEnabled" (change)="toggleCustomTime()">
                    <span class="slider"></span>
                  </label>
                  <span>啟用自定義時間</span>
                </div>

                <div class="time-inputs" *ngIf="isCustomTimeEnabled">
                  <div class="input-group">
                    <label>自定義時間:</label>
                    <input type="datetime-local" [(ngModel)]="customTimeString" (change)="updateCustomTime()">
                  </div>
                  <button class="btn btn-secondary" (click)="resetToRealTime()">重置為實際時間</button>
                </div>

                <div class="current-time">
                  <p>當前時間: {{ getCurrentTimeDisplay() }}</p>
                  <p>實際時間: {{ getRealTimeDisplay() }}</p>
                </div>
              </div>
            </div>

            <!-- 遊戲控制 -->
            <div class="tab-content" *ngIf="activeTab === 'control'">
              <h4>遊戲控制</h4>
              <div class="control-grid">
                <div class="control-section">
                  <h5>金幣控制</h5>
                  <div class="coin-control">
                    <input type="number" [(ngModel)]="coinsToAdd" min="0" placeholder="金幣數量">
                    <button class="btn btn-secondary" (click)="adjustCoins()">設定金幣</button>
                  </div>
                </div>

                <div class="control-section">
                  <h5>髒汙控制</h5>
                  <div class="dirty-control">
                    <button class="btn btn-secondary" (click)="addDirtyObject()">產生髒汙</button>
                    <button class="btn btn-info" (click)="forceDirtyGeneration()">強制產生髒汙（跳過時間限制）</button>
                    <button class="btn btn-secondary" (click)="clearAllDirty()">清除所有髒汙</button>
                    <p>當前髒汙數量: {{ dirtyObjects.length }}</p>
                  </div>
                </div>

                <div class="control-section">
                  <h5>次數限制重置</h5>
                  <div class="limit-control">
                    <button class="btn btn-secondary" (click)="resetAllLimits()">重置所有次數限制</button>
                    <button class="btn btn-secondary" (click)="resetTouchLimit()">重置撫摸次數</button>
                    <button class="btn btn-secondary" (click)="resetClickLimit()">重置窗戶點擊次數</button>
                  </div>
                </div>

                <div class="control-section">
                  <h5>上次檢查時間管理</h5>
                  <div class="time-control">
                    <button class="btn btn-info" (click)="presetAllLastCheckTimes()">手動預設上次檢查時間</button>
                    <button class="btn btn-warning" (click)="resetAllLastPunishmentTimes()">手動預設上次懲罰時間</button>
                    <button class="btn btn-secondary" (click)="showLastCheckTimesStatus()">顯示上次檢查時間狀態</button>
                  </div>
                </div>

                <div class="control-section">
                  <h5>電子雞狀態控制</h5>
                  <div class="pet-control">
                    <button class="btn btn-warning" (click)="killPet()">使電子雞死亡</button>
                    <button class="btn btn-success" (click)="revivePet()">復活電子雞</button>
                    <button class="btn btn-info" (click)="freezePet()">冷凍電子雞</button>
                    <button class="btn btn-info" (click)="unfreezePet()">解凍電子雞</button>
                    <button class="btn btn-danger" (click)="resetPet()">重置電子雞</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 檢查時間狀態彈窗 -->
    <div class="status-modal" [class.show]="showStatusModal" (click)="closeStatusModal()">
      <div class="status-dialog" (click)="$event.stopPropagation()">
        <div class="status-header">
          <h4>上次檢查時間狀態</h4>
          <button type="button" class="close-btn" (click)="closeStatusModal()">×</button>
        </div>
        <div class="status-body">
          <div class="status-item" *ngFor="let item of statusItems">
            <div class="status-label">{{ item.label }}:</div>
            <div class="status-value">{{ item.value || 'null' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .engineer-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .engineer-modal.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-dialog {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .engineer-modal.show .modal-dialog {
      transform: scale(1);
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #666;
    }

    .modal-body {
      padding: 0;
      max-height: calc(90vh - 120px);
      overflow-y: auto;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
    }

    .tab-btn {
      padding: 12px 20px;
      border: none;
      background: none;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .tab-btn.active {
      border-bottom-color: #007bff;
      background: white;
      font-weight: 600;
    }

    .tab-btn:hover {
      background: #e9ecef;
    }

    .tab-content {
      padding: 20px;
    }

    .info-grid, .adjust-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-item, .adjust-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .info-item label, .adjust-item label {
      font-weight: 600;
      color: #555;
    }

    .adjust-item input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .timer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover {
      background: #1e7e34;
    }

    .btn-warning {
      background: #ffc107;
      color: #212529;
    }

    .btn-warning:hover {
      background: #e0a800;
    }

    .btn-info {
      background: #17a2b8;
      color: white;
    }

    .btn-info:hover {
      background: #117a8b;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    .time-settings {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .toggle-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #2196F3;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .time-inputs {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .input-group input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .current-time {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .current-time p {
      margin: 5px 0;
      font-family: monospace;
    }

    .control-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .control-section {
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 6px;
    }

    .control-section h5 {
      margin: 0 0 15px 0;
      color: #495057;
    }

    .coin-control, .dirty-control, .pet-control, .limit-control, .time-control {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .coin-control input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 120px;
    }

    /* 狀態彈窗樣式 */
    .status-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .status-modal.show {
      opacity: 1;
      visibility: visible;
    }

    .status-dialog {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .status-modal.show .status-dialog {
      transform: scale(1);
    }

    .status-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    }

    .status-header h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .status-body {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .status-item:last-child {
      border-bottom: none;
    }

    .status-label {
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .status-value {
      font-family: monospace;
      color: #666;
      background: #f8f9fa;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }
  `]
})
export class EngineerModeComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  isVisible = false;
  activeTab = 'info';

  tabs = [
    { id: 'info', label: '資訊查看' },
    { id: 'adjust', label: '數值調整' },
    { id: 'timers', label: '定時檢查器' },
    { id: 'time', label: '時間設定' },
    { id: 'control', label: '遊戲控制' }
  ];

  petStats: PetStats = PetStatsService.loadPetStats();
  editableStats: Partial<PetStats> = {};

  isCustomTimeEnabled = false;
  customTimeString = '';
  coinsToAdd = 0;
  dirtyObjects: DirtyObject[] = [];

  showStatusModal = false;
  statusItems: Array<{ label: string; value: string | null }> = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private coinsService: CoinsService,
    private customTimeService: CustomTimeService,
    private dirtyTriggerService: DirtyTriggerService,
    private hungerManagerService: HungerManagerService,
    private healthCheckService: HealthCheckService,
    private wellnessCheckService: WellnessCheckService,
    private leavingService: LeavingService,
    private lowLikabilityEventService: LowLikabilityEventService,
    private lightService: LightService,
    private sleepService: SleepService,
    private touchEventService: TouchEventService,
    private lastCheckTimeManagerService: LastCheckTimeManagerService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.loadData();

    // 訂閱電子雞數值變化
    this.subscriptions.push(
      PetStatsService.getPetStats$().subscribe(stats => {
        this.petStats = stats;
        this.loadEditableStats();
      })
    );

    // 訂閱自定義時間狀態
    this.subscriptions.push(
      this.customTimeService.getCustomTimeEnabled$().subscribe(enabled => {
        this.isCustomTimeEnabled = enabled;
      })
    );

    // 訂閱髒汙物件變化
    this.dirtyObjects = this.dirtyTriggerService.dirtyObjects;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  show() {
    this.isVisible = true;
    this.loadData();
    this.updateDirtyDisplay();
  }

  onClose() {
    this.isVisible = false;
    this.close.emit();
  }


  private loadData() {
    this.petStats = PetStatsService.loadPetStats();
    this.loadEditableStats();
    this.isCustomTimeEnabled = this.customTimeService.isCustomTimeEnabled();
    this.updateCustomTimeString();
    this.coinsToAdd = this.coinsService.getCoins();
    this.updateDirtyDisplay();
  }

  private updateDirtyDisplay() {
    this.dirtyObjects = [...this.dirtyTriggerService.dirtyObjects];
  }

  private loadEditableStats() {
    this.editableStats = {
      currentHealth: this.petStats.currentHealth,
      maxHealth: this.petStats.maxHealth,
      currentFriendship: parseFloat(this.petStats.currentFriendship.toFixed(2)),
      currentWellness: this.petStats.currentWellness,
      currentHunger: this.petStats.currentHunger,
      hungerSpeed: this.petStats.hungerSpeed
    };
  }

  private updateCustomTimeString() {
    const time = this.customTimeService.getCurrentTime();
    // 轉換為本地時間字串格式 (datetime-local input format)
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    this.customTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  applyStatsChanges() {
    const updatedStats = {
      ...this.petStats,
      ...this.editableStats
    };
    PetStatsService.savePetStats(updatedStats);
  }

  async triggerTimer(type: string): Promise<void> {
    console.log(`Triggering timer: ${type}`);

    switch (type) {
      case 'hungerDecrease':
        // 手動觸發飽足感減少檢查
        this.hungerManagerService.manualTriggerHungerDecrease();
        break;
      case 'hungerPenalty':
        // 手動觸發飽足感懲罰扣值檢查
        this.hungerManagerService.manualTriggerHungerPenalty();
        break;
      case 'health':
        // 手動觸發生命值檢查
        await this.healthCheckService.manualCheck();
        break;
      case 'wellness':
        // 手動觸發健康度檢查
        this.wellnessCheckService.manualHealthCheck();
        this.wellnessCheckService.manualDiseaseEffects();
        break;
      case 'leaving':
        // 手動觸發離家出走檢查
        this.lowLikabilityEventService.manualTriggerLeavingCheck();
        break;
      case 'lowLikability':
        // 手動觸發低好感度事件（健康度扣除）
        this.lowLikabilityEventService.manualTriggerLikabilityCheck();
        break;
      case 'dirty':
        // 手動觸發髒汙產生邏輯
        (this.dirtyTriggerService as any).addDirtyObject?.();
        // 更新顯示
        this.updateDirtyDisplay();
        break;
      case 'dirtyPunish':
        // 手動觸發髒汙懲罰邏輯
        (this.dirtyTriggerService as any).dirtyPunishing?.();
        break;
      case 'light':
        // 手動觸發燈光檢查
        this.lightService.manualLightCheck();
        this.lightService.manualDayNightCheck();
        break;
      case 'sleep':
        // 手動觸發睡眠檢查
        this.sleepService.manualSleepCheck();
        break;
      default:
        console.warn(`Unknown timer type: ${type}`);
    }
  }

  toggleCustomTime() {
    this.customTimeService.setCustomTimeEnabled(this.isCustomTimeEnabled);
    if (this.isCustomTimeEnabled) {
      this.updateCustomTimeString();
    }
  }

  updateCustomTime() {
    if (this.customTimeString) {
      const customTime = new Date(this.customTimeString);
      this.customTimeService.setCustomTime(customTime);
    }
  }

  resetToRealTime() {
    this.customTimeService.resetToRealTime();
    this.updateCustomTimeString();
  }

  getCurrentTimeDisplay(): string {
    return this.customTimeService.formatTime();
  }

  getRealTimeDisplay(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  adjustCoins() {
    if (this.coinsToAdd >= 0) {
      this.coinsService.setCoins(this.coinsToAdd);
    }
  }

  addDirtyObject() {
    // 檢查是否已達到最大髒污數量限制
    if (this.dirtyTriggerService.dirtyObjects.length >= 3) {
      console.log('已達到最大髒污數量限制(3個)');
      return;
    }

    // 使用DirtyTriggerService的私有方法邏輯來獲取正確的dirtyNo
    const getNextDirtyNo = (): number => {
      const maxDirtyCounts = 3;
      const allDirtyNoArray: number[] = [];
      for (let i = 1; i <= maxDirtyCounts; i++) {
        allDirtyNoArray.push(i);
      }

      for (const num of allDirtyNoArray) {
        const isUsed = this.dirtyTriggerService.dirtyObjects.some(dirty => dirty.dirtyNo === num);
        if (!isUsed) {
          return num;
        }
      }
      return 1; // 備用值
    };

    const currentTime = this.customTimeService.formatTime();
    const newDirty: DirtyObject = {
      dirtyNo: getNextDirtyNo(),
      dirtyTime: currentTime,
      lastPunishTime: currentTime
    };

    this.dirtyTriggerService.dirtyObjects.push(newDirty);

    // 觸發儲存髒污資料
    this.dirtyTriggerService.saveDirtyData();

    // 更新顯示
    this.updateDirtyDisplay();
    console.log(`新增髒污 ${newDirty.dirtyNo}，目前總數: ${this.dirtyObjects.length}`);
  }

  clearAllDirty() {
    // 使用服務的公開方法清除所有髒污並設定時間
    this.dirtyTriggerService.clearAllDirtyObjects();

    // 更新顯示
    this.updateDirtyDisplay();
  }

  forceDirtyGeneration() {
    const currentPetStats = PetStatsService.loadPetStats();

    // 檢查基本條件
    if (currentPetStats.rare === null) {
      console.log('無法產生髒污：電子雞稀有度為 null');
      return;
    }

    if (currentPetStats.timeStopping === true) {
      console.log('無法產生髒污：電子雞時間已停止');
      return;
    }

    if (this.dirtyTriggerService.dirtyObjects.length >= 3) {
      console.log('無法產生髒污：已達到最大髒污數量限制(3個)');
      return;
    }

    // 強制產生髒污，跳過時間限制
    const getNextDirtyNo = (): number => {
      const maxDirtyCounts = 3;
      const allDirtyNoArray: number[] = [];
      for (let i = 1; i <= maxDirtyCounts; i++) {
        allDirtyNoArray.push(i);
      }

      for (const num of allDirtyNoArray) {
        const isUsed = this.dirtyTriggerService.dirtyObjects.some(dirty => dirty.dirtyNo === num);
        if (!isUsed) {
          return num;
        }
      }
      return 1;
    };

    const currentTime = this.customTimeService.formatTime();
    const newDirty: DirtyObject = {
      dirtyNo: getNextDirtyNo(),
      dirtyTime: currentTime,
      lastPunishTime: currentTime
    };

    this.dirtyTriggerService.dirtyObjects.push(newDirty);

    // 設定 lastAddDirtyTime 為當前時間
    (this.dirtyTriggerService as any).lastAddDirtyTime = currentTime;

    // 觸發儲存髒污資料
    this.dirtyTriggerService.saveDirtyData();

    // 更新顯示
    this.updateDirtyDisplay();
    console.log(`強制產生髒污 ${newDirty.dirtyNo}，目前總數: ${this.dirtyObjects.length}`);
  }

  killPet() {
    const updatedStats = {
      ...this.petStats,
      lifeCycle: 'DEAD' as const,
      currentHealth: 0
    };
    PetStatsService.savePetStats(updatedStats);
  }

  revivePet() {
    const updatedStats = {
      ...this.petStats,
      lifeCycle: 'CHILD' as const,
      currentHealth: this.petStats.maxHealth,
      timeStopping: false // 復活後重置時間停止狀態
    };
    PetStatsService.savePetStats(updatedStats);
  }

  freezePet() {
    const updatedStats = {
      ...this.petStats,
      timeStopping: true,
      isFreezing: true
    };
    PetStatsService.savePetStats(updatedStats);
  }

  unfreezePet() {
    const updatedStats = {
      ...this.petStats,
      timeStopping: false,
      isFreezing: false
    };
    PetStatsService.savePetStats(updatedStats);
  }

  async resetPet() {
    if (await this.modalService.confirm('確定要重置電子雞嗎？這將清除所有數據！', '重置確認', '確定重置', '取消')) {
      PetStatsService.resetPetStats();
      this.customTimeService.forceResetToRealTime();
      // 重置所有上次檢查時間為 null
      this.lastCheckTimeManagerService.resetAllLastCheckTimesToNull();
      // 清除所有髒污物件
      this.dirtyTriggerService.clearAllDirtyObjects();
      // 更新顯示
      this.updateDirtyDisplay();
      console.log('電子雞已完全重置，包括所有上次執行時間');
    }
  }

  /**
   * 重置所有次數限制
   */
  resetAllLimits() {
    this.resetTouchLimit();
    this.resetClickLimit();
    console.log('已重置所有次數限制');
  }

  /**
   * 重置撫摸次數限制
   */
  resetTouchLimit() {
    this.touchEventService.resetTouchLimit();
    console.log('已重置撫摸次數限制');
  }

  /**
   * 重置點擊次數限制
   */
  resetClickLimit() {
    this.leavingService.resetClickLimit();
    console.log('已重置點擊次數限制');
  }

  /**
   * 手動預設上次檢查時間
   */
  presetAllLastCheckTimes() {
    this.lastCheckTimeManagerService.presetAllLastCheckTimes();
    console.log('已手動預設所有服務的上次檢查時間');
  }

  /**
   * 手動重置上次懲罰時間
   */
  resetAllLastPunishmentTimes() {
    this.lastCheckTimeManagerService.resetAllLastPunishmentTimes();
    console.log('已手動重置所有上次懲罰時間');
  }

  /**
   * 顯示上次檢查時間狀態
   */
  showLastCheckTimesStatus() {
    const status = this.lastCheckTimeManagerService.getAllLastCheckTimesStatus();

    // 轉換為陣列格式供模板使用
    this.statusItems = Object.keys(status).map(key => ({
      label: status[key].label,
      value: status[key].value
    }));

    // 顯示彈窗
    this.showStatusModal = true;

    // 同時在console中顯示，方便開發除錯
    console.log('所有服務的上次檢查時間狀態：', status);
  }

  /**
   * 關閉狀態彈窗
   */
  closeStatusModal() {
    this.showStatusModal = false;
    this.statusItems = [];
  }

}
