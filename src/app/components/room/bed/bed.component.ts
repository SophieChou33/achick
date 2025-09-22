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
    <div class="bed-area"
         [style.left]="bedPosition.left"
         [style.top]="bedPosition.top"
         (click)="onBedClick()"
         (mousedown)="onDragStart($event)"
         (touchstart)="onDragStart($event)">
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
      width: auto;
      height: 40dvh;
      cursor: pointer;
      z-index: 600;
      transition: none;
    }

    .bed-area.dragging {
      cursor: grabbing;
      transition: none;
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
  sleepIcon = sources.moodStatus.isSleeping;
  isSleeping = false;
  bedPosition = { left: '19%', top: '53dvh' };

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private startLeft = 0;
  private startTop = 0;
  private stateSubscription?: Subscription;

  constructor(private lightService: LightService) {}

  ngOnInit() {
    // 載入床位置
    this.loadBedPosition();

    // 初始設定床圖片
    this.updateBedImage();

    // 每秒檢查一次狀態變化（輕量級檢查）
    this.stateSubscription = new Subscription();
    this.startStateMonitoring();

    // 添加全域拖曳事件監聽器
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    document.addEventListener('touchmove', this.onDragMove.bind(this));
    document.addEventListener('touchend', this.onDragEnd.bind(this));
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }

    // 清理拖曳事件監聽器
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
    document.removeEventListener('touchmove', this.onDragMove.bind(this));
    document.removeEventListener('touchend', this.onDragEnd.bind(this));
  }

  private startStateMonitoring() {
    // 每1秒檢查一次狀態變化
    const interval = setInterval(() => {
      this.updateBedImage();
      this.checkPositionReset();
    }, 1000);

    this.stateSubscription?.add(() => clearInterval(interval));
  }

  /**
   * 檢查是否需要重置位置（當角色死亡或煮熟時）
   */
  private checkPositionReset(): void {
    const stateData = StateDataService.loadStateData();

    // 重新載入位置（如果有外部變更）
    if (stateData.bedPosition.left !== this.bedPosition.left ||
        stateData.bedPosition.top !== this.bedPosition.top) {
      this.bedPosition = stateData.bedPosition;
    }
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

  /**
   * 載入床位置
   */
  private loadBedPosition(): void {
    const stateData = StateDataService.loadStateData();
    this.bedPosition = stateData.bedPosition;
  }

  /**
   * 拖曳開始事件
   */
  onDragStart(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;

    // 將百分比轉換為像素進行計算
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    this.startLeft = parseFloat(this.bedPosition.left) * viewportWidth / 100;
    this.startTop = parseFloat(this.bedPosition.top) * viewportHeight / 100;

    // 添加拖曳樣式
    const bedArea = document.querySelector('.bed-area');
    bedArea?.classList.add('dragging');

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 拖曳移動事件
   */
  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    const newLeft = this.startLeft + deltaX;
    const newTop = this.startTop + deltaY;

    // 限制在螢幕範圍內
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const boundedLeft = Math.max(0, Math.min(newLeft, viewportWidth - 100)); // 預留100px邊距
    const boundedTop = Math.max(0, Math.min(newTop, viewportHeight - 100));

    // 轉換回百分比
    const leftPercent = (boundedLeft / viewportWidth) * 100;
    const topPercent = (boundedTop / viewportHeight) * 100;

    this.bedPosition = {
      left: `${leftPercent}%`,
      top: `${topPercent}%`
    };

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 拖曳結束事件
   */
  onDragEnd(_event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    // 移除拖曳樣式
    const bedArea = document.querySelector('.bed-area');
    bedArea?.classList.remove('dragging');

    // 儲存新位置
    StateDataService.updateBedPosition(this.bedPosition);
  }
}
