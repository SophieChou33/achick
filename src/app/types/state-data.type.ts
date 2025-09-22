export interface StateDataType {
  stateText: string;
  isActive: 0 | 1;
}

export interface ComponentPosition {
  left: string;
  top: string;
}

export interface StateData {
  angry: StateDataType;
  hungry: StateDataType;
  lowLikability: StateDataType;
  sleepy: StateDataType;
  needLight: StateDataType;
  needSleep: StateDataType;
  weak: StateDataType;
  headache: StateDataType;
  diarrhea: StateDataType;
  gastricUlcer: StateDataType;
  flu: StateDataType;
  isSleeping: StateDataType;
  characterPosition: ComponentPosition;
  bedPosition: ComponentPosition;
}