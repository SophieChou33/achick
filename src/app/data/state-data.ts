import { StateData, StateDataType } from '../types/state-data.type';

export const defaultStateData: StateData = {
  angry: {
    stateText: '憤怒',
    isActive: 0
  },
  hungry: {
    stateText: '飢餓',
    isActive: 0
  },
  lowLikability: {
    stateText: '無依無靠',
    isActive: 0
  },
  sleepy: {
    stateText: '睡眠不足',
    isActive: 0
  },
  needLight: {
    stateText: '需要光線',
    isActive: 0
  },
  needSleep: {
    stateText: '需要睡眠',
    isActive: 0
  },
  weak: {
    stateText: '虛弱',
    isActive: 0
  },
  headache: {
    stateText: '偏頭痛',
    isActive: 0
  },
  diarrhea: {
    stateText: '拉肚子',
    isActive: 0
  },
  gastricUlcer: {
    stateText: '胃潰瘍',
    isActive: 0
  },
  flu: {
    stateText: '流感',
    isActive: 0
  },
  isSleeping: {
    stateText: '睡眠中',
    isActive: 0
  },
  characterPosition: {
    left: '40%',
    top: '35dvh'
  },
  bedPosition: {
    left: '19%',
    top: '53dvh'
  }
};

export class StateDataService {
  private static readonly STORAGE_KEY = 'achick_state_data';

  static loadStateData(): StateData {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultStateData, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to parse state data:', error);
      }
    }
    return { ...defaultStateData };
  }

  static saveStateData(data: StateData): void {
    console.log('StateDataService.saveStateData() 開始執行');
    console.log('要儲存的資料:', data.isSleeping, data.needSleep);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('✅ 狀態資料已成功儲存到 localStorage');
    } catch (error) {
      console.error('❌ 儲存狀態資料失敗:', error);
    }
  }

  static updateStateData(updates: Partial<StateData>, currentData: StateData): StateData {
    const updatedData = { ...currentData, ...updates };
    this.saveStateData(updatedData);
    return updatedData;
  }

  static activateState(stateName: keyof StateData, stateData: StateData): StateData {
    console.log(`StateDataService.activateState(${stateName}) 開始執行`);
    console.log('原始狀態資料:', stateData[stateName]);

    const updatedData = {
      ...stateData,
      [stateName]: {
        ...stateData[stateName],
        isActive: 1 as const
      }
    };

    console.log('更新後狀態資料:', updatedData[stateName]);

    this.saveStateData(updatedData);
    console.log(`StateDataService.activateState(${stateName}) 執行完成`);

    return updatedData;
  }

  static deactivateState(stateName: keyof StateData, stateData: StateData): StateData {
    console.log(`StateDataService.deactivateState(${stateName}) 開始執行`);
    console.log('原始狀態資料:', stateData[stateName]);

    const updatedData = {
      ...stateData,
      [stateName]: {
        ...stateData[stateName],
        isActive: 0 as const
      }
    };

    console.log('更新後狀態資料:', updatedData[stateName]);

    this.saveStateData(updatedData);
    console.log(`StateDataService.deactivateState(${stateName}) 執行完成`);

    return updatedData;
  }

  static getActiveStates(stateData: StateData): StateDataType[] {
    return Object.entries(stateData)
      .filter(([key, state]) => key !== 'characterPosition' && key !== 'bedPosition' && 'isActive' in state && state.isActive === 1)
      .map(([_, state]) => state as StateDataType);
  }

  static getActiveStateNames(stateData: StateData): string[] {
    return Object.entries(stateData)
      .filter(([key, state]) => key !== 'characterPosition' && key !== 'bedPosition' && 'isActive' in state && state.isActive === 1)
      .map(([name, _]) => name);
  }

  static resetAllStates(): StateData {
    const resetData = { ...defaultStateData };
    this.saveStateData(resetData);
    return resetData;
  }

  static isStateActive(stateName: keyof StateData, stateData: StateData): boolean {
    const stateValue = stateData[stateName];
    // 只有 StateDataType 有 isActive 屬性
    return (stateValue as any).isActive === 1;
  }

  static updateCharacterPosition(position: { left: string; top: string }): StateData {
    const currentData = this.loadStateData();
    const updatedData = {
      ...currentData,
      characterPosition: position
    };
    this.saveStateData(updatedData);
    return updatedData;
  }

  static updateBedPosition(position: { left: string; top: string }): StateData {
    const currentData = this.loadStateData();
    const updatedData = {
      ...currentData,
      bedPosition: position
    };
    this.saveStateData(updatedData);
    return updatedData;
  }

  static resetCharacterPositionToDefault(): StateData {
    const currentData = this.loadStateData();
    const updatedData = {
      ...currentData,
      characterPosition: {
        left: '40%',
        top: '35dvh'
      }
    };
    this.saveStateData(updatedData);
    return updatedData;
  }

  static resetPositionsToDefault(): StateData {
    const currentData = this.loadStateData();
    const updatedData = {
      ...currentData,
      characterPosition: {
        left: '40%',
        top: '35dvh'
      },
      bedPosition: {
        left: '19%',
        top: '53dvh'
      }
    };
    this.saveStateData(updatedData);
    return updatedData;
  }
}