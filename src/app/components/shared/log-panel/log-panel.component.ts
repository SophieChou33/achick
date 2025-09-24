import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LogService } from '../../../services/log.service';
import { LogEntry, LogData } from '../../../types/log-entry.type';

@Component({
  selector: 'app-log-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="log-panel"
         [class.expanded]="isExpanded"
         #logPanel
         (mousedown)="onDragStart($event)"
         [style.left.px]="position.x"
         [style.bottom.px]="position.y">
      <div class="log-header"
           (click)="onHeaderClick($event)"
           (mousedown)="onHeaderMouseDown($event)">
        <span class="log-title">日誌 ({{ logCount }})</span>
        <span class="toggle-icon" [class.rotated]="isExpanded">▲</span>
      </div>

      <div class="log-content"
           *ngIf="isExpanded"
           [class.show-content]="showContent">
        <div class="log-controls">
          <button class="clear-btn" (click)="clearLogs()" *ngIf="logCount > 0">
            清除日誌
          </button>
          <div class="log-filters">
            <button
              class="filter-btn"
              [class.active]="selectedFilter === 'all'"
              (click)="setFilter('all')">
              全部
            </button>
            <button
              class="filter-btn filter-success"
              [class.active]="selectedFilter === 'success'"
              (click)="setFilter('success')">
              成功
            </button>
            <button
              class="filter-btn filter-info"
              [class.active]="selectedFilter === 'info'"
              (click)="setFilter('info')">
              資訊
            </button>
            <button
              class="filter-btn filter-warning"
              [class.active]="selectedFilter === 'warning'"
              (click)="setFilter('warning')">
              警告
            </button>
            <button
              class="filter-btn filter-error"
              [class.active]="selectedFilter === 'error'"
              (click)="setFilter('error')">
              扣值
            </button>
          </div>
        </div>

        <div class="log-entries" *ngIf="filteredEntries.length > 0; else noLogs">
          <div
            *ngFor="let entry of filteredEntries; trackBy: trackByLogId"
            class="log-entry"
            [ngClass]="'log-' + entry.category">
            <div class="log-time">{{ formatTime(entry.timestamp) }}</div>
            <div class="log-content-text">
              <div class="log-type-badge" [ngClass]="'badge-' + entry.type">
                {{ entry.type === 'toastr' ? 'T' : 'M' }}
              </div>
              <div class="log-message">
                <div *ngIf="entry.title" class="log-title-text">{{ entry.title }}</div>
                <div class="log-message-text">{{ entry.message }}</div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noLogs>
          <div class="no-logs">
            <div *ngIf="selectedFilter === 'all'; else noFilteredLogs">
              尚無日誌記錄
            </div>
            <ng-template #noFilteredLogs>
              <div>沒有符合篩選條件的日誌</div>
            </ng-template>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .log-panel {
      position: fixed;
      width: 100px;
      min-width: 100px;
      max-height: 40px;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      z-index: 1500;
      transition: all 0.3s ease;
      cursor: move;
    }

    .log-panel.expanded {
      width: 400px;
      max-height: 50dvh;
    }

    .log-panel.dragging {
      cursor: grabbing;
      transition: none;
    }

    .log-header {
      padding: 10px 15px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      user-select: none;
    }

    .log-panel.expanded .log-header {
      border-radius: 10px 10px 0 0;
    }

    .log-header:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .log-title {
      font-weight: 600;
      font-size: 13px;
    }

    .toggle-icon {
      transition: transform 0.3s ease;
      font-size: 10px;
    }

    .toggle-icon.rotated {
      transform: rotate(180deg);
    }

    .log-content {
      max-height: calc(50dvh - 50px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .log-content.show-content {
      opacity: 1;
    }

    .log-controls {
      padding: 10px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
    }

    .clear-btn {
      background: rgba(255, 100, 100, 0.2);
      color: white;
      border: 1px solid rgba(255, 100, 100, 0.3);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s ease;
    }

    .clear-btn:hover {
      background: rgba(255, 100, 100, 0.3);
      border-color: rgba(255, 100, 100, 0.5);
    }

    .log-filters {
      display: flex;
      gap: 3px;
    }

    .filter-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 3px 6px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      transition: all 0.2s ease;
    }

    .filter-btn:hover,
    .filter-btn.active {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .filter-success.active { background: rgba(76, 175, 80, 0.3); }
    .filter-info.active { background: rgba(33, 150, 243, 0.3); }
    .filter-warning.active { background: rgba(255, 152, 0, 0.3); }
    .filter-error.active { background: rgba(244, 67, 54, 0.3); }

    .log-entries {
      flex: 1;
      overflow-y: auto;
      max-height: calc(50dvh - 120px);
      padding: 5px;
    }

    .log-entries::-webkit-scrollbar {
      width: 6px;
    }

    .log-entries::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .log-entries::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .log-entries::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    .log-entry {
      margin-bottom: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      border-left: 3px solid;
      background: rgba(255, 255, 255, 0.05);
    }

    .log-success { border-left-color: #4CAF50; }
    .log-info { border-left-color: #2196F3; }
    .log-warning { border-left-color: #FF9800; }
    .log-error { border-left-color: #F44336; }

    .log-time {
      font-size: 10px;
      opacity: 0.7;
      margin-bottom: 4px;
    }

    .log-content-text {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .log-type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .badge-toastr {
      background: rgba(33, 150, 243, 0.8);
      color: white;
    }

    .badge-modal {
      background: rgba(156, 39, 176, 0.8);
      color: white;
    }

    .log-message {
      flex: 1;
      line-height: 1.4;
    }

    .log-title-text {
      font-weight: 600;
      margin-bottom: 2px;
      color: rgba(255, 255, 255, 0.9);
    }

    .log-message-text {
      color: rgba(255, 255, 255, 0.8);
      word-break: break-word;
    }

    .no-logs {
      padding: 20px;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-style: italic;
    }

    @media (max-width: 768px) {
      .log-panel {
        width: 100%;
        max-width: 100%;
      }

      .log-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .log-filters {
        justify-content: center;
      }
    }
  `]
})
export class LogPanelComponent implements OnInit, OnDestroy {
  @ViewChild('logPanel', { static: true }) logPanel!: ElementRef<HTMLDivElement>;

  isExpanded = false;
  isAnimating = false; // 動畫執行狀態
  showContent = false; // 內容顯示狀態

  // 拖拽與點擊區分
  private headerMouseDownTime = 0;
  logData: LogData = { entries: [] };
  logCount = 0;
  selectedFilter: 'all' | 'success' | 'info' | 'warning' | 'error' = 'all';
  filteredEntries: LogEntry[] = [];

  // 拖拽相關屬性
  position = { x: 20, y: 100 }; // 預設位置（上移80px）
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  private logSubscription?: Subscription;

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    // 訂閱日誌數據變化
    this.logSubscription = this.logService.getLogData$().subscribe(logData => {
      this.logData = logData;
      this.logCount = logData.entries.length;
      this.updateFilteredEntries();
    });

    // 添加全域事件監聽器用於拖拽
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  ngOnDestroy(): void {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }

    // 移除全域事件監聽器
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }

  togglePanel(): void {
    if (this.isAnimating) return; // 防止動畫執行中重複點擊

    if (this.isExpanded) {
      // 關閉動畫：先淡出內容
      this.closePanel();
    } else {
      // 展開動畫：先展開面板
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.isAnimating = true;
    this.isExpanded = true;

    // 等待展開動畫結束後再顯示內容
    setTimeout(() => {
      this.showContent = true;
      this.isAnimating = false;
    }, 300); // 與 CSS transition 時間同步
  }

  private closePanel(): void {
    this.isAnimating = true;
    this.showContent = false; // 先隱藏內容

    // 等待內容淡出動畫結束後再收合面板
    setTimeout(() => {
      this.isExpanded = false;
      this.isAnimating = false;
    }, 200); // 內容淡出時間
  }

  clearLogs(): void {
    this.logService.clearLogs();
  }

  setFilter(filter: 'all' | 'success' | 'info' | 'warning' | 'error'): void {
    this.selectedFilter = filter;
    this.updateFilteredEntries();
  }

  private updateFilteredEntries(): void {
    if (this.selectedFilter === 'all') {
      this.filteredEntries = this.logData.entries;
    } else {
      this.filteredEntries = this.logData.entries.filter(entry => entry.category === this.selectedFilter);
    }
  }

  formatTime(timestamp: string): string {
    // 將 yyyy/mm/dd HH:mm:ss 格式化為更簡潔的顯示
    const parts = timestamp.split(' ');
    if (parts.length === 2) {
      const datePart = parts[0].split('/');
      const timePart = parts[1];

      if (datePart.length === 3) {
        // 只顯示 mm/dd HH:mm
        return `${datePart[1]}/${datePart[2]} ${timePart.substring(0, 5)}`;
      }
    }
    return timestamp;
  }

  trackByLogId(_index: number, entry: LogEntry): string {
    return entry.id;
  }

  // 拖拽相關方法
  onHeaderMouseDown(_event: MouseEvent): void {
    this.headerMouseDownTime = Date.now();
  }

  onHeaderClick(event: MouseEvent): void {
    // 如果拖拽時間超過200ms，視為拖拽而非點擊
    const clickDuration = Date.now() - this.headerMouseDownTime;
    if (clickDuration < 200 && !this.isDragging) {
      this.togglePanel();
    }
    event.stopPropagation();
  }

  onDragStart(event: MouseEvent): void {
    // 無論是否展開，都允許從任何位置開始拖拽
    this.isDragging = true;
    this.logPanel.nativeElement.classList.add('dragging');

    const rect = this.logPanel.nativeElement.getBoundingClientRect();
    this.dragOffset.x = event.clientX - rect.left;
    this.dragOffset.y = event.clientY - rect.top;

    event.preventDefault();
    event.stopPropagation(); // 防止觸發其他事件
  }

  onDragMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const newX = event.clientX - this.dragOffset.x;
    const newY = window.innerHeight - event.clientY + this.dragOffset.y - this.logPanel.nativeElement.offsetHeight;

    // 邊界檢查
    const panelWidth = this.logPanel.nativeElement.offsetWidth;
    const panelHeight = this.logPanel.nativeElement.offsetHeight;

    this.position.x = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
    this.position.y = Math.max(0, Math.min(newY, window.innerHeight - panelHeight));

    event.preventDefault();
  }

  onDragEnd(_event: MouseEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.logPanel.nativeElement.classList.remove('dragging');

    // 重置拖拽相關狀態
    setTimeout(() => {
      this.headerMouseDownTime = 0;
    }, 10); // 短暫延遲確保點擊事件處理完成
  }
}
