import { UserData, PetRecord } from '../types/user-data.type';

export const defaultUserData: UserData = {
  coins: 0,
  totalPetsRaised: 0,
  petHistory: []
};

export class UserDataService {
  private static readonly STORAGE_KEY = 'achick_user_data';

  static loadUserData(): UserData {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultUserData, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    return { ...defaultUserData };
  }

  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  static updateUserData(updates: Partial<UserData>, currentData: UserData): UserData {
    const updatedData = { ...currentData, ...updates };
    this.saveUserData(updatedData);
    return updatedData;
  }

  static addCoins(amount: number, currentData: UserData): UserData {
    const updatedData = {
      ...currentData,
      coins: Math.max(0, currentData.coins + amount)
    };
    this.saveUserData(updatedData);
    return updatedData;
  }

  static spendCoins(amount: number, currentData: UserData): { success: boolean; data: UserData } {
    if (currentData.coins >= amount) {
      const updatedData = {
        ...currentData,
        coins: currentData.coins - amount
      };
      this.saveUserData(updatedData);
      return { success: true, data: updatedData };
    }
    return { success: false, data: currentData };
  }

  static addPetRecord(petRecord: PetRecord, currentData: UserData): UserData {
    const updatedData = {
      ...currentData,
      totalPetsRaised: currentData.totalPetsRaised + 1,
      petHistory: [...currentData.petHistory, petRecord]
    };
    this.saveUserData(updatedData);
    return updatedData;
  }

  static updatePetRecord(index: number, updates: Partial<PetRecord>, currentData: UserData): UserData {
    if (index >= 0 && index < currentData.petHistory.length) {
      const updatedHistory = [...currentData.petHistory];
      updatedHistory[index] = { ...updatedHistory[index], ...updates };

      const updatedData = {
        ...currentData,
        petHistory: updatedHistory
      };
      this.saveUserData(updatedData);
      return updatedData;
    }
    return currentData;
  }

  static getCurrentPetRecord(currentData: UserData): PetRecord | null {
    if (currentData.petHistory.length === 0) return null;
    const lastRecord = currentData.petHistory[currentData.petHistory.length - 1];
    // 如果最後一隻寵物還沒死亡，就是當前寵物
    return lastRecord.deathTime === null ? lastRecord : null;
  }

  static resetUserData(): UserData {
    const resetData = { ...defaultUserData };
    this.saveUserData(resetData);
    return resetData;
  }

  static formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  static createNewPetRecord(petName: string): PetRecord {
    return {
      petName,
      birthTime: this.formatDateTime(new Date()),
      evolutionTime: null,
      deathTime: null
    };
  }
}