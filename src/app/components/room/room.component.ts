import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WindowComponent } from './window/window.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { CharacterComponent } from './character/character.component';
import { BedComponent } from './bed/bed.component';
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
    BedComponent
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
      pointer-events: auto;
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      user-drag: none;
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
  }

  onDragStart(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startX = clientX;
    this.scrollLeft = this.roomWrapper.nativeElement.scrollLeft;
    
    const background = event.target as HTMLElement;
    background.classList.add('dragging');
    
    event.preventDefault();
  }

  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const walk = (this.startX - clientX) * 1.5; // 調整移動速度
    this.roomWrapper.nativeElement.scrollLeft = this.scrollLeft + walk;
    
    event.preventDefault();
  }

  onDragEnd(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const background = this.roomWrapper.nativeElement.querySelector('.room-background');
    background?.classList.remove('dragging');
  }
}
