import { Injectable } from '@angular/core';
import { getBreedsByRare } from '../data/breed-data';
import { PetStats } from '../types/pet-stats.type';
import { PetStatsService } from '../data/pet-stats-data';

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
   * 供外部組件取用，用於電子雞出生時取得稀有度與品種
   * 操作函數一與函數二後，將此 service 中的 rare 及 breed 變數賦值給『電子雞當前數值物件』
   */
  public generateNewPetBreed(petName: string): PetStats {
    // 執行函數一：隨機抽取稀有度
    this.generateRare();

    // 執行函數二：根據稀有度選擇品種
    this.selectBreed();

    // 獲取品種名稱用於顯示
    let breedName: string | null = null;
    if (this.breed && this.rare) {
      const availableBreeds = getBreedsByRare(this.rare);
      const selectedBreedData = availableBreeds.find(breed => breed.breed === this.breed);
      breedName = selectedBreedData?.breedName || null;
    }

    // 將結果賦值給電子雞當前數值物件
    const newPetStats = PetStatsService.initializeNewPet(
      petName,
      this.rare,
      'EGG', // 新生電子雞從蛋開始
      breedName || undefined
    );

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