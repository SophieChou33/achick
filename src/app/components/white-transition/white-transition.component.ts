import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhiteTransitionService } from '../../services/white-transition.service';

@Component({
  selector: 'app-white-transition',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="white-transition-overlay"
         [class.active]="isActive"
         [class.fade-out]="isFadingOut">
    </div>
  `,
  styles: [`
    .white-transition-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.6s ease-in-out, transform 0.8s ease-in-out;
      pointer-events: none;
      visibility: hidden;
    }

    .white-transition-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .white-transition-overlay.fade-out {
      opacity: 0 !important;
      transition: opacity 0.8s ease-out, transform 1s ease-out !important;
    }
  `]
})
export class WhiteTransitionComponent implements OnInit, OnDestroy {
  isActive: boolean = false;
  isFadingOut: boolean = false;

  constructor(private whiteTransitionService: WhiteTransitionService) {}

  ngOnInit() {
    // 監聽fadeIn事件
    this.whiteTransitionService.fadeIn$.subscribe(fadeIn => {
      if (fadeIn) {
        this.startFadeIn();
      }
    });

    // 監聽fadeOut事件
    this.whiteTransitionService.fadeOut$.subscribe(fadeOut => {
      if (fadeOut) {
        this.startFadeOut();
      }
    });
  }

  ngOnDestroy() {
    // Angular會自動清理subscription
  }

  private startFadeIn() {
    this.isActive = true;
    this.isFadingOut = false;

    // 等待白光完全淡入後，觸發場景準備
    setTimeout(() => {
      this.whiteTransitionService.triggerScenePreparation();
    }, 600);
  }

  private startFadeOut() {
    this.isFadingOut = true;

    // 淡出完成後重置狀態
    setTimeout(() => {
      this.isActive = false;
      this.isFadingOut = false;
      this.whiteTransitionService.reset();
    }, 800);
  }
}