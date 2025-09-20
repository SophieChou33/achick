import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PetStatsService } from '../../../data/pet-stats-data';
import { PetStats } from '../../../types/pet-stats.type';

interface PetInfo {
  name: string;
  birthday: string;
  hoursAlive: number;
}

interface StatusEffects {
  mood: string;
  debuffs: string[];
}

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-bar">
      <div class="status-left">
        <div class="pet-info">
          <div class="pet-name">{{ petInfo.name }}</div>
          <div class="pet-details">
            <span>生日: {{ petInfo.birthday }}</span>
            <span>飼養: {{ petInfo.hoursAlive }}小時</span>
          </div>
        </div>
      </div>

      <div class="status-right">
        <div class="status-effects">
          <div class="mood">情緒: {{ statusEffects.mood }}</div>
          <div class="debuffs" *ngIf="statusEffects.debuffs.length > 0">
            <span *ngFor="let debuff of statusEffects.debuffs" class="debuff">{{ debuff }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 滑動狀態面板 -->
    <div class="status-panel" [class.visible]="isPanelVisible" [class.hover]="isHovering"
         (click)="togglePanel()"
         (mouseenter)="onHover(true)"
         (mouseleave)="onHover(false)">
      <div class="status-values">
        <div class="status-title">STATUS</div>
        <div class="status-row">
          <span class="status-label">當前生命值</span>
          <div class="progress-bar">
            <div class="progress-fill health" [style.width.%]="getHealthPercentage()"></div>
          </div>
          <span class="status-value">{{ getHealthPercentage() }}%</span>
        </div>

        <div class="status-row">
          <span class="status-label">當前好感度</span>
          <div class="progress-bar">
            <div class="progress-fill friendship" [style.width.%]="getFriendshipPercentage()"></div>
          </div>
          <span class="status-value">{{ getFriendshipPercentage() }}%</span>
        </div>

        <div class="status-row">
          <span class="status-label">當前飽足感</span>
          <div class="progress-bar">
            <div class="progress-fill hunger" [style.width.%]="getHungerPercentage()"></div>
          </div>
          <span class="status-value">{{ getHungerPercentage() }}%</span>
        </div>

        <div class="status-row">
          <span class="status-label">當前健康度</span>
          <div class="progress-bar">
            <div class="progress-fill wellness" [style.width.%]="getWellnessPercentage()"></div>
          </div>
          <span class="status-value">{{ getWellnessPercentage() }}%</span>
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

    .debuffs {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: flex-end;
    }

    .debuff {
      background: rgba(231, 76, 60, 0.8);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
    }

    /* 滑動狀態面板 */
    .status-panel {
      position: fixed;
      bottom: 120px;
      right: -290px;
      z-index: 1001;
      transition: transform 0.3s ease;
      cursor: pointer;
    }

    .status-panel.visible {
      transform: translateX(-290px);
    }

    .status-panel.hover:not(.visible) {
      transform: translateX(-5px);
    }

    .status-values {
      width: 270px;
      background: rgba(255, 246, 243, 0.7);
      border-radius: 12px 0 0 12px;
      padding-block: 32px;
      padding-inline: 16px;
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
      font-size: 14px;
      font-weight: bold;
      color: #847170;
      text-align: center;
      margin-bottom: 16px;
      letter-spacing: 2px;
    }

    @media (max-width: 576px) {
      .status-values {
        padding-block: 16px;
        padding-inline: 16px;
      }

      .status-panel {
        right: -290px !important;
      }

      .status-panel.visible {
        transform: translateX(-290px) !important;
      }

      .status-panel.hover:not(.visible) {
        transform: translateX(-5px) !important;
      }
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-label {
      min-width: 80px;
      font-size: 12px;
      color: #847170;
      font-weight: 500;
      letter-spacing: 1px;
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
      min-width: 40px;
      font-size: 11px;
      text-align: right;
      color: #847170;
      font-weight: 500;
    }
  `]
})
export class StatusBarComponent implements OnInit {
  petInfo: PetInfo = {
    name: 'Achick',
    birthday: '2025/09/15',
    hoursAlive: 48
  };

  statusEffects: StatusEffects = {
    mood: '開心',
    debuffs: ['飢餓']
  };

  petStats: PetStats = PetStatsService.loadPetStats();
  isPanelVisible = false;
  isHovering = false;

  ngOnInit() {
    // Initialize status monitoring
    this.loadPetData();
  }

  private loadPetData() {
    this.petStats = PetStatsService.loadPetStats();
    if (this.petStats.name) {
      this.petInfo.name = this.petStats.name;
    }
  }

  togglePanel() {
    this.isPanelVisible = !this.isPanelVisible;
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
}