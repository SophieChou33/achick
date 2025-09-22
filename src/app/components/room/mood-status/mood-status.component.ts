import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { sources } from '../../../sources';
import { TouchEventService } from '../../../services/touch-event.service';

@Component({
  selector: 'app-mood-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mood-status-container" [class.visible]="isVisible">
      <div class="mood-icon mood-icon-1">
        <img [src]="moodIcon1" alt="Mood 1" />
      </div>
      <div class="mood-icon mood-icon-2">
        <img [src]="moodIcon2" alt="Mood 2" />
      </div>
      <div class="mood-icon mood-icon-3">
        <img [src]="moodIcon3" alt="Mood 3" />
      </div>
    </div>
  `,
  styles: [`
    .mood-status-container {
      position: absolute;
      top: 0px;
      right: 10px;
      opacity: 0;
      transform: translateY(60px);
      pointer-events: none;
      z-index: 750;
    }

    .mood-status-container.visible {
      animation: moodFloat 1s linear forwards;
    }

    @keyframes moodFloat {
      0% {
        opacity: 0;
        transform: translateY(40px);
      }
      50% {
        opacity: 1;
        transform: translateY(5px);
      }
      60% {
        opacity: 1;
        transform: translateY(-2px);
      }
      100% {
        opacity: 0;
        transform: translateY(-30px);
      }
    }

    .mood-icon {
      position: absolute;
      width: 45px;
      height: 45px;
    }

    .mood-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .mood-icon-1 {
      top: 20px;
      right: -30px;
      animation: blink1 0.5s ease-in-out infinite alternate;
    }

    .mood-icon-2 {
      top: -30px;
      right: -60px;
      animation: blink2 1s ease-in-out infinite alternate;
    }

    .mood-icon-3 {
      top: 40px;
      right: -90px;
      animation: blink3 1.5s ease-in-out infinite alternate;
    }

    @keyframes blink1 {
      0% { transform: scale(0.4); }
      100% { transform: scale(0.7); }
    }
    @keyframes blink2 {
      0% { transform: scale(0.8); }
      100% { transform: scale(1.1); }
    }
    @keyframes blink3 {
      0% { transform: scale(0.6); }
      100% { transform: scale(0.9); }
    }
  `]
})
export class MoodStatusComponent implements OnInit, OnDestroy {
  moodIcon1 = sources.moodStatus.loving;
  moodIcon2 = sources.moodStatus.loving;
  moodIcon3 = sources.moodStatus.loving;
  isVisible = false;

  private touchEventSubscription?: Subscription;

  ngOnInit() {
    // 訂閱撫摸事件，當有增加好感度時顯示動畫
    this.touchEventSubscription = TouchEventService.getFriendshipIncrease$().subscribe((increase) => {
      console.log('收到好感度增加事件:', increase); // Debug log
      if (increase > 0) {
        console.log('觸發mood-status動畫'); // Debug log
        this.showMoodStatus();
      }
    });
  }

  ngOnDestroy() {
    if (this.touchEventSubscription) {
      this.touchEventSubscription.unsubscribe();
    }
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
  }

  /**
   * 顯示心情狀態動畫
   */
  private animationTimeout?: number;

  private showMoodStatus(): void {
    console.log('showMoodStatus 被調用'); // Debug log

    // 如果有正在進行的動畫，清除計時器
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }

    // 重置並開始新動畫
    this.isVisible = false;

    // 強制重新觸發動畫
    setTimeout(() => {
      this.isVisible = true;
      console.log('isVisible 設為 true'); // Debug log
    }, 10);

    // 1秒後重置狀態，準備下次動畫（與動畫時長一致）
    this.animationTimeout = window.setTimeout(() => {
      this.isVisible = false;
      console.log('動畫結束，isVisible 設為 false'); // Debug log
    }, 1000);
  }
}
