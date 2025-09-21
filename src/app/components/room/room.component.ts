import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WindowComponent } from './window/window.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { CharacterComponent } from './character/character.component';
import { BedComponent } from './bed/bed.component';
import { ToastrComponent } from '../shared/toastr/toastr.component';
import { sources } from '../../sources';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    WindowComponent,
    StatusBarComponent,
    CharacterComponent,
    BedComponent,
    ToastrComponent
  ],
  template: `
    <div class="room-wrapper" #roomWrapper>
      <div class="room-container">
        <img [src]="backgroundImageSrc" alt="Room Background" class="room-background" 
             (mousedown)="onDragStart($event)"
             (touchstart)="onDragStart($event)" />
        <app-window></app-window>
        <app-bed></app-bed>
        <app-character></app-character>
      </div>
      <app-header></app-header>
      <app-sidebar></app-sidebar>
      <app-status-bar></app-status-bar>
      <app-toastr></app-toastr>
    </div>
  `,
  styles: [`
    .room-wrapper {
      width: 100%;
      height: 100vh;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* Internet Explorer 10+ */
      scroll-behavior: auto; /* 改為 auto，避免拖動時的過渡動畫 */
    }

    .room-background {
      cursor: grab;
      user-select: none;
      touch-action: pan-x;
    }

    .room-background.dragging {
      cursor: grabbing;
    }

    /* 禁用所有圖片的選取功能 */
    img {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      user-drag: none;
    }

    /* 確保子組件不會被背景拖拽影響 */
    app-window, app-bed, app-character {
      pointer-events: auto;
      z-index: 600;
    }

    .room-wrapper::-webkit-scrollbar {
      display: none; /* WebKit */
    }

    .room-container {
      position: relative;
      display: inline-block;
      height: 100dvh;
    }

    .room-background {
      top: 0;
      left: 0;
      width: auto;
      height: 100dvh;
      z-index: -1;
      object-fit: contain;
    }

  `]
})
export class RoomComponent implements OnInit {
  @ViewChild('roomWrapper', { static: true }) roomWrapper!: ElementRef<HTMLDivElement>;
  
  backgroundImageSrc = sources.scene.roomDayLightOn;
  
  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;

  ngOnInit() {
    // Initialize room state
    // 添加全域事件監聽器
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    document.addEventListener('touchmove', this.onDragMove.bind(this));
    document.addEventListener('touchend', this.onDragEnd.bind(this));

    // 重置畫面位置到場景正中間
    this.centerRoom();
  }

  private centerRoom() {
    // 立即嘗試居中，然後在圖片載入後再次確認
    const roomWrapper = this.roomWrapper.nativeElement;
    const roomContainer = roomWrapper.querySelector('.room-container') as HTMLElement;
    const backgroundImage = roomWrapper.querySelector('.room-background') as HTMLImageElement;

    if (roomContainer && backgroundImage) {
      // 立即執行一次居中（基於當前尺寸）
      this.performCentering(roomWrapper, roomContainer);

      // 如果圖片還沒載入完成，等待載入後再次居中
      if (!backgroundImage.complete) {
        backgroundImage.onload = () => {
          this.performCentering(roomWrapper, roomContainer);
        };
      }
    }
  }

  private performCentering(roomWrapper: HTMLElement, roomContainer: HTMLElement) {
    const containerWidth = roomContainer.scrollWidth;
    const wrapperWidth = roomWrapper.clientWidth;

    // 計算居中位置：容器寬度減去可視寬度，再除以2
    const centerPosition = Math.max(0, (containerWidth - wrapperWidth) / 2);

    // 直接設置滾動位置到居中（無需切換行為，因為已經是 auto）
    roomWrapper.scrollLeft = centerPosition;
  }

  /**
   * 公開方法：重新將房間畫面置中
   * 可供外部組件調用
   */
  public resetToCenter() {
    this.centerRoom();
  }

  onDragStart(event: MouseEvent | TouchEvent) {
    // 只有在點擊背景圖片時才啟用拖拽
    const target = event.target as HTMLElement;
    if (!target.classList.contains('room-background')) {
      return;
    }

    this.isDragging = true;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startX = clientX;
    this.scrollLeft = this.roomWrapper.nativeElement.scrollLeft;

    target.classList.add('dragging');

    event.preventDefault();
    event.stopPropagation();
  }

  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const walk = (this.startX - clientX) * 1; // 改為 1:1 移動比例，更直觀
    const newScrollLeft = this.scrollLeft + walk;

    // 確保滾動位置在有效範圍內
    const maxScrollLeft = this.roomWrapper.nativeElement.scrollWidth - this.roomWrapper.nativeElement.clientWidth;
    this.roomWrapper.nativeElement.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));

    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnd(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const background = this.roomWrapper.nativeElement.querySelector('.room-background');
    background?.classList.remove('dragging');
  }
}
