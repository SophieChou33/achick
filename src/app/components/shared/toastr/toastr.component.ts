import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

export interface ToastrMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  removing?: boolean;
}

@Component({
  selector: 'app-toastr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toastr-container" [class.status-expanded]="isStatusExpanded">
      <div
        *ngFor="let toast of messages"
        class="toast"
        [class]="'toast-' + toast.type"
        [class.removing]="toast.removing"
      >
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [`
    .toastr-container {
      position: fixed;
      bottom: 120px;
      right: 35px;
      z-index: 2000;
      pointer-events: none;
      transition: bottom 0.3s ease, right 0.3s ease;
    }

    .toastr-container.status-expanded {
      bottom: 420px;
      right: 15px;
    }

    .toast {
      background: rgba(32, 30, 30, 0.75);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      color: white;
      padding: 12px 16px;
      margin-bottom: 8px;
      font-size: 14px;
      min-width: 200px;
      max-width: 300px;
      pointer-events: auto;
      animation: slideInRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .toast.removing {
      animation: slideOutRight 0.8s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
    }

    .toast:last-child {
      margin-bottom: 0;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(120%);
        opacity: 0;
        scale: 0.8;
      }
      to {
        transform: translateX(0);
        opacity: 1;
        scale: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
        scale: 1;
      }
      to {
        transform: translateX(120%);
        opacity: 0;
        scale: 0.8;
      }
    }
  `]
})
export class ToastrComponent implements OnInit, OnDestroy {
  messages: ToastrMessage[] = [];
  isStatusExpanded = false;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // 訂閱狀態面板展開狀態
    ToastrService.getStatusExpanded$().pipe(
      takeUntil(this.destroy$)
    ).subscribe(expanded => {
      this.isStatusExpanded = expanded;
    });

    // 訂閱 toastr 訊息
    ToastrService.getMessages$().pipe(
      takeUntil(this.destroy$)
    ).subscribe(messages => {
      this.messages = messages;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

export class ToastrService {
  private static messagesSubject = new BehaviorSubject<ToastrMessage[]>([]);
  private static statusExpandedSubject = new BehaviorSubject<boolean>(false);
  private static messageCounter = 0;

  static getMessages$() {
    return this.messagesSubject.asObservable();
  }

  static getStatusExpanded$() {
    return this.statusExpandedSubject.asObservable();
  }

  static setStatusExpanded(expanded: boolean) {
    this.statusExpandedSubject.next(expanded);
  }

  static show(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 5000) {
    const toast: ToastrMessage = {
      id: `toast-${++this.messageCounter}`,
      message,
      type,
      duration
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, toast]);

    // 自動移除
    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  static success(message: string, duration: number = 3000) {
    this.show(message, 'success', duration);
  }

  static error(message: string, duration: number = 4000) {
    this.show(message, 'error', duration);
  }

  static warning(message: string, duration: number = 3000) {
    this.show(message, 'warning', duration);
  }

  static info(message: string, duration: number = 3000) {
    this.show(message, 'info', duration);
  }

  private static remove(id: string) {
    // 先標記為移除中，觸發移除動畫
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = currentMessages.map(msg =>
      msg.id === id ? { ...msg, removing: true } : msg
    );
    this.messagesSubject.next(updatedMessages);

    // 等待動畫完成後再真正移除
    setTimeout(() => {
      const finalMessages = this.messagesSubject.value;
      this.messagesSubject.next(finalMessages.filter(msg => msg.id !== id));
    }, 800); // 與動畫時間一致
  }
}
