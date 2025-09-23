import { sources } from '../sources';

export interface CollectionItem {
  breedName: string;
  imageSource: string;
  collectedCount: number;
  isUnlocked: 0 | 1;
}

export interface EggCollectionItem {
  rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL';
  rareName: string;
  imageSource: string;
  collectedCount: number;
  isUnlocked: 0 | 1;
}

export interface ChildCollectionItem {
  childType: string;
  imageSource: string;
  collectedCount: number;
  isUnlocked: 0 | 1;
}

export interface CollectionData {
  EGG: EggCollectionItem[];
  CHILD: ChildCollectionItem[];
  EVOLUTION: CollectionItem[];
  COOKED: CollectionItem[];
}

export const defaultCollectionData: CollectionData = {
  EGG: [
    {
      rare: 'BAD',
      rareName: '奇怪的蛋',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      rare: 'NORMAL',
      rareName: '平凡的蛋',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      rare: 'SPECIAL',
      rareName: '特別的蛋',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      rare: 'SUPER_SPECIAL',
      rareName: '發光的蛋',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    }
  ],
  CHILD: [
    {
      childType: 'normal',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    }
  ],
  EVOLUTION: [
    // BAD 稀有度品種
    {
      breedName: 'mud',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'poison',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'burned',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'limbs',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },

    // NORMAL 稀有度品種
    {
      breedName: 'strong',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'smooth',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'carrot',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'rainbow',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },

    // SPECIAL 稀有度品種
    {
      breedName: 'glass',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'cute',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'monster',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },

    // SUPER_SPECIAL 稀有度品種
    {
      breedName: 'cat',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'fox',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'goose',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    }
  ],
  COOKED: [
    // BAD 稀有度品種
    {
      breedName: 'mud',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'poison',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'burned',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'limbs',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },

    // NORMAL 稀有度品種
    {
      breedName: 'strong',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'smooth',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'carrot',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'rainbow',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },

    // SPECIAL 稀有度品種
    {
      breedName: 'glass',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'cute',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'monster',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },

    // SUPER_SPECIAL 稀有度品種
    {
      breedName: 'cat',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'fox',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    },
    {
      breedName: 'goose',
      imageSource: sources.character.others.unlocked,
      collectedCount: 0,
      isUnlocked: 0
    }
  ]
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

  static unlockBreed(breedName: string, type: 'EVOLUTION' | 'COOKED', collectionData: CollectionData): CollectionData {
    const updatedData = {
      ...collectionData,
      [type]: [...collectionData[type]]
    };

    const itemIndex = updatedData[type].findIndex(item => item.breedName === breedName);
    if (itemIndex !== -1) {
      // 解鎖時更新圖片資源為對應的形態
      const imageSource = type === 'EVOLUTION'
        ? (sources.character.evolution as any)[breedName]
        : (sources.character.cooked as any)[breedName];

      updatedData[type][itemIndex] = {
        ...updatedData[type][itemIndex],
        isUnlocked: 1,
        imageSource: imageSource || sources.character.others.unlocked,
        collectedCount: updatedData[type][itemIndex].collectedCount + 1
      };
      this.saveCollectionData(updatedData);
    }
    return updatedData;
  }

  static unlockEgg(rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL', collectionData: CollectionData): CollectionData {
    const updatedData = {
      ...collectionData,
      EGG: [...collectionData.EGG]
    };

    const itemIndex = updatedData.EGG.findIndex(item => item.rare === rare);
    if (itemIndex !== -1) {
      // 解鎖時更新圖片資源為對應的蛋圖片
      const imageSource = (sources.character.egg as any)[rare.toLowerCase()] ||
                         (() => {
                           switch(rare) {
                             case 'BAD': return sources.character.egg.bad;
                             case 'NORMAL': return sources.character.egg.normal;
                             case 'SPECIAL': return sources.character.egg.special;
                             case 'SUPER_SPECIAL': return sources.character.egg.superSpecial;
                             default: return sources.character.others.unlocked;
                           }
                         })();

      updatedData.EGG[itemIndex] = {
        ...updatedData.EGG[itemIndex],
        isUnlocked: 1,
        imageSource,
        collectedCount: updatedData.EGG[itemIndex].collectedCount + 1
      };
      this.saveCollectionData(updatedData);
    }
    return updatedData;
  }

  static unlockChild(childType: string, collectionData: CollectionData): CollectionData {
    const updatedData = {
      ...collectionData,
      CHILD: [...collectionData.CHILD]
    };

    const itemIndex = updatedData.CHILD.findIndex(item => item.childType === childType);
    if (itemIndex !== -1) {
      // 解鎖時更新圖片資源為對應的幼年圖片
      const imageSource = sources.character.child.child;

      updatedData.CHILD[itemIndex] = {
        ...updatedData.CHILD[itemIndex],
        isUnlocked: 1,
        imageSource,
        collectedCount: updatedData.CHILD[itemIndex].collectedCount + 1
      };
      this.saveCollectionData(updatedData);
    }
    return updatedData;
  }

  static getCollectionStats(collectionData: CollectionData): {
    totalBreeds: number;
    unlockedBreeds: number;
    completionRate: number;
    evolutionStats: { total: number; unlocked: number; rate: number };
    cookedStats: { total: number; unlocked: number; rate: number };
  } {
    const evolutionTotal = collectionData.EVOLUTION.length;
    const evolutionUnlocked = collectionData.EVOLUTION.filter(item => item.isUnlocked === 1).length;
    const evolutionRate = evolutionTotal > 0 ? (evolutionUnlocked / evolutionTotal) * 100 : 0;

    const cookedTotal = collectionData.COOKED.length;
    const cookedUnlocked = collectionData.COOKED.filter(item => item.isUnlocked === 1).length;
    const cookedRate = cookedTotal > 0 ? (cookedUnlocked / cookedTotal) * 100 : 0;

    const totalBreeds = evolutionTotal + cookedTotal;
    const unlockedBreeds = evolutionUnlocked + cookedUnlocked;
    const completionRate = totalBreeds > 0 ? (unlockedBreeds / totalBreeds) * 100 : 0;

    return {
      totalBreeds,
      unlockedBreeds,
      completionRate: Math.round(completionRate * 100) / 100,
      evolutionStats: {
        total: evolutionTotal,
        unlocked: evolutionUnlocked,
        rate: Math.round(evolutionRate * 100) / 100
      },
      cookedStats: {
        total: cookedTotal,
        unlocked: cookedUnlocked,
        rate: Math.round(cookedRate * 100) / 100
      }
    };
  }
}
