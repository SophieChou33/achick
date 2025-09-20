import { PetStats } from '../types/pet-stats.type';

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
  isDead: false,
  isLeaving: false
};

export class PetStatsService {
  private static readonly STORAGE_KEY = 'achick_pet_stats';

  static loadPetStats(): PetStats {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultPetStats, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to parse pet stats:', error);
      }
    }
    return { ...defaultPetStats };
  }

  static savePetStats(stats: PetStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save pet stats:', error);
    }
  }

  static updatePetStats(updates: Partial<PetStats>, currentStats: PetStats): PetStats {
    const updatedStats = { ...currentStats, ...updates };
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
    return !stats.isDead && stats.currentHealth > 0;
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
}