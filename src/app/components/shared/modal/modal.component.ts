import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModalConfig {
  title?: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header" *ngIf="config.title">
            <h4 class="modal-title">{{ config.title }}</h4>
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
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
    }

    .modal-content {
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 16px 20px 8px 20px;
      border-bottom: 1px solid #dee2e6;
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
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .btn:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }
  `]
})
export class ModalComponent {
  @ViewChild('confirmButton') confirmButton!: ElementRef;

  isVisible = false;
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

    // 自動聚焦到確認按鈕
    setTimeout(() => {
      this.confirmButton?.nativeElement?.focus();
    }, 100);

    return new Promise((resolve) => {
      const handleResult = (result: boolean) => {
        this.isVisible = false;
        this.closed.emit();
        resolve(result);
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
    this.isVisible = false;
    this.closed.emit();
  }
}