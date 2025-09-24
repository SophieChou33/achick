import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LogEntry, LogData } from '../types/log-entry.type';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private static readonly STORAGE_KEY = 'achick_logs';
  private static readonly MAX_ENTRIES = 100; // 最多保留100條日誌

  private logDataSubject = new BehaviorSubject<LogData>(this.loadLogData());

  constructor(private customTimeService: CustomTimeService) {}

  /**
   * 獲取日誌數據的 Observable
   */
  public getLogData$(): Observable<LogData> {
    return this.logDataSubject.asObservable();
  }

  /**
   * 獲取當前日誌數據
   */
  public getCurrentLogData(): LogData {
    return this.logDataSubject.value;
  }

  /**
   * 添加 toastr 日誌
   */
  public addToastrLog(message: string, category: 'success' | 'warning' | 'error' | 'info'): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: this.getWriteTimeString(),
      type: 'toastr',
      category: category,
      message: message
    };

    this.addLogEntry(entry);
  }

  /**
   * 添加 modal 彈窗日誌
   */
  public addModalLog(message: string, title?: string, category: 'info' | 'warning' | 'error' = 'info'): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: this.getWriteTimeString(),
      type: 'modal',
      category: category,
      message: message,
      title: title
    };

    this.addLogEntry(entry);
  }

  /**
   * 添加日誌條目
   */
  private addLogEntry(entry: LogEntry): void {
    const currentData = this.logDataSubject.value;
    let newEntries = [entry, ...currentData.entries];

    // 限制日誌條目數量
    if (newEntries.length > LogService.MAX_ENTRIES) {
      newEntries = newEntries.slice(0, LogService.MAX_ENTRIES);
    }

    const newLogData: LogData = {
      ...currentData,
      entries: newEntries
    };

    this.saveLogData(newLogData);
    this.logDataSubject.next(newLogData);
  }

  /**
   * 清除所有日誌
   */
  public clearLogs(): void {
    const clearedData: LogData = {
      entries: [],
      lastCleared: this.getWriteTimeString()
    };

    this.saveLogData(clearedData);
    this.logDataSubject.next(clearedData);
  }

  /**
   * 清除指定數量的舊日誌
   */
  public clearOldLogs(keepCount: number = 50): void {
    const currentData = this.logDataSubject.value;

    if (currentData.entries.length <= keepCount) {
      return;
    }

    const newLogData: LogData = {
      ...currentData,
      entries: currentData.entries.slice(0, keepCount)
    };

    this.saveLogData(newLogData);
    this.logDataSubject.next(newLogData);
  }

  /**
   * 從 localStorage 載入日誌數據
   */
  private loadLogData(): LogData {
    try {
      const saved = localStorage.getItem(LogService.STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        return {
          entries: parsedData.entries || [],
          lastCleared: parsedData.lastCleared
        };
      }
    } catch (error) {
      console.error('Failed to load log data:', error);
    }

    return {
      entries: [],
      lastCleared: undefined
    };
  }

  /**
   * 保存日誌數據到 localStorage
   */
  private saveLogData(logData: LogData): void {
    try {
      localStorage.setItem(LogService.STORAGE_KEY, JSON.stringify(logData));
    } catch (error) {
      console.error('Failed to save log data:', error);
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 獲取日誌條目總數
   */
  public getLogCount(): number {
    return this.logDataSubject.value.entries.length;
  }

  /**
   * 根據類型過濾日誌
   */
  public getLogsByType(type: 'toastr' | 'modal'): LogEntry[] {
    return this.logDataSubject.value.entries.filter(entry => entry.type === type);
  }

  /**
   * 根據分類過濾日誌
   */
  public getLogsByCategory(category: 'success' | 'warning' | 'error' | 'info'): LogEntry[] {
    return this.logDataSubject.value.entries.filter(entry => entry.category === category);
  }

  /**
   * 獲取寫入日誌時的時間字串（若有自訂時間則使用自訂時間，否則使用真實時間）
   * 格式：yyyy/mm/dd HH:mm:ss
   */
  private getWriteTimeString(): string {
    // 使用 CustomTimeService.formatTime() 來獲取當前時間
    // 這會根據是否有設定自訂時間來返回適當的時間
    return this.customTimeService.formatTime();
  }
}