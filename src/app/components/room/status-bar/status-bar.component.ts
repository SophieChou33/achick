import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PetInfo {
  name: string;
  birthday: string;
  hoursAlive: number;
}

interface StatusBars {
  affection: number;
  health: number;
  wellness: number;
  satiety: number;
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

      <div class="status-center">
        <div class="status-bars">
          <div class="status-row">
            <span class="status-label">好感度</span>
            <div class="progress-bar">
              <div class="progress-fill affection" [style.width.%]="statusBars.affection"></div>
            </div>
            <span class="status-value">{{ statusBars.affection }}%</span>
          </div>

          <div class="status-row">
            <span class="status-label">生命值</span>
            <div class="progress-bar">
              <div class="progress-fill health" [style.width.%]="statusBars.health"></div>
            </div>
            <span class="status-value">{{ statusBars.health }}%</span>
          </div>

          <div class="status-row">
            <span class="status-label">健康度</span>
            <div class="progress-bar">
              <div class="progress-fill wellness" [style.width.%]="statusBars.wellness"></div>
            </div>
            <span class="status-value">{{ statusBars.wellness }}%</span>
          </div>

          <div class="status-row">
            <span class="status-label">飽足感</span>
            <div class="progress-bar">
              <div class="progress-fill satiety" [style.width.%]="statusBars.satiety"></div>
            </div>
            <span class="status-value">{{ statusBars.satiety }}%</span>
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
  `,
  styles: [`
    .status-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 80px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      display: flex;
      align-items: center;
      padding: 0 20px;
      box-sizing: border-box;
      z-index: 1000;
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
      gap: 15px;
      font-size: 12px;
      opacity: 0.8;
    }

    .status-center {
      flex: 2;
      padding: 0 20px;
    }

    .status-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-label {
      min-width: 60px;
      font-size: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .progress-fill.affection {
      background: linear-gradient(90deg, #ff6b9d, #ff8e8e);
    }

    .progress-fill.health {
      background: linear-gradient(90deg, #ff4757, #ff6b9d);
    }

    .progress-fill.wellness {
      background: linear-gradient(90deg, #2ecc71, #27ae60);
    }

    .progress-fill.satiety {
      background: linear-gradient(90deg, #f39c12, #e67e22);
    }

    .status-value {
      min-width: 35px;
      font-size: 11px;
      text-align: right;
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

  `]
})
export class StatusBarComponent implements OnInit {
  petInfo: PetInfo = {
    name: 'Achick',
    birthday: '2025/09/15',
    hoursAlive: 48
  };

  statusBars: StatusBars = {
    affection: 75,
    health: 90,
    wellness: 60,
    satiety: 40
  };

  statusEffects: StatusEffects = {
    mood: '開心',
    debuffs: ['飢餓']
  };

  ngOnInit() {
    // Initialize status monitoring
  }
}