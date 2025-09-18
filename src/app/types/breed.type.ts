export interface Breed {
  breed: string;
  rare: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL';
  breedName?: string;
  cookedEarned?: number;
}