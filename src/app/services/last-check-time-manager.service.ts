import { Injectable } from '@angular/core';
import { DirtyTriggerService } from './dirty-trigger.service';
import { LightService } from './light.service';
import { LeavingService } from './leaving.service';
import { TouchEventService } from './touch-event.service';
import { LowHealthTriggerService } from './low-health-trigger.service';
import { LowLikabilityEventService } from './low-likability-event.service';
import { HungerManagerService } from './hunger-manager.service';
import { CustomTimeService } from './custom-time.service';

@Injectable({
  providedIn: 'root'
})
export class LastCheckTimeManagerService {

  constructor(
    private dirtyTriggerService: DirtyTriggerService,
    private lightService: LightService,
    private leavingService: LeavingService,
    private touchEventService: TouchEventService,
    private lowHealthTriggerService: LowHealthTriggerService,
    private lowLikabilityEventService: LowLikabilityEventService,
    private hungerManagerService: HungerManagerService,
    private customTimeService: CustomTimeService
  ) {}

  /**
   * 電子雞孵化時初始化所有上次檢查時間為孵化時間
   */
  initializeAllLastCheckTimes(): void {
    const currentTime = this.customTimeService.formatTime();

    // 設定髒污觸發服務的上次添加髒污時間
    (this.dirtyTriggerService as any).lastAddDirtyTime = currentTime;

    // 設定燈光服務的上次檢查時間
    (this.lightService as any).lastLightCheckTime = currentTime;

    // 設定離家出走服務的上次重置時間
    (this.leavingService as any).lastTimeReset = currentTime;

    // 設定觸摸事件服務的上次重置時間
    (this.touchEventService as any).lastTimeReset = currentTime;

    // 設定低生命值觸發服務的相關時間
    (this.lowHealthTriggerService as any).lastSickCheckTime = currentTime;
    (this.lowHealthTriggerService as any).lastLifeDamageTime = currentTime;
    (this.lowHealthTriggerService as any).lastDiseaseCheckTime = currentTime;

    // 設定低好感度事件服務的上次懲罰時間
    (this.lowLikabilityEventService as any).lastPunishTime = currentTime;

    // 設定飢餓管理服務的上次飢餓時間和飢餓狀態開始時間
    (this.hungerManagerService as any).lastHungerTime = currentTime;
    (this.hungerManagerService as any).hungerStateStartTime = currentTime;

    console.log('已初始化所有服務的上次檢查時間為:', currentTime);
  }

  /**
   * 手動設定所有上次檢查時間（工程師模式用）
   */
  presetAllLastCheckTimes(timeString?: string): void {
    const presetTime = timeString || this.customTimeService.formatTime();

    // 設定髒污觸發服務的上次添加髒污時間
    (this.dirtyTriggerService as any).lastAddDirtyTime = presetTime;

    // 設定燈光服務的上次檢查時間
    (this.lightService as any).lastLightCheckTime = presetTime;

    // 設定離家出走服務的上次重置時間
    (this.leavingService as any).lastTimeReset = presetTime;

    // 設定觸摸事件服務的上次重置時間
    (this.touchEventService as any).lastTimeReset = presetTime;

    // 設定低生命值觸發服務的相關時間
    (this.lowHealthTriggerService as any).lastSickCheckTime = presetTime;
    (this.lowHealthTriggerService as any).lastLifeDamageTime = presetTime;
    (this.lowHealthTriggerService as any).lastDiseaseCheckTime = presetTime;

    // 設定低好感度事件服務的上次懲罰時間
    (this.lowLikabilityEventService as any).lastPunishTime = presetTime;

    // 設定飢餓管理服務的上次飢餓時間和飢餓狀態開始時間
    (this.hungerManagerService as any).lastHungerTime = presetTime;
    (this.hungerManagerService as any).hungerStateStartTime = presetTime;

    // 儲存髒污資料（因為 DirtyTriggerService 有 localStorage）
    this.dirtyTriggerService.saveDirtyData();

    console.log('已手動設定所有服務的上次檢查時間為:', presetTime);
  }

  /**
   * 手動重置所有上次懲罰時間（工程師模式用）
   */
  resetAllLastPunishmentTimes(): void {
    const currentTime = this.customTimeService.formatTime();

    // 重置髒污物件的上次懲罰時間
    this.dirtyTriggerService.dirtyObjects.forEach(dirty => {
      dirty.lastPunishTime = currentTime;
    });
    this.dirtyTriggerService.saveDirtyData();

    // 重置低好感度事件服務的上次懲罰時間
    (this.lowLikabilityEventService as any).lastPunishTime = currentTime;

    // 重置低生命值觸發服務的相關懲罰時間
    (this.lowHealthTriggerService as any).lastLifeDamageTime = currentTime;

    // 重置飢餓管理服務的飢餓狀態開始時間（用於懲罰計算）
    (this.hungerManagerService as any).hungerStateStartTime = currentTime;

    console.log('已重置所有上次懲罰時間為:', currentTime);
  }

  /**
   * 獲取所有上次檢查時間的狀態（附帶中文標籤）
   */
  getAllLastCheckTimesStatus(): { [key: string]: { label: string; value: string | null } } {
    const status: { [key: string]: { label: string; value: string | null } } = {
      'dirtyTrigger_lastAddDirtyTime': {
        label: '髒污觸發 - 上次添加髒污時間',
        value: (this.dirtyTriggerService as any).lastAddDirtyTime
      },
    };

    // 添加每個髒污物件的上次懲罰時間
    console.log('當前髒污物件數量:', this.dirtyTriggerService.dirtyObjects.length);
    console.log('髒污物件詳情:', this.dirtyTriggerService.dirtyObjects);

    this.dirtyTriggerService.dirtyObjects.forEach((dirty, index) => {
      const key = `dirtyObject_${dirty.dirtyNo}_lastPunishTime`;
      const statusItem = {
        label: `髒污物件 ${dirty.dirtyNo} - 上次懲罰時間`,
        value: dirty.lastPunishTime || null
      };
      status[key] = statusItem;
      console.log(`添加髒污物件狀態 ${key}:`, statusItem);
    });

    // 繼續添加其他服務的時間
    Object.assign(status, {
      'light_lastLightCheckTime': {
        label: '燈光服務 - 上次檢查時間',
        value: (this.lightService as any).lastLightCheckTime
      },
      'leaving_lastTimeReset': {
        label: '離家出走服務 - 上次重置時間',
        value: (this.leavingService as any).lastTimeReset
      },
      'touchEvent_lastTimeReset': {
        label: '觸摸事件服務 - 上次重置時間',
        value: (this.touchEventService as any).lastTimeReset
      },
      'lowHealth_lastSickCheckTime': {
        label: '低生命值觸發 - 上次生病檢查時間',
        value: (this.lowHealthTriggerService as any).lastSickCheckTime
      },
      'lowHealth_lastLifeDamageTime': {
        label: '低生命值觸發 - 上次生命傷害時間',
        value: (this.lowHealthTriggerService as any).lastLifeDamageTime
      },
      'lowHealth_lastDiseaseCheckTime': {
        label: '低生命值觸發 - 上次疾病檢查時間',
        value: (this.lowHealthTriggerService as any).lastDiseaseCheckTime
      },
      'lowLikability_lastPunishTime': {
        label: '低好感度事件 - 上次懲罰時間',
        value: (this.lowLikabilityEventService as any).lastPunishTime
      },
      'hunger_lastHungerTime': {
        label: '飢餓管理 - 上次飢餓時間',
        value: (this.hungerManagerService as any).lastHungerTime
      },
      'hunger_hungerStateStartTime': {
        label: '飢餓管理 - 飢餓狀態開始時間（懲罰用）',
        value: (this.hungerManagerService as any).hungerStateStartTime
      }
    });

    return status;
  }
}