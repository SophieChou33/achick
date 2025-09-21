import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-naming-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" [class.show]="isVisible" (click)="onBackdropClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">請為您的電子雞命名</h5>
            <button type="button" class="close-btn" (click)="onClose()">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <input
                type="text"
                class="form-control"
                [(ngModel)]="petName"
                (input)="onInputChange()"
                maxlength="14"
                placeholder="輸入電子雞名字（最多14個字符）"
                #nameInput>
              <div class="char-count">{{ petName.length }}/14</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onClose()">
              關閉
            </button>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="!isNameValid"
              (click)="onConfirm()">
              確認孵化
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
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99999;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal-backdrop.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-dialog {
      max-width: 500px;
      width: 90%;
      margin: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 20px;
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
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      position: relative;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    .char-count {
      position: absolute;
      right: 10px;
      bottom: -20px;
      font-size: 12px;
      color: #666;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
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

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 576px) {
      .modal-dialog {
        width: 95%;
        margin: 10px;
      }

      .modal-title {
        font-size: 16px;
      }

      .form-control {
        font-size: 16px; /* 防止iOS縮放 */
      }
    }
  `]
})
export class NamingModalComponent {
  @Output() confirm = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  isVisible = false;
  petName = '';

  get isNameValid(): boolean {
    return this.petName.trim().length > 0 && this.petName.length <= 14;
  }

  /**
   * 顯示命名彈窗
   */
  public show(): void {
    this.isVisible = true;
    this.petName = '';

    // 自動聚焦到輸入框
    setTimeout(() => {
      const input = document.querySelector('.form-control') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  /**
   * 隱藏命名彈窗
   */
  public hide(): void {
    this.isVisible = false;
    this.petName = '';
  }

  /**
   * 輸入框內容變化
   */
  onInputChange(): void {
    // 確保不超過14個字符
    if (this.petName.length > 14) {
      this.petName = this.petName.substring(0, 14);
    }
  }

  /**
   * 點擊背景關閉
   */
  onBackdropClick(event: Event): void {
    this.onClose();
  }

  /**
   * 關閉彈窗
   */
  onClose(): void {
    this.hide();
    this.close.emit();
  }

  /**
   * 確認命名
   */
  onConfirm(): void {
    if (this.isNameValid) {
      this.confirm.emit(this.petName.trim());
      this.hide();
    }
  }
}