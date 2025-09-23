import { Injectable } from '@angular/core';
import { DirtyTriggerService } from './dirty-trigger.service';
import { LightService } from './light.service';
import { LeavingService } from './leaving.service';
import { TouchEventService } from './touch-event.service';
import { WellnessCheckService } from './wellness-check.service';
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
    private wellnessCheckService: WellnessCheckService,
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

    // 設定觸摸事件服務：初始化為全新狀態
    (this.touchEventService as any).lastTimeReset = null;  // 新電子雞沒有重置記錄
    (this.touchEventService as any).touchedTimes = 0;      // 重置撫摸次數
    (this.touchEventService as any).isCanTouch = true;     // 允許撫摸

    // 設定健康度檢查服務的相關時間
    (this.wellnessCheckService as any).lastSickCheckTime = currentTime;
    (this.wellnessCheckService as any).lastLifeDamageTime = currentTime;
    (this.wellnessCheckService as any).lastDiseaseCheckTime = currentTime;

    // 設定低好感度事件服務的上次懲罰時間
    (this.lowLikabilityEventService as any).lastPunishTime = currentTime;

    // 設定飢餓管理服務的上次飢餓時間、飢餓狀態開始時間和上次懲罰時間
    (this.hungerManagerService as any).lastHungerTime = currentTime;
    (this.hungerManagerService as any).hungerStateStartTime = currentTime;
    (this.hungerManagerService as any).lastHungerPenaltyTime = currentTime;

    // 強制觸發所有服務的保存方法
    this.forceUpdateAllLastCheckTimes();

    console.log('已初始化所有服務的上次檢查時間為:', currentTime);
  }

  /**
   * 強制觸發所有服務保存其時間數據
   */
  private forceUpdateAllLastCheckTimes(): void {
    // 觸發各服務的保存方法
    (this.dirtyTriggerService as any).saveDirtyData?.();
    (this.lightService as any).saveLightTimes?.();
    (this.leavingService as any).saveLeavingTimes?.();
    (this.touchEventService as any).saveTouchData?.();
    (this.wellnessCheckService as any).saveWellnessTimes?.();
    (this.lowLikabilityEventService as any).saveLowLikabilityTimes?.();
    (this.hungerManagerService as any).saveHungerTimes?.();
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

    // 設定觸摸事件服務的上次重置時間（工程師模式預設）
    (this.touchEventService as any).lastTimeReset = presetTime;

    // 設定健康度檢查服務的相關時間
    (this.wellnessCheckService as any).lastSickCheckTime = presetTime;
    (this.wellnessCheckService as any).lastLifeDamageTime = presetTime;
    (this.wellnessCheckService as any).lastDiseaseCheckTime = presetTime;

    // 設定低好感度事件服務的上次懲罰時間
    (this.lowLikabilityEventService as any).lastPunishTime = presetTime;

    // 設定飢餓管理服務的上次飢餓時間、飢餓狀態開始時間和上次懲罰時間
    (this.hungerManagerService as any).lastHungerTime = presetTime;
    (this.hungerManagerService as any).hungerStateStartTime = presetTime;
    (this.hungerManagerService as any).lastHungerPenaltyTime = presetTime;

    // 強制觸發所有服務的保存方法
    this.forceUpdateAllLastCheckTimes();

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

    // 重置健康度檢查服務的相關懲罰時間
    (this.wellnessCheckService as any).lastLifeDamageTime = currentTime;

    // 重置飢餓管理服務的飢餓狀態開始時間（用於懲罰計算）
    (this.hungerManagerService as any).hungerStateStartTime = currentTime;

    // 重置飢餓管理服務的上次懲罰時間
    (this.hungerManagerService as any).lastHungerPenaltyTime = currentTime;

    // 強制觸發所有服務的保存方法
    this.forceUpdateAllLastCheckTimes();

    console.log('已重置所有上次懲罰時間為:', currentTime);
  }

  /**
   * 重置所有上次檢查時間為 null（電子雞重置時使用）
   */
  resetAllLastCheckTimesToNull(): void {
    // 重置髒污觸發服務的上次添加髒污時間
    (this.dirtyTriggerService as any).lastAddDirtyTime = null;

    // 重置燈光服務的上次檢查時間
    (this.lightService as any).lastLightCheckTime = null;

    // 重置離家出走服務的上次重置時間
    (this.leavingService as any).lastTimeReset = null;

    // 重置觸摸事件服務：完全清空狀態
    (this.touchEventService as any).lastTimeReset = null;
    (this.touchEventService as any).touchedTimes = 0;
    (this.touchEventService as any).isCanTouch = true;

    // 重置健康度檢查服務的相關時間
    (this.wellnessCheckService as any).lastSickCheckTime = null;
    (this.wellnessCheckService as any).lastLifeDamageTime = null;
    (this.wellnessCheckService as any).lastDiseaseCheckTime = null;

    // 重置低好感度事件服務的上次懲罰時間
    (this.lowLikabilityEventService as any).lastPunishTime = null;

    // 重置飢餓管理服務的上次飢餓時間、飢餓狀態開始時間和上次懲罰時間
    (this.hungerManagerService as any).lastHungerTime = null;
    (this.hungerManagerService as any).hungerStateStartTime = null;
    (this.hungerManagerService as any).lastHungerPenaltyTime = null;

    // 清空所有髒污物件的上次懲罰時間
    this.dirtyTriggerService.dirtyObjects.forEach(dirty => {
      delete dirty.lastPunishTime;
    });

    // 強制觸發所有服務的保存方法
    this.forceUpdateAllLastCheckTimes();

    console.log('已重置所有服務的上次檢查時間為 null');
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
      'wellness_lastSickCheckTime': {
        label: '健康度檢查 - 上次生病檢查時間',
        value: (this.wellnessCheckService as any).lastSickCheckTime
      },
      'wellness_lastLifeDamageTime': {
        label: '健康度檢查 - 上次生命傷害時間',
        value: (this.wellnessCheckService as any).lastLifeDamageTime
      },
      'wellness_lastDiseaseCheckTime': {
        label: '健康度檢查 - 上次疾病檢查時間',
        value: (this.wellnessCheckService as any).lastDiseaseCheckTime
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
        label: '飢餓管理 - 飢餓狀態開始時間',
        value: (this.hungerManagerService as any).hungerStateStartTime
      },
      'hunger_lastHungerPenaltyTime': {
        label: '飢餓管理 - 上次懲罰時間',
        value: (this.hungerManagerService as any).lastHungerPenaltyTime
      }
    });

    return status;
  }
}