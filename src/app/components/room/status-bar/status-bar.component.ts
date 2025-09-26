import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PetStatsService } from '../../../data/pet-stats-data';
import { PetStats } from '../../../types/pet-stats.type';
import { ToastrService } from '../../shared/toastr/toastr.component';
import { StateDataService } from '../../../data/state-data';
import { StateData } from '../../../types/state-data.type';
import { UserDataService } from '../../../data/user-data';
import { UserData } from '../../../types/user-data.type';
import { CustomTimeService } from '../../../services/custom-time.service';

interface PetInfo {
  name: string;
  birthday: string;
  evolutionTime?: string;
  hoursAlive: number;
}

interface StatusEffects {
  mood: string;
  activeStates: string[];
}

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-bar">
      <div class="status-left">
        <div class="pet-info">
          <div class="pet-details">
            <span>生日: {{ petInfo.birthday }}</span>
            <span *ngIf="petInfo.evolutionTime">進化: {{ petInfo.evolutionTime }}</span>
            <span>飼養: {{ petInfo.hoursAlive }}小時</span>
          </div>
        </div>
      </div>

      <div class="status-right">
        <div class="status-effects">
          <div class="pet-name">{{ petInfo.name }}</div>
          <div class="mood" *ngIf="statusEffects.mood">情緒: {{ statusEffects.mood }}</div>
          <div class="active-states" *ngIf="statusEffects.activeStates.length > 0 && !shouldHideActiveStates()">
            <span *ngFor="let state of statusEffects.activeStates" class="state">{{ state }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 滑動狀態面板 -->
    <div class="status-panel" *ngIf="petStats.rare !== null && !petStats.isLeaving" [class.visible]="isPanelVisible" [class.hover]="isHovering"
         (click)="togglePanel()"
         (mouseenter)="onHover(true)"
         (mouseleave)="onHover(false)">
      <div class="status-values">
        <div class="status-title">STATUS</div>
        <div class="status-row">
          <span class="status-label">當前生命值</span>
          <div class="status-bar-row">
            <div class="progress-bar">
              <div class="progress-fill health" [style.width.%]="getHealthPercentage()"></div>
            </div>
            <span class="status-value health">{{ petStats.currentHealth }}/{{ petStats.maxHealth }}</span>
          </div>
        </div>

        <div class="status-row">
          <span class="status-label">當前好感度</span>
          <div class="status-bar-row">
            <div class="progress-bar">
              <div class="progress-fill friendship" [style.width.%]="getFriendshipPercentage()"></div>
            </div>
            <span class="status-value friendship">{{ getFriendshipDisplay() }}/{{ petStats.maxFriendship }}</span>
          </div>
        </div>

        <div class="status-row">
          <span class="status-label">當前飽足感</span>
          <div class="status-bar-row">
            <div class="progress-bar">
              <div class="progress-fill hunger" [style.width.%]="getHungerPercentage()"></div>
            </div>
            <span class="status-value hunger">{{ petStats.currentHunger }}/{{ petStats.maxHunger }}</span>
          </div>
        </div>

        <div class="status-row">
          <span class="status-label">當前健康度</span>
          <div class="status-bar-row">
            <div class="progress-bar">
              <div class="progress-fill wellness" [style.width.%]="getWellnessPercentage()"></div>
            </div>
            <span class="status-value wellness">{{ petStats.currentWellness }}/{{ petStats.maxWellness }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 92px;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5px);
      color: white;
      display: flex;
      align-items: center;
      padding: 0 20px;
      box-sizing: border-box;
      z-index: 1000;
      text-shadow: 0 1px 2px rgba(0,0,0,0.7);
    }

    .status-left {
      flex: 1;
    }

    .pet-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .pet-name {
      font-size: 18px;
      font-weight: bold;
    }

    .pet-details {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 12px;
      opacity: 0.8;
    }

    .status-right {
      flex: 1;
      text-align: right;
    }

    .status-effects {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .mood {
      font-size: 14px;
      font-weight: 500;
    }

    .active-states {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: flex-end;
    }

    .state {
      background: rgba(231, 76, 60, 0.8);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
    }

    /* 滑動狀態面板 */
    .status-panel {
      position: fixed;
      bottom: 120px;
      right: -305px;
      z-index: 1001;
      transition: transform 0.3s ease;
      cursor: pointer;
    }

    .status-panel.visible {
      transform: translateX(-305px);
    }

    .status-panel.hover:not(.visible) {
      transform: translateX(-5px);
    }

    .status-values {
      width: 290px;
      background: rgba(255, 246, 243, 0.7);
      border-radius: 12px 0 0 12px;
      padding: 16px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-title,
    .status-row {
      transition: opacity 0.4s ease;
    }

    .status-panel:not(.visible) .status-title,
    .status-panel:not(.visible) .status-row {
      opacity: 0;
    }

    .status-panel.visible .status-title,
    .status-panel.visible .status-row {
      opacity: 1;
    }

    .status-title {
      font-size: 18px;
      font-weight: bold;
      color: #847170;
      text-align: center;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }

    @media (max-width: 576px) {
      .status-panel {
        right: -305px !important;
      }

      .status-panel.visible {
        transform: translateX(-305px) !important;
      }

      .status-panel.hover:not(.visible) {
        transform: translateX(-5px) !important;
      }
    }

    .status-row {
      display: flex;
      flex-direction: column;
      gap: 0px;
    }

    .status-label {
      font-size: 14px;
      color: #847170;
      font-weight: 500;
      letter-spacing: 1px;
    }

    .status-bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: rgba(132, 113, 112, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .progress-fill.health {
      background: #cc6e6c;
    }

    .progress-fill.friendship {
      background: #f3b09f;
    }

    .progress-fill.hunger {
      background: #e0a65f;
    }

    .progress-fill.wellness {
      background: #b5ca89;
    }

    .status-value {
      min-width: 50px;
      font-size: 14px;
      text-align: right;
      font-weight: 600;
    }

    .status-value.health {
      color: #cc6e6c;
    }

    .status-value.friendship {
      color: #f3b09f;
    }

    .status-value.hunger {
      color: #e0a65f;
    }

    .status-value.wellness {
      color: #b5ca89;
    }
  `]
})
export class StatusBarComponent implements OnInit, OnDestroy {
  petInfo: PetInfo = {
    name: 'Achick',
    birthday: '未知',
    hoursAlive: 0
  };

  statusEffects: StatusEffects = {
    mood: '開心',
    activeStates: []
  };

  petStats: PetStats = PetStatsService.loadPetStats();
  stateData: StateData = StateDataService.loadStateData();
  userData: UserData = UserDataService.loadUserData();
  isPanelVisible = false;
  isHovering = false;

  private stateUpdateInterval: any;
  private petStatsSubscription?: Subscription;
  private stateDataSubscription?: Subscription;

  constructor(private customTimeService: CustomTimeService) {}

  ngOnInit() {
    // Initialize status monitoring
    this.loadPetData();
    this.updateStateData();

    // 訂閱角色資料變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(petStats => {
      this.petStats = petStats;
      this.loadPetData();
      // 當 petStats 變化時，立即更新活動狀態（確保 isLeaving 變化時立即反映）
      this.updateActiveStates();
    });

    // 訂閱狀態資料變化（即時更新）
    this.stateDataSubscription = StateDataService.getStateData$().subscribe(stateData => {
      this.stateData = stateData;
      this.updateActiveStates();
    });

    // 定期更新其他資料（減少頻率，因為狀態已經是即時更新）
    this.stateUpdateInterval = setInterval(() => {
      this.loadPetData(); // 更新時間相關資料
    }, 1000);
  }

  ngOnDestroy() {
    if (this.stateUpdateInterval) {
      clearInterval(this.stateUpdateInterval);
    }
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
    }
    if (this.stateDataSubscription) {
      this.stateDataSubscription.unsubscribe();
    }
  }

  private loadPetData() {
    this.petStats = PetStatsService.loadPetStats();
    this.userData = UserDataService.loadUserData();

    if (this.petStats.name) {
      this.petInfo.name = this.petStats.name;
    }

    // 獲取當前寵物記錄
    const currentPetRecord = UserDataService.getCurrentPetRecord(this.userData);
    if (currentPetRecord) {
      // 設置生日
      this.petInfo.birthday = currentPetRecord.birthTime ?
        this.formatDisplayTime(currentPetRecord.birthTime) : '未知';

      // 如果是進化狀態，顯示進化時間
      if (this.petStats.lifeCycle === 'EVOLUTION' && currentPetRecord.evolutionTime) {
        this.petInfo.evolutionTime = this.formatDisplayTime(currentPetRecord.evolutionTime);
      } else {
        this.petInfo.evolutionTime = undefined;
      }

      // 計算飼養小時數
      if (currentPetRecord.birthTime) {
        this.petInfo.hoursAlive = this.calculateHoursAlive(currentPetRecord.birthTime);
      }
    }
  }

  private updateStateData() {
    // 狀態資料現在通過訂閱自動更新，這個方法保留給其他需要手動更新的場景
    this.stateData = StateDataService.loadStateData();
    this.updateActiveStates();
  }

  private updateActiveStates() {
    // 如果處於離家出走狀態，只顯示「離家出走中」
    if (this.petStats.isLeaving) {
      this.statusEffects.activeStates = ['離家出走中'];
    } else {
      // 原有邏輯：獲取所有活動狀態
      const activeStates = StateDataService.getActiveStates(this.stateData);
      this.statusEffects.activeStates = activeStates.map(state => state.stateText);

      // 檢查是否處於冷凍狀態
      if (this.petStats.isFreezing) {
        this.statusEffects.activeStates.push('冷凍狀態');
      }
    }

    // 更新情緒
    this.updateMood();
  }

  togglePanel() {
    this.isPanelVisible = !this.isPanelVisible;
    // 通知 ToastrService 狀態面板狀態變化
    ToastrService.setStatusExpanded(this.isPanelVisible);
  }

  onHover(isHovering: boolean) {
    if (!this.isPanelVisible) {
      this.isHovering = isHovering;
    }
  }

  getHealthPercentage(): number {
    if (this.petStats.maxHealth === 0) return 0;
    return Math.round((this.petStats.currentHealth / this.petStats.maxHealth) * 100);
  }

  getFriendshipPercentage(): number {
    if (this.petStats.maxFriendship === 0) return 0;
    return Math.round((this.petStats.currentFriendship / this.petStats.maxFriendship) * 100);
  }

  getHungerPercentage(): number {
    if (this.petStats.maxHunger === 0) return 0;
    return Math.round((this.petStats.currentHunger / this.petStats.maxHunger) * 100);
  }

  getWellnessPercentage(): number {
    if (this.petStats.maxWellness === 0) return 0;
    return Math.round((this.petStats.currentWellness / this.petStats.maxWellness) * 100);
  }

  getFriendshipDisplay(): string {
    return this.petStats.currentFriendship.toFixed(1);
  }

  private updateMood() {
    // 1. 當isDead、isCooked、isFreezing為true時，或是電子雞breed為null(未出生)時，情緒欄位隱藏
    if (this.petStats.isDead || this.petStats.isCooked || this.petStats.isFreezing || this.petStats.breedName === null) {
      // 情緒欄位應該隱藏，但為了保持一致性，我們暫時不顯示
      this.statusEffects.mood = '';
      return;
    }

    // 2. 當isLeaving時，情緒顯示為『心灰意冷』
    if (this.petStats.isLeaving) {
      this.statusEffects.mood = '心灰意冷';
      return;
    }

    // 3. 當狀態包含『需要睡眠時』，情緒顯示為『煩躁』
    if (this.stateData.needSleep?.isActive === 1) {
      this.statusEffects.mood = '煩躁';
      return;
    }

    // 4. 當狀態包含飢餓、虛弱、無依無靠，任一狀態時，情緒顯示為『難過』
    if (this.stateData.hungry?.isActive === 1 ||
        this.stateData.weak?.isActive === 1 ||
        this.stateData.lowLikability?.isActive === 1) {
      this.statusEffects.mood = '難過';
      return;
    }

    // 5. 若屬於以上條件以外的情況，情緒顯示為『開心』
    this.statusEffects.mood = '開心';
  }

  private formatDisplayTime(timeString: string): string {
    // 格式：yyyy/mm/dd HH:mm:ss -> mm/dd HH:mm
    const parts = timeString.split(' ');
    if (parts.length === 2) {
      const datePart = parts[0].split('/');
      const timePart = parts[1].split(':');
      if (datePart.length === 3 && timePart.length >= 2) {
        return `${datePart[1]}/${datePart[2]} ${timePart[0]}:${timePart[1]}`;
      }
    }
    return timeString;
  }

  private calculateHoursAlive(birthTimeString: string): number {
    try {
      // 解析生日時間 yyyy/mm/dd HH:mm:ss
      const birthTime = this.parseTimeString(birthTimeString);
      // 使用自訂時間服務獲取當前時間
      const currentTime = this.customTimeService.getCurrentTime();

      // 計算時間差（毫秒）
      const timeDiff = currentTime.getTime() - birthTime.getTime();
      // 轉換為小時，向下取整（未滿一小時不計算）
      return Math.floor(timeDiff / (1000 * 60 * 60));
    } catch (error) {
      console.error('Error calculating hours alive:', error);
      return 0;
    }
  }

  private parseTimeString(timeString: string): Date {
    // 解析 yyyy/mm/dd HH:mm:ss 格式
    const parts = timeString.split(' ');
    if (parts.length !== 2) throw new Error('Invalid time format');

    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');

    if (dateParts.length !== 3 || timeParts.length !== 3) {
      throw new Error('Invalid time format');
    }

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JavaScript月份從0開始
    const day = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const second = parseInt(timeParts[2]);

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * 判斷是否應該隱藏活動狀態區塊
   */
  shouldHideActiveStates(): boolean {
    return this.petStats.isDead ||
           this.petStats.isFreezing ||
           this.petStats.isCooked;
  }
}
