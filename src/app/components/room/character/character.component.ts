import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { sources } from '../../../sources';
import { PetStatsService } from '../../../data/pet-stats-data';
import { PetStats } from '../../../types/pet-stats.type';
import { getBreedByName } from '../../../data/breed-data';

@Component({
  selector: 'app-character',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="character-area-wrapper" *ngIf="isCharacterVisible">
      <div class="character-area">
        <div class="character-shadow"></div>
        <div class="character-container">
          <img [src]="characterImage" [alt]="characterName" class="character-image" />
          <div class="character-effects" *ngIf="hasEffects">
            <img *ngIf="isFreezing" [src]="freezingIcon" alt="Freezing" class="effect-icon" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .character-area-wrapper{
      width: 100%;
      height: 100%;
    }
    .character-area {
      position: absolute;
      left: 40%;
      top: 35dvh;
      z-index: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: characterFloat 3s ease-in-out infinite;
    }

    @keyframes characterFloat {
      0%, 100% {
        transform: translate(0px, 0px);
      }
      50% {
        transform: translate(0px, -15px);
      }
    }

    .character-shadow {
      position: absolute;
      bottom: 0dvh;
      left: 50%;
      transform: translateX(-50%);
      width: 12dvh;
      height: 3dvh;
      background: radial-gradient(ellipse, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
      border-radius: 50%;
      animation: shadowFloat 3s ease-in-out infinite;
      z-index: 600;
      filter: blur(0.8dvh);
    }

    @keyframes shadowFloat {
      0%, 100% {
        transform: translateX(-50%) translateY(0) scale(1.3);
        opacity: 0.9;
        filter: blur(0.5dvh);
      }
      50% {
        transform: translateX(-50%) translateY(1.5dvh) scale(0.7);
        opacity: 0.3;
        filter: blur(1.2dvh);
      }
    }

    .character-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .character-image {
      width: auto;
      height: 50dvh;
      object-fit: contain;
      cursor: pointer;
    }

    .character-effects {
      position: absolute;
      top: -10px;
      right: -10px;
    }

    .effect-icon {
      width: 1.5dvh;
      height: 1.5dvh;
    }

  `]
})
export class CharacterComponent implements OnInit, OnDestroy {
  characterImage = '';
  characterName = '';
  isFreezing = false;
  freezingIcon = sources.character.others.isFreezing;
  isCharacterVisible = false;

  private petStats: PetStats;
  private petStatsSubscription?: Subscription;

  constructor() {
    this.petStats = PetStatsService.loadPetStats();
  }

  ngOnInit() {
    // 設定初始圖片
    this.setCharacterImage();

    // 訂閱角色資料變化
    this.petStatsSubscription = PetStatsService.getPetStats$().subscribe(petStats => {
      this.petStats = petStats;
      this.setCharacterImage();
    });
  }

  ngOnDestroy() {
    // 清理訂閱
    if (this.petStatsSubscription) {
      this.petStatsSubscription.unsubscribe();
    }
  }

  get hasEffects(): boolean {
    return this.isFreezing;
  }

  private setCharacterImage() {
    const { lifeCycle, rare, breedName } = this.petStats;

    // 若lifeCycle為null，隱藏角色區塊
    if (lifeCycle === null) {
      this.isCharacterVisible = false;
      return;
    }

    // 有lifeCycle時才顯示角色
    this.isCharacterVisible = true;

    // 根據任務四的邏輯：
    // 若rare有值且lifecycle為EGG，角色圖片顯示sources.character.egg.{{rare}}
    if (rare && lifeCycle === 'EGG') {
      this.characterImage = this.getEggImage(rare);
      this.characterName = 'Egg';
      return;
    }

    // 若lifeCycle有值且為CHILD，角色圖片顯示sources.character.child.child
    if (lifeCycle === 'CHILD') {
      this.characterImage = sources.character.child.child;
      this.characterName = 'Child';
      return;
    }

    // 若breed與lifecycle有值且lifeCycle不為EGG也不為CHILD，角色圖片顯示sources.character.{{lifeCycle}}.{{breed}}
    if (breedName && lifeCycle && (lifeCycle === 'EVOLUTION' || lifeCycle === 'COOKED')) {
      const breedData = getBreedByName(breedName);
      if (breedData) {
        const breed = breedData.breed;

        if (lifeCycle === 'EVOLUTION') {
          this.characterImage = this.getEvolutionImage(breed);
          this.characterName = breedData.breedName || `Evolution - ${breed}`;
        } else if (lifeCycle === 'COOKED') {
          this.characterImage = this.getCookedImage(breed);
          this.characterName = `Cooked - ${breedData.breedName || breed}`;
        }
        return;
      }
    }

    // 處理死亡狀態 - 使用 isDead 屬性判斷
    if (this.petStats.isDead) {
      this.characterImage = sources.character.dead.dead;
      this.characterName = 'Dead';
      return;
    }

    // 預設情況：顯示child圖片
    this.characterImage = sources.character.child.child;
    this.characterName = 'Unknown';
  }

  private getEggImage(rare: PetStats['rare']): string {
    switch (rare) {
      case 'BAD':
        return sources.character.egg.bad;
      case 'SPECIAL':
        return sources.character.egg.special;
      case 'SUPER_SPECIAL':
        return sources.character.egg.superSpecial;
      case 'NORMAL':
      default:
        return sources.character.egg.normal;
    }
  }

  private getEvolutionImage(breed: string): string {
    const evolutionSources = sources.character.evolution as any;
    return evolutionSources[breed] || evolutionSources.cute;
  }

  private getCookedImage(breed: string): string {
    const cookedSources = sources.character.cooked as any;
    return cookedSources[breed] || cookedSources.cute;
  }
}
