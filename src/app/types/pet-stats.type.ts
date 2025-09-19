export interface PetStats {
  rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL' | null;
  lifeCycle: 'EGG' | 'CHILD' | 'EVOLUTION' | 'COOKED' | null;
  breedName: string | null;
  name: string | null;
  currentHealth: number;
  currentHunger: number;
  maxHunger: number;
  maxHealth: number;
  hungerSpeed: number;
  currentFriendship: number;
  maxFriendship: number;
  currentWellness: number;
  maxWellness: number;
  timeStopping: boolean;
  isDead: boolean;
  isLeaving: boolean;
}