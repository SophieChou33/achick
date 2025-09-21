import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomTimeService {
  private static readonly STORAGE_KEY = 'achick_custom_time_settings';

  private isCustomTimeEnabledSubject = new BehaviorSubject<boolean>(false);
  private customTimeSubject = new BehaviorSubject<Date>(new Date());

  // 當自定義時間啟用時，用於計算時間偏移
  private customTimeOffset = 0; // 與實際時間的偏移量（毫秒）
  private customTimeBaseTime = Date.now(); // 設定自定義時間時的基準實際時間

  constructor() {
    this.loadSettings();
  }

  /**
   * 載入設定
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(CustomTimeService.STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        this.isCustomTimeEnabledSubject.next(settings.isEnabled || false);
        if (settings.customTime) {
          const customTime = new Date(settings.customTime);
          this.setCustomTime(customTime, false); // 不儲存，避免循環
        }
      }
    } catch (error) {
      console.error('Failed to load custom time settings:', error);
    }
  }

  /**
   * 儲存設定
   */
  private saveSettings(): void {
    try {
      const settings = {
        isEnabled: this.isCustomTimeEnabledSubject.value,
        customTime: this.customTimeSubject.value.toISOString(),
        customTimeOffset: this.customTimeOffset,
        customTimeBaseTime: this.customTimeBaseTime
      };
      localStorage.setItem(CustomTimeService.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save custom time settings:', error);
    }
  }

  /**
   * 獲取當前時間（考慮自定義時間設定）
   */
  getCurrentTime(): Date {
    if (this.isCustomTimeEnabledSubject.value) {
      // 計算自設定自定義時間以來經過的實際時間
      const realTimeElapsed = Date.now() - this.customTimeBaseTime;
      // 將經過的時間加到自定義時間上
      return new Date(this.customTimeSubject.value.getTime() + realTimeElapsed);
    }
    return new Date();
  }

  /**
   * 獲取當前時間戳（考慮自定義時間設定）
   */
  getCurrentTimestamp(): number {
    return this.getCurrentTime().getTime();
  }

  /**
   * 設定自定義時間
   */
  setCustomTime(time: Date, save: boolean = true): void {
    this.customTimeSubject.next(new Date(time));
    this.customTimeBaseTime = Date.now();
    this.customTimeOffset = time.getTime() - this.customTimeBaseTime;

    if (save) {
      this.saveSettings();
    }
  }

  /**
   * 啟用/停用自定義時間
   */
  setCustomTimeEnabled(enabled: boolean): void {
    this.isCustomTimeEnabledSubject.next(enabled);
    if (!enabled) {
      // 停用時重置為當前實際時間
      this.resetToRealTime();
    }
    this.saveSettings();
  }

  /**
   * 重置為實際時間
   */
  resetToRealTime(): void {
    const now = new Date();
    this.customTimeSubject.next(now);
    this.customTimeBaseTime = Date.now();
    this.customTimeOffset = 0;
    this.saveSettings();
  }

  /**
   * 獲取自定義時間啟用狀態
   */
  isCustomTimeEnabled(): boolean {
    return this.isCustomTimeEnabledSubject.value;
  }

  /**
   * 訂閱自定義時間啟用狀態變化
   */
  getCustomTimeEnabled$(): Observable<boolean> {
    return this.isCustomTimeEnabledSubject.asObservable();
  }

  /**
   * 訂閱自定義時間變化
   */
  getCustomTime$(): Observable<Date> {
    return this.customTimeSubject.asObservable();
  }

  /**
   * 格式化時間字串（考慮自定義時間）
   */
  formatTime(format: 'yyyy/mm/dd HH:mm:ss' | 'yyyy/mm/dd' | 'HH:mm:ss' = 'yyyy/mm/dd HH:mm:ss'): string {
    const time = this.getCurrentTime();
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'yyyy/mm/dd':
        return `${year}/${month}/${day}`;
      case 'HH:mm:ss':
        return `${hours}:${minutes}:${seconds}`;
      default:
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
  }

  /**
   * 工程師模式專用：強制重置為實際時間（用於電子雞孵化時）
   */
  forceResetToRealTime(): void {
    this.setCustomTimeEnabled(false);
    this.resetToRealTime();
  }
}