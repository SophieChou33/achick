import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sources } from '../../../sources';

interface CharacterData {
  lifeCycle: 'egg' | 'child' | 'evolution' | 'cooked' | 'dead';
  rare: 'normal' | 'special' | 'superSpecial' | 'bad';
  breed: string;
}

@Component({
  selector: 'app-character',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="character-area">
      <div class="character-shadow"></div>
      <div class="character-container">
        <img [src]="characterImage" [alt]="characterName" class="character-image" />
        <div class="character-effects" *ngIf="hasEffects">
          <img *ngIf="isFreezing" [src]="freezingIcon" alt="Freezing" class="effect-icon" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .character-area {
      position: absolute;
      left: 50%;
      top: 75dvh;
      transform: translate(-50%, -50%);
      width: 15dvh;
      height: 15dvh;
      z-index: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: characterFloat 3s ease-in-out infinite;
    }

    @keyframes characterFloat {
      0%, 100% {
        transform: translate(-50%, -50%);
      }
      50% {
        transform: translate(-50%, calc(-50% - 15px));
      }
    }

    .character-shadow {
      position: absolute;
      bottom: -1.5dvh;
      left: 50%;
      transform: translateX(-50%);
      width: 8dvh;
      height: 2dvh;
      background: radial-gradient(ellipse, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
      border-radius: 50%;
      animation: shadowFloat 3s ease-in-out infinite;
      z-index: 600;
      filter: blur(8px);
    }

    @keyframes shadowFloat {
      0%, 100% {
        transform: translateX(-50%) scale(1);
        opacity: 1;
      }
      50% {
        transform: translateX(-50%) scale(0.8);
        opacity: 0.7;
      }
    }

    .character-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .character-image {
      max-width: 100%;
      max-height: 100%;
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
export class CharacterComponent implements OnInit {
  characterImage = '';
  characterName = '';
  isFreezing = false;
  freezingIcon = sources.character.others.isFreezing;

  // Sample character data - in real app this would come from a service
  private characterData: CharacterData = {
    lifeCycle: 'evolution',
    rare: 'normal',
    breed: 'cute'
  };

  ngOnInit() {
    this.setCharacterImage();
  }

  get hasEffects(): boolean {
    return this.isFreezing;
  }

  private setCharacterImage() {
    const { lifeCycle, rare, breed } = this.characterData;

    switch (lifeCycle) {
      case 'egg':
        this.characterImage = this.getEggImage(rare);
        this.characterName = 'Egg';
        break;

      case 'child':
        this.characterImage = sources.character.child.child;
        this.characterName = 'Child';
        break;

      case 'evolution':
        this.characterImage = this.getEvolutionImage(breed);
        this.characterName = `Evolution - ${breed}`;
        break;

      case 'cooked':
        this.characterImage = this.getCookedImage(breed);
        this.characterName = `Cooked - ${breed}`;
        break;

      case 'dead':
        this.characterImage = sources.character.dead.dead;
        this.characterName = 'Dead';
        break;

      default:
        this.characterImage = sources.character.child.child;
        this.characterName = 'Unknown';
    }
  }

  private getEggImage(rare: string): string {
    switch (rare) {
      case 'bad':
        return sources.character.egg.eggBad;
      case 'special':
        return sources.character.egg.eggSpecial;
      case 'superSpecial':
        return sources.character.egg.eggSuperSpecial;
      default:
        return sources.character.egg.eggNormal;
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
