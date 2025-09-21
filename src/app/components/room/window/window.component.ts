import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeavingService } from '../../../services/leaving.service';
import { PetStatsService } from '../../../data/pet-stats-data';

@Component({
  selector: 'app-window',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="window-area" (click)="onWindowClick()">
      <div class="window-frame"></div>
    </div>
  `,
  styles: [`
    .window-area {
      position: absolute;
      right: 30%;
      top: 17dvh;
      width: 26dvh;
      height: 30dvh;
      cursor: pointer;
      z-index: 600;
    }

    .window-frame {
      width: 100%;
      height: 100%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(135, 206, 235, 0.2);
      transition: all 0.3s ease;
    }

    .window-frame:hover {
      background: rgba(135, 206, 235, 0.4);
      border-color: rgba(255, 255, 255, 0.6);
    }

  `]
})
export class WindowComponent {

  constructor(private leavingService: LeavingService) {}

  onWindowClick() {
    console.log('Window clicked...');

    const currentPetStats = PetStatsService.loadPetStats();

    // 若電子雞當前數值物件的 isLeaving 為 false，則不執行任何邏輯
    if (!currentPetStats.isLeaving) {
      return;
    }

    // 若電子雞當前數值物件的 isLeaving 為 true，則執行 LeavingService 的 leavingWindowEvent 函數
    this.leavingService.leavingWindowEvent();
  }
}
