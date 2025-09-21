import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-birth-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="birth-overlay"
         [class.active]="isVisible"
         [class.fade-in]="isFadingIn"
         [class.fade-out]="isFadingOut">
      <div class="birth-message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .birth-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      z-index: 99998;
      opacity: 0;
      visibility: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.3s ease;
    }

    .birth-overlay.active {
      visibility: visible;
    }

    .birth-overlay.fade-in {
      opacity: 1;
      transition: opacity 1s ease-in;
    }

    .birth-overlay.fade-out {
      opacity: 0;
      transition: opacity 1s ease-out;
    }

    .birth-message {
      font-size: 32px;
      font-weight: bold;
      color: #333;
      text-align: center;
      letter-spacing: 2px;
    }

    @media (max-width: 576px) {
      .birth-message {
        font-size: 24px;
      }
    }
  `]
})
export class BirthOverlayComponent implements OnInit, OnDestroy {
  isVisible = false;
  isFadingIn = false;
  isFadingOut = false;
  message = '';

  ngOnInit() {}

  ngOnDestroy() {}

  /**
   * 顯示出生覆蓋層
   */
  public showBirthOverlay(message: string, duration: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      this.message = message;
      this.isVisible = true;

      // 1秒漸入動畫
      setTimeout(() => {
        this.isFadingIn = true;
      }, 50);

      // 持續顯示指定時間後開始漸出
      setTimeout(() => {
        this.isFadingIn = false;
        this.isFadingOut = true;

        // 1秒漸出動畫完成後隱藏
        setTimeout(() => {
          this.isVisible = false;
          this.isFadingOut = false;
          this.message = '';
          resolve();
        }, 1000);
      }, duration + 1000); // 1秒漸入 + 持續時間
    });
  }

  /**
   * 檢查是否正在顯示
   */
  public isShowing(): boolean {
    return this.isVisible;
  }
}