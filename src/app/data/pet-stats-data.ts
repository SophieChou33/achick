import { PetStats } from '../types/pet-stats.type';
import { BehaviorSubject, Observable } from 'rxjs';

export const defaultPetStats: PetStats = {
  rare: null,
  lifeCycle: null,
  breedName: null,
  name: 'Achick',
  currentHealth: 80,
  currentHunger: 60,
  maxHunger: 100,
  maxHealth: 100,
  hungerSpeed: 1,
  currentFriendship: 75,
  maxFriendship: 100,
  currentWellness: 90,
  maxWellness: 100,
  timeStopping: false,
  isLeaving: false,
  isFreezing: false
};

export class PetStatsService {
  private static readonly STORAGE_KEY = 'achick_pet_stats';
  private static petStatsSubject = new BehaviorSubject<PetStats>(PetStatsService.loadPetStatsFromStorage());

  private static loadPetStatsFromStorage(): PetStats {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsedStats = JSON.parse(saved);
        // 只填補缺失的屬性，不覆蓋已存在的值
        const mergedStats: PetStats = { ...defaultPetStats };
        Object.keys(parsedStats).forEach(key => {
          if (key in mergedStats) {
            (mergedStats as any)[key] = parsedStats[key];
          }
        });
        return mergedStats;
      } catch (error) {
        console.error('Failed to parse pet stats:', error);
      }
    }
    return { ...defaultPetStats };
  }

  static loadPetStats(): PetStats {
    return this.petStatsSubject.value;
  }

  static getPetStats$(): Observable<PetStats> {
    return this.petStatsSubject.asObservable();
  }

  static savePetStats(stats: PetStats): void {
    try {
      // 應用數值邊界檢查
      const validatedStats = this.validateStatsLimits(stats);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validatedStats));
      this.petStatsSubject.next(validatedStats); // 通知所有訂閱者
    } catch (error) {
      console.error('Failed to save pet stats:', error);
    }
  }

  static updatePetStats(updates: Partial<PetStats>, currentStats?: PetStats): PetStats {
    const current = currentStats || this.petStatsSubject.value;
    const updatedStats = { ...current, ...updates };
    this.savePetStats(updatedStats);
    return updatedStats;
  }

  static resetPetStats(): PetStats {
    const resetStats = { ...defaultPetStats };
    this.savePetStats(resetStats);
    return resetStats;
  }

  static initializeNewPet(name: string, rare: PetStats['rare'], lifeCycle: PetStats['lifeCycle'], breedName?: string): PetStats {
    const newPetStats: PetStats = {
      ...defaultPetStats,
      name,
      rare,
      lifeCycle,
      breedName: breedName || null,
      currentHealth: 100,
      maxHealth: 100,
      currentHunger: 80,
      hungerSpeed: 1,
      currentFriendship: 50,
      currentWellness: 100
    };
    this.savePetStats(newPetStats);
    return newPetStats;
  }

  static isPetAlive(stats: PetStats): boolean {
    return stats.lifeCycle !== 'DEAD' && stats.currentHealth > 0;
  }

  static isPetHungry(stats: PetStats): boolean {
    return stats.currentHunger < 30;
  }

  static isPetSick(stats: PetStats): boolean {
    return stats.currentWellness < 50;
  }

  static getOverallCondition(stats: PetStats): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (!this.isPetAlive(stats)) return 'critical';

    const avgCondition = (stats.currentHealth + stats.currentHunger + stats.currentWellness + stats.currentFriendship) / 4;

    if (avgCondition >= 80) return 'excellent';
    if (avgCondition >= 60) return 'good';
    if (avgCondition >= 40) return 'fair';
    if (avgCondition >= 20) return 'poor';
    return 'critical';
  }

  /**
   * 驗證並修正電子雞數值邊界
   */
  static validateStatsLimits(stats: PetStats): PetStats {
    const validatedStats = { ...stats };

    // 當前好感度：0-100
    validatedStats.currentFriendship = Math.max(0, Math.min(100, stats.currentFriendship));

    // 當前生命值：0-最大生命值
    validatedStats.currentHealth = Math.max(0, Math.min(stats.maxHealth, stats.currentHealth));

    // 當前飢餓度：0-100
    validatedStats.currentHunger = Math.max(0, Math.min(100, stats.currentHunger));

    // 當前健康度：0-100
    validatedStats.currentWellness = Math.max(0, Math.min(100, stats.currentWellness));

    return validatedStats;
  }
}