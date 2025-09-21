import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { sources } from '../../../sources';
import { LightService } from '../../../services/light.service';
import { StateDataService } from '../../../data/state-data';

@Component({
  selector: 'app-bed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bed-area" (click)="onBedClick()">
      <img [src]="bedImage" alt="Bed" class="bed-image" />

      <!-- 睡眠狀態指示器 -->
      <div class="sleep-status-indicator" *ngIf="isSleeping">
        <img [src]="sleepIcon" alt="Sleeping" class="sleep-icon" />
      </div>
    </div>
  `,
  styles: [`
    .bed-area {
      position: absolute;
      left: 19%;
      top: 53dvh;
      width: auto;
      height: 40dvh;
      cursor: pointer;
      z-index: 600;
    }

    .bed-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: all 0.3s ease;
    }

    .sleep-status-indicator {
      position: absolute;
      right: -40px;
      top: -40px;
      z-index: 650;
      animation: sleepFloat 2s ease-in-out infinite;
    }

    .sleep-icon {
      width: 30px;
      height: 30px;
      object-fit: contain;
    }

    @keyframes sleepFloat {
      0%, 100% {
        transform: translateY(0px);
        opacity: 1;
      }
      50% {
        transform: translateY(-10px);
        opacity: 0.6;
      }
    }
  `]
})
export class BedComponent implements OnInit, OnDestroy {
  bedImage = sources.bed.bedEmptyLight;
  sleepIcon = sources.otherIcons.isSleeping;
  isSleeping = false;
  private stateSubscription?: Subscription;

  constructor(private lightService: LightService) {}

  ngOnInit() {
    // 初始設定床圖片
    this.updateBedImage();

    // 每秒檢查一次狀態變化（輕量級檢查）
    this.stateSubscription = new Subscription();
    this.startStateMonitoring();
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  private startStateMonitoring() {
    // 每1秒檢查一次狀態變化
    const interval = setInterval(() => {
      this.updateBedImage();
    }, 1000);

    this.stateSubscription?.add(() => clearInterval(interval));
  }

  private updateBedImage() {
    const currentStateData = StateDataService.loadStateData();
    const isLightOn = this.lightService.isLightOn;
    const isSleeping = currentStateData.isSleeping.isActive;

    // 更新睡眠狀態指示器顯示
    this.isSleeping = isSleeping === 1;

    // 根據光線和睡眠狀態決定床圖片
    if (isLightOn === 1 && isSleeping === 1) {
      // 若 LightService 的 isLightOn = 1 且『狀態資料物件』的『isSleeping』值為 1
      this.bedImage = sources.bed.bedIsSleepingLight;
    } else if (isLightOn === 0 && isSleeping === 1) {
      // 若 LightService 的 isLightOn = 0 且『狀態資料物件』的『isSleeping』值為 1
      this.bedImage = sources.bed.bedIsSleepingDark;
    } else if (isLightOn === 1 && isSleeping === 0) {
      // 若 LightService 的 isLightOn = 1 且『狀態資料物件』的『isSleeping』值為 0
      this.bedImage = sources.bed.bedEmptyLight;
    } else if (isLightOn === 0 && isSleeping === 0) {
      // 若 LightService 的 isLightOn = 0 且『狀態資料物件』的『isSleeping』值為 0
      this.bedImage = sources.bed.bedEmptyDark;
    }
  }

  onBedClick() {
    console.log('Bed clicked...');
    // TODO: Implement bed interaction functionality
  }
}
