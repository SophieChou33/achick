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
import { LowHealthTriggerService } from '../../../services/low-health-trigger.service';
import { LeavingService } from '../../../services/leaving.service';
import { LowLikabilityEventService } from '../../../services/low-likability-event.service';
import { LightService } from '../../../services/light.service';
import { SleepService } from '../../../services/sleep.service';
import { PetStats } from '../../../types/pet-stats.type';
import { DirtyObject } from '../../../types/dirty-object.type';

@Component({
  selector: 'app-engineer-mode',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="engineer-modal" [class.show]="isVisible" (click)="onBackdropClick($event)">
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
                  <span>{{ petStats.currentFriendship }}</span>
                </div>
                <div class="info-item">
                  <label>當前健康度:</label>
                  <span>{{ petStats.currentWellness }}</span>
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
                  <input type="number" [(ngModel)]="editableStats.currentFriendship" min="0" max="100">
                </div>
                <div class="adjust-item">
                  <label>健康度:</label>
                  <input type="number" [(ngModel)]="editableStats.currentWellness" min="0" max="100">
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
                <button class="btn btn-secondary" (click)="triggerTimer('hunger')">飢餓管理器</button>
                <button class="btn btn-secondary" (click)="triggerTimer('health')">生命值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('lowHealth')">低生命值觸發器</button>
                <button class="btn btn-secondary" (click)="triggerTimer('leaving')">離家出走檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('lowLikability')">低好感度事件</button>
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
                    <button class="btn btn-secondary" (click)="clearAllDirty()">清除所有髒汙</button>
                    <p>當前髒汙數量: {{ dirtyObjects.length }}</p>
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

    .coin-control, .dirty-control, .pet-control {
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

  private subscriptions: Subscription[] = [];

  constructor(
    private coinsService: CoinsService,
    private customTimeService: CustomTimeService,
    private dirtyTriggerService: DirtyTriggerService,
    private hungerManagerService: HungerManagerService,
    private healthCheckService: HealthCheckService,
    private lowHealthTriggerService: LowHealthTriggerService,
    private leavingService: LeavingService,
    private lowLikabilityEventService: LowLikabilityEventService,
    private lightService: LightService,
    private sleepService: SleepService
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
  }

  onClose() {
    this.isVisible = false;
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  private loadData() {
    this.petStats = PetStatsService.loadPetStats();
    this.loadEditableStats();
    this.isCustomTimeEnabled = this.customTimeService.isCustomTimeEnabled();
    this.updateCustomTimeString();
    this.coinsToAdd = this.coinsService.getCoins();
  }

  private loadEditableStats() {
    this.editableStats = {
      currentHealth: this.petStats.currentHealth,
      maxHealth: this.petStats.maxHealth,
      currentFriendship: this.petStats.currentFriendship,
      currentWellness: this.petStats.currentWellness,
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

  triggerTimer(type: string) {
    console.log(`Triggering timer: ${type}`);

    switch (type) {
      case 'hunger':
        // 手動觸發飢餓檢查（通常是私有方法，需要通過公開方法觸發）
        (this.hungerManagerService as any).hungerDecrease?.();
        (this.hungerManagerService as any).hungerPenalty?.();
        break;
      case 'health':
        // 手動觸發生命值檢查（通常是私有方法，需要通過公開方法觸發）
        console.log('Triggering health check manually');
        break;
      case 'lowHealth':
        // 手動觸發低生命值檢查（通常是私有方法，需要通過公開方法觸發）
        console.log('Triggering low health check manually');
        break;
      case 'leaving':
        // 手動觸發離家出走檢查（通常是私有方法，需要通過公開方法觸發）
        console.log('Triggering leaving check manually');
        break;
      case 'lowLikability':
        // 手動觸發低好感度事件（通常是私有方法，需要通過公開方法觸發）
        console.log('Triggering low likability event manually');
        break;
      case 'dirty':
        // 手動觸發髒汙產生邏輯
        (this.dirtyTriggerService as any).addDirtyObject?.();
        break;
      case 'dirtyPunish':
        // 手動觸發髒汙懲罰邏輯
        (this.dirtyTriggerService as any).dirtyPunishing?.();
        break;
      case 'light':
        // 手動觸發燈光檢查（通常是私有方法，需要通過公開方法觸發）
        console.log('Triggering light check manually');
        break;
      case 'sleep':
        // 手動觸發睡眠檢查（通常是私有方法，需要通過公開方法觸發）
        console.log('Triggering sleep check manually');
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
    const currentTime = this.customTimeService.formatTime();
    const newDirty: DirtyObject = {
      dirtyNo: Math.floor(Math.random() * 5) + 1, // 1-5 隨機髒汙編號
      dirtyTime: currentTime
    };
    this.dirtyTriggerService.dirtyObjects.push(newDirty);
    this.dirtyObjects = this.dirtyTriggerService.dirtyObjects;
  }

  clearAllDirty() {
    this.dirtyTriggerService.dirtyObjects = [];
    this.dirtyObjects = [];
  }

  killPet() {
    const updatedStats = {
      ...this.petStats,
      isDead: true,
      currentHealth: 0
    };
    PetStatsService.savePetStats(updatedStats);
  }

  revivePet() {
    const updatedStats = {
      ...this.petStats,
      isDead: false,
      currentHealth: this.petStats.maxHealth
    };
    PetStatsService.savePetStats(updatedStats);
  }

  freezePet() {
    const updatedStats = {
      ...this.petStats,
      timeStopping: true
    };
    PetStatsService.savePetStats(updatedStats);
  }

  unfreezePet() {
    const updatedStats = {
      ...this.petStats,
      timeStopping: false
    };
    PetStatsService.savePetStats(updatedStats);
  }

  resetPet() {
    if (confirm('確定要重置電子雞嗎？這將清除所有數據！')) {
      PetStatsService.resetPetStats();
      this.customTimeService.forceResetToRealTime();
    }
  }
}