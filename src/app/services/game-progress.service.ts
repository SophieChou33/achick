import { Injectable } from '@angular/core';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';
import { StateDataService } from '../data/state-data';
import { UserInventoryService } from '../data/user-inventory-data';
import { DirtyTriggerService } from './dirty-trigger.service';

export interface GameProgress {
  version: string;
  timestamp: string;
  petStats: any;
  userData: any;
  stateData: any;
  inventory: any;
  dirtyData: any;
}

@Injectable({
  providedIn: 'root'
})
export class GameProgressService {

  constructor(private dirtyTriggerService: DirtyTriggerService) { }

  /**
   * 匯出遊戲進度（包含物件位置）
   */
  exportGameProgress(): string {
    const gameProgress: GameProgress = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      petStats: PetStatsService.loadPetStats(),
      userData: UserDataService.loadUserData(),
      stateData: StateDataService.loadStateData(), // 包含角色和床的位置
      inventory: UserInventoryService.loadUserInventory(),
      dirtyData: this.dirtyTriggerService.exportDirtyData() // 包含髒污物件狀態
    };

    return JSON.stringify(gameProgress, null, 2);
  }

  /**
   * 匯入遊戲進度（包含物件位置）
   */
  importGameProgress(jsonData: string): { success: boolean; message: string } {
    try {
      const gameProgress: GameProgress = JSON.parse(jsonData);

      // 驗證資料格式
      if (!gameProgress.version || !gameProgress.petStats || !gameProgress.userData ||
          !gameProgress.stateData || !gameProgress.inventory) {
        return { success: false, message: '無效的遊戲進度格式' };
      }

      // 恢復所有資料
      if (gameProgress.petStats) {
        PetStatsService.savePetStats(gameProgress.petStats);
      }

      if (gameProgress.userData) {
        UserDataService.saveUserData(gameProgress.userData);
      }

      if (gameProgress.stateData) {
        StateDataService.saveStateData(gameProgress.stateData);
      }

      if (gameProgress.inventory) {
        UserInventoryService.saveUserInventory(gameProgress.inventory);
      }

      if (gameProgress.dirtyData) {
        this.dirtyTriggerService.loadDirtyDataFromObject(gameProgress.dirtyData);
      }

      return { success: true, message: '遊戲進度匯入成功' };

    } catch (error) {
      console.error('Failed to import game progress:', error);
      return { success: false, message: '匯入失敗：資料格式錯誤' };
    }
  }

  /**
   * 下載遊戲進度檔案
   */
  downloadGameProgress(): void {
    const gameProgressJson = this.exportGameProgress();
    const blob = new Blob([gameProgressJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `achick_progress_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * 從檔案讀取遊戲進度
   */
  readGameProgressFromFile(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonData = event.target?.result as string;
          const result = this.importGameProgress(jsonData);
          resolve(result);
        } catch (error) {
          resolve({ success: false, message: '檔案讀取失敗' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, message: '檔案讀取錯誤' });
      };

      reader.readAsText(file);
    });
  }
}