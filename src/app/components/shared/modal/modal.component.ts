import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModalConfig {
  title?: string;
  message: string;
  type: 'alert' | 'confirm' | 'info';
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" [class.show]="isShowing && !isClosing" (click)="onOverlayClick($event)">
      <div class="modal-dialog" [class.show]="isShowing && !isClosing" [class.closing]="isClosing" (click)="$event.stopPropagation()">
        <div class="modal-content" [class.content-show]="isContentVisible" [class.content-closing]="isContentClosing">
          <div class="modal-header">
            <h4 class="modal-title" *ngIf="config.title">{{ config.title }}</h4>
            <button
              *ngIf="config.type === 'info'"
              type="button"
              class="close-btn"
              (click)="onCancel()">×</button>
          </div>

          <div class="modal-body">
            <p class="modal-message">{{ config.message }}</p>
          </div>

          <div class="modal-footer">
            <button
              *ngIf="config.type === 'confirm'"
              type="button"
              class="btn btn-secondary"
              (click)="onCancel()">
              {{ config.cancelText || '取消' }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="onConfirm()"
              #confirmButton>
              {{ config.confirmText || (config.type === 'confirm' ? '確認' : '確定') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    }

    .modal-overlay.show {
      opacity: 1;
    }

    .modal-dialog {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      min-width: 30dvw;
      min-height: 100px;
      transform: scaleY(0);
      transform-origin: center center;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      overflow: hidden;
    }

    .modal-dialog.show {
      transform: scaleY(1);
      opacity: 1;
    }

    .modal-dialog.closing {
      transform: scaleY(0);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
    }

    .modal-content {
      display: flex;
      flex-direction: column;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .modal-content.content-show {
      opacity: 1;
    }

    .modal-content.content-closing {
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .modal-header {
      padding: 16px 20px 8px 20px;
      border-bottom: 1px solid rgba(125, 113, 102, 0.5);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      color: #666;
      background-color: #f8f9fa;
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .modal-body {
      padding: 20px;
      flex: 1;
    }

    .modal-message {
      margin: 0;
      line-height: 1.5;
      color: #555;
      white-space: pre-line;
    }

    .modal-footer {
      padding: 12px 20px 20px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #7d7166;
      color: white;
    }

    .btn-primary:hover {
      background-color: #6a5f54;
    }

    .btn-secondary {
      background-color: rgba(125, 113, 102, 0.3);
      color: #7d7166;
      border: 1px solid rgba(125, 113, 102, 0.5);
    }

    .btn-secondary:hover {
      background-color: rgba(125, 113, 102, 0.5);
      color: white;
    }

    .btn:focus {
      outline: 2px solid #7d7166;
      outline-offset: 2px;
    }

    /* 垂直展開動畫效果 */
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(8px);
      }
    }

    @keyframes modalExpandVertical {
      from {
        max-height: 0;
        transform: scaleY(0);
        opacity: 0;
      }
      50% {
        opacity: 0.8;
      }
      to {
        max-height: 90vh;
        transform: scaleY(1);
        opacity: 1;
      }
    }

    @keyframes modalCollapseVertical {
      from {
        max-height: 90vh;
        transform: scaleY(1);
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
      to {
        max-height: 0;
        transform: scaleY(0);
        opacity: 0;
      }
    }
  `]
})
export class ModalComponent {
  @ViewChild('confirmButton') confirmButton!: ElementRef;

  isVisible = false;
  isShowing = false;
  isClosing = false;
  isContentVisible = false;
  isContentClosing = false;
  config: ModalConfig = {
    message: '',
    type: 'alert'
  };

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  show(config: ModalConfig): Promise<boolean> {
    this.config = config;
    this.isVisible = true;
    this.isContentVisible = false;
    this.isContentClosing = false;

    // 延遲觸發展開動畫，確保 DOM 渲染完成
    setTimeout(() => {
      this.isShowing = true;
    }, 10);

    // 等待彈窗展開動畫完成後再顯示內容
    setTimeout(() => {
      this.isContentVisible = true;
    }, 420);

    // 自動聚焦到確認按鈕（等待內容顯示完成後）
    setTimeout(() => {
      this.confirmButton?.nativeElement?.focus();
    }, 570);

    return new Promise((resolve) => {
      const handleResult = (result: boolean) => {
        // 先隱藏內容
        this.isContentVisible = false;
        this.isContentClosing = true;

        // 等待內容隱藏完成後開始關閉彈窗
        setTimeout(() => {
          this.isShowing = false;
          this.isClosing = true;
          this.isContentClosing = false;

          // 等待彈窗關閉動畫完成後隱藏模態框
          setTimeout(() => {
            this.isVisible = false;
            this.isClosing = false;
            this.closed.emit();
            resolve(result);
          }, 300);
        }, 150);
      };

      const confirmSub = this.confirmed.subscribe(() => {
        confirmSub.unsubscribe();
        cancelSub.unsubscribe();
        handleResult(true);
      });

      const cancelSub = this.cancelled.subscribe(() => {
        confirmSub.unsubscribe();
        cancelSub.unsubscribe();
        handleResult(false);
      });
    });
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    // 點擊遮罩層時關閉 modal（等同於取消）
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  hide(): void {
    // 先隱藏內容
    this.isContentVisible = false;
    this.isContentClosing = true;

    // 等待內容隱藏完成後開始關閉彈窗
    setTimeout(() => {
      this.isShowing = false;
      this.isClosing = true;
      this.isContentClosing = false;

      // 等待彈窗關閉動畫完成後隱藏模態框
      setTimeout(() => {
        this.isVisible = false;
        this.isClosing = false;
        this.closed.emit();
      }, 300);
    }, 150);
  }
}