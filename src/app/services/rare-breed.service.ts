import { Injectable } from '@angular/core';
import { getBreedsByRare } from '../data/breed-data';
import { PetStats } from '../types/pet-stats.type';
import { PetStatsService } from '../data/pet-stats-data';
import { UserDataService } from '../data/user-data';

@Injectable({
  providedIn: 'root'
})
export class RareBreedService {
  private rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL' | null = null;
  private breed: string | null = null;

  constructor() {}

  /**
   * 於電子雞出生時隨機抽取稀有度
   * 稀有度機率：bad: 15%, normal: 70%, special: 10%, superSpecial: 5%
   */
  private generateRare(): void {
    const random = Math.random() * 100;

    if (random < 15) {
      this.rare = 'BAD';
    } else if (random < 85) { // 15 + 70 = 85
      this.rare = 'NORMAL';
    } else if (random < 95) { // 85 + 10 = 95
      this.rare = 'SPECIAL';
    } else {
      this.rare = 'SUPER_SPECIAL';
    }
  }

  /**
   * 於稀有度抽取完畢後，以 map 方法，將『品種資料物件』中 .rare 符合 service 中 rare 變數的物件整理出來，
   * 並且從中隨機選擇 .breedName，並將結果字串保留到此 service 的 breed 變數
   */
  private selectBreed(): void {
    if (!this.rare) return;

    const availableBreeds = getBreedsByRare(this.rare);

    if (availableBreeds.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableBreeds.length);
    const selectedBreed = availableBreeds[randomIndex];

    this.breed = selectedBreed.breed;
  }

  /**
   * 計算稀有度對應的孵化獎勵金幣
   */
  private getHatchingCoins(rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): number {
    switch (rare) {
      case 'BAD': return 5;
      case 'NORMAL': return 10;
      case 'SPECIAL': return 30;
      case 'SUPER_SPECIAL': return 80;
      default: return 0;
    }
  }

  /**
   * 計算稀有度對應的生命最大值
   */
  private getMaxHealth(rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): number {
    switch (rare) {
      case 'BAD': return Math.floor(Math.random() * 31) + 60; // 60-90隨機數值
      case 'NORMAL': return 100;
      case 'SPECIAL': return 110;
      case 'SUPER_SPECIAL': return 120;
      default: return 100;
    }
  }

  /**
   * 計算稀有度對應的飢餓速度
   */
  private getHungerSpeed(rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): number {
    switch (rare) {
      case 'BAD': return 10;
      case 'NORMAL': return 6;
      case 'SPECIAL': return 5;
      case 'SUPER_SPECIAL': return 4;
      default: return 6;
    }
  }

  /**
   * 供外部組件取用，用於電子雞出生時取得稀有度與品種
   * 操作函數一與函數二後，將此 service 中的 rare 及 breed 變數賦值給『電子雞當前數值物件』
   */
  public generateNewPetBreed(petName: string): PetStats {
    // 執行函數一：隨機抽取稀有度
    this.generateRare();

    // 執行函數二：根據稀有度選擇品種
    this.selectBreed();

    if (!this.rare) {
      throw new Error('Failed to generate rare');
    }

    // 獲取品種名稱用於顯示
    let breedName: string | null = null;
    if (this.breed && this.rare) {
      const availableBreeds = getBreedsByRare(this.rare);
      const selectedBreedData = availableBreeds.find(breed => breed.breed === this.breed);
      breedName = selectedBreedData?.breedName || null;
    }

    // 計算稀有度對應的數值
    const hatchingCoins = this.getHatchingCoins(this.rare);
    const maxHealth = this.getMaxHealth(this.rare);
    const hungerSpeed = this.getHungerSpeed(this.rare);

    // 孵化獎勵金幣：更新使用者持有金幣
    const currentUserData = UserDataService.loadUserData();
    UserDataService.addCoins(hatchingCoins, currentUserData);

    // 創建電子雞當前數值物件，使用自定義數值
    const newPetStats: PetStats = {
      rare: this.rare,
      lifeCycle: 'EGG', // 新生電子雞從蛋開始
      breedName: breedName || null,
      name: petName,
      currentHealth: maxHealth, // 初始生命值為最大生命值（滿血）
      maxHealth: maxHealth, // 稀有度對應的生命最大值
      currentHunger: 100, // 預設滿飽足感
      maxHunger: 100,
      hungerSpeed: hungerSpeed, // 稀有度對應的飢餓速度
      currentFriendship: 50, // 初始好感度為50（一半）
      maxFriendship: 100,
      currentWellness: 50, // 初始健康度為50（一半）
      maxWellness: 100,
      timeStopping: false,
      isDead: false,
      isLeaving: false
    };

    // 儲存到localStorage
    PetStatsService.savePetStats(newPetStats);

    return newPetStats;
  }

  /**
   * 獲取當前抽取的稀有度
   */
  public getCurrentRare(): 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL' | null {
    return this.rare;
  }

  /**
   * 獲取當前抽取的品種
   */
  public getCurrentBreed(): string | null {
    return this.breed;
  }

  /**
   * 重置 service 狀態
   */
  public reset(): void {
    this.rare = null;
    this.breed = null;
  }
}