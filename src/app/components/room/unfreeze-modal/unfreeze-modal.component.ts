import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unfreeze-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [class.show]="isVisible" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">解除冷凍</h5>
            <button type="button" class="close-btn" (click)="onClose()">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="unfreeze-message">
              <div class="freeze-icon">❄️</div>
              <p class="message-text">您的電子雞目前處於冷凍狀態。</p>
              <p class="confirm-text">是否要解除冷凍狀態？</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onClose()">
              取消
            </button>
            <button type="button" class="btn btn-primary" (click)="onConfirm()">
              解除冷凍
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1200;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-backdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-dialog {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal-backdrop.show .modal-dialog {
      transform: scale(1);
    }

    .modal-content {
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px 20px 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      transition: color 0.2s ease;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #666;
    }

    .modal-body {
      padding: 20px;
    }

    .unfreeze-message {
      text-align: center;
    }

    .freeze-icon {
      font-size: 48px;
      margin-bottom: 16px;
      display: block;
    }

    .message-text {
      font-size: 16px;
      color: #495057;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .confirm-text {
      font-size: 16px;
      color: #333;
      font-weight: 500;
      margin-bottom: 0;
      line-height: 1.5;
    }

    .modal-footer {
      padding: 15px 20px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      min-width: 80px;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }
  `]
})
export class UnfreezeModalComponent {
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  isVisible = false;

  show() {
    this.isVisible = true;
  }

  onClose() {
    this.isVisible = false;
    this.close.emit();
  }

  onConfirm() {
    this.isVisible = false;
    this.confirm.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}