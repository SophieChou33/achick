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
import { breedData, getBreedByName } from '../../../data/breed-data';
import { Breed } from '../../../types/breed.type';

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
                <div class="info-item">
                  <label>是否冷凍狀態:</label>
                  <span>{{ petStats.isFreezing ? '是' : '否' }}</span>
                </div>
                <div class="info-item">
                  <label>是否熟成:</label>
                  <span>{{ petStats.isCooked ? '是' : '否' }}</span>
                </div>
                <div class="info-item">
                  <label>是否死亡:</label>
                  <span>{{ petStats.isDead ? '是' : '否' }}</span>
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

              <h4 style="margin-top: 30px;">品種設定</h4>
              <div class="breed-control">
                <select [(ngModel)]="selectedBreedName" class="breed-select">
                  <option value="">選擇品種</option>
                  <optgroup *ngFor="let rareType of rareTypes" [label]="getRareTypeName(rareType)">
                    <option *ngFor="let breed of getBreedsByRare(rareType)" [value]="breed.breed">
                      {{ breed.breedName }} ({{ breed.breed }})
                    </option>
                  </optgroup>
                </select>
                <button class="btn btn-secondary" (click)="setBreed()" [disabled]="!selectedBreedName">指定品種</button>
              </div>

              <button class="btn btn-primary" (click)="applyStatsChanges()" style="margin-top: 20px;">套用變更</button>
            </div>

            <!-- 定時檢查器 -->
            <div class="tab-content" *ngIf="activeTab === 'timers'">
              <h4>手動觸發定時檢查器</h4>
              <div class="timer-grid">
                <button class="btn btn-secondary" (click)="triggerTimer('hungerDecrease')">飽足感減少檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('hungerPenalty')">飽足感懲罰扣值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('health')">生命值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('wellness')">健康度檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('diseaseCheck')">疾病檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('leaving')">離家出走檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('lowLikability')">低好感度扣值檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('dirty')">髒汙產生檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('dirtyPunish')">髒汙懲罰</button>
                <button class="btn btn-secondary" (click)="triggerTimer('light')">燈光檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('sleep')">睡眠檢查</button>
                <button class="btn btn-secondary" (click)="triggerTimer('touchReset')">撫摸次數重置檢查</button>
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
                  <h5>次數限制重置</h5>
                  <div class="limit-control">
                    <button class="btn btn-secondary" (click)="resetTouchLimit()">重置撫摸次數</button>
                    <button class="btn btn-secondary" (click)="resetClickLimit()">重置窗戶點擊次數</button>
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

    .coin-control, .dirty-control, .pet-control, .limit-control, .time-control, .breed-control {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .coin-control input, .breed-select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 120px;
    }

    .breed-select {
      width: 200px;
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
  selectedBreedName = '';
  rareTypes: ('BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL')[] = ['BAD', 'NORMAL', 'SPECIAL', 'SUPER_SPECIAL'];


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
      case 'diseaseCheck':
        // 手動觸發疾病檢查（跳過時間限制）
        await this.wellnessCheckService.manualDiseaseCheck();
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
      case 'touchReset':
        // 手動觸發撫摸次數重置檢查
        this.touchEventService.manualTriggerTouchReset();
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
   * 獲取稀有度類型的中文名稱
   */
  getRareTypeName(rareType: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): string {
    const names = {
      'BAD': '劣質品種',
      'NORMAL': '一般品種',
      'SPECIAL': '特殊品種',
      'SUPER_SPECIAL': '超稀有品種'
    };
    return names[rareType];
  }

  /**
   * 根據稀有度獲取品種列表
   */
  getBreedsByRare(rareType: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): Breed[] {
    return breedData.filter(breed => breed.rare === rareType);
  }

  /**
   * 設定電子雞品種
   */
  async setBreed(): Promise<void> {
    if (!this.selectedBreedName) {
      await this.modalService.alert('請選擇要指定的品種', '錯誤');
      return;
    }

    const breedInfo = getBreedByName(this.selectedBreedName);
    if (!breedInfo) {
      await this.modalService.alert('找不到指定的品種資料', '錯誤');
      return;
    }

    // 更新電子雞品種和稀有度
    const updatedStats = {
      ...this.petStats,
      breedName: breedInfo.breed,
      rare: breedInfo.rare,
      lifeCycle: 'EVOLUTION' as const // 指定品種通常是進化期
    };

    PetStatsService.savePetStats(updatedStats);

    await this.modalService.info(
      `已將電子雞品種設定為：${breedInfo.breedName}\n稀有度：${breedInfo.rare}`,
      '品種設定完成'
    );

    // 重新載入資料
    this.loadData();
  }





}
