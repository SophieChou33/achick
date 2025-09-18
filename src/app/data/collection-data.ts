import { sources } from '../sources';

export interface CollectionItem {
  breedName: string;
  imageSource: string;
  collectedCount: number;
  isUnlocked: 0 | 1;
}

export interface CollectionData {
  [key: string]: CollectionItem;
}

export const defaultCollectionData: CollectionData = {
  // BAD 稀有度品種
  mud: {
    breedName: 'mud',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  poison: {
    breedName: 'poison',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  burned: {
    breedName: 'burned',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  limbs: {
    breedName: 'limbs',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },

  // NORMAL 稀有度品種
  strong: {
    breedName: 'strong',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  smooth: {
    breedName: 'smooth',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  carrot: {
    breedName: 'carrot',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  rainbow: {
    breedName: 'rainbow',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },

  // SPECIAL 稀有度品種
  glass: {
    breedName: 'glass',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  cute: {
    breedName: 'cute',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  monster: {
    breedName: 'monster',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },

  // SUPER_SPECIAL 稀有度品種
  cat: {
    breedName: 'cat',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  fox: {
    breedName: 'fox',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  },
  goose: {
    breedName: 'goose',
    imageSource: sources.character.others.unlocked,
    collectedCount: 0,
    isUnlocked: 0
  }
};

export class CollectionService {
  private static readonly STORAGE_KEY = 'achick_collection_data';

  static loadCollectionData(): CollectionData {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultCollectionData, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to parse collection data:', error);
      }
    }
    return { ...defaultCollectionData };
  }

  static saveCollectionData(data: CollectionData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save collection data:', error);
    }
  }

  static unlockBreed(breedName: string, collectionData: CollectionData): CollectionData {
    const updatedData = { ...collectionData };
    if (updatedData[breedName]) {
      // 解鎖時更新圖片資源為對應的進化形態
      const evolutionImage = (sources.character.evolution as any)[breedName];
      updatedData[breedName] = {
        ...updatedData[breedName],
        isUnlocked: 1,
        imageSource: evolutionImage || sources.character.others.unlocked,
        collectedCount: updatedData[breedName].collectedCount + 1
      };
      this.saveCollectionData(updatedData);
    }
    return updatedData;
  }

  static getCollectionStats(collectionData: CollectionData): {
    totalBreeds: number;
    unlockedBreeds: number;
    completionRate: number;
  } {
    const totalBreeds = Object.keys(collectionData).length;
    const unlockedBreeds = Object.values(collectionData).filter(item => item.isUnlocked === 1).length;
    const completionRate = totalBreeds > 0 ? (unlockedBreeds / totalBreeds) * 100 : 0;

    return {
      totalBreeds,
      unlockedBreeds,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }
}
