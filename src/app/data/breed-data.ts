import { Breed } from '../types/breed.type';

export const breedData: Breed[] = [
  // BAD 稀有度品種
  {
    breed: 'mud',
    breedName: '爛泥小雞',
    rare: 'BAD',
    cookedEarned: 5
  },
  {
    breed: 'poison',
    breedName: '好毒小雞',
    rare: 'BAD',
    cookedEarned: 30
  },
  {
    breed: 'burned',
    breedName: '過熟小雞',
    rare: 'BAD',
    cookedEarned: 15
  },
  {
    breed: 'limbs',
    breedName: '突變小雞',
    rare: 'BAD',
    cookedEarned: 30
  },

  // NORMAL 稀有度品種
  {
    breed: 'strong',
    breedName: '健美小雞',
    rare: 'NORMAL',
    cookedEarned: 40
  },
  {
    breed: 'smooth',
    breedName: '好肌小雞',
    rare: 'NORMAL',
    cookedEarned: 40
  },
  {
    breed: 'carrot',
    breedName: '蘿蔔小雞',
    rare: 'NORMAL',
    cookedEarned: 50
  },
  {
    breed: 'rainbow',
    breedName: '七彩小雞',
    rare: 'NORMAL',
    cookedEarned: 70
  },

  // SPECIAL 稀有度品種
  {
    breed: 'glass',
    breedName: '琉璃小雞',
    rare: 'SPECIAL',
    cookedEarned: 90
  },
  {
    breed: 'cute',
    breedName: '絨毛小雞',
    rare: 'SPECIAL',
    cookedEarned: 110
  },
  {
    breed: 'monster',
    breedName: '異形小雞',
    rare: 'SPECIAL',
    cookedEarned: 100
  },

  // SUPER_SPECIAL 稀有度品種
  {
    breed: 'cat',
    breedName: '貓貓小雞',
    rare: 'SUPER_SPECIAL',
    cookedEarned: 270
  },
  {
    breed: 'fox',
    breedName: '狐狸小雞',
    rare: 'SUPER_SPECIAL',
    cookedEarned: 280
  },
  {
    breed: 'goose',
    breedName: '白鵝小雞',
    rare: 'SUPER_SPECIAL',
    cookedEarned: 250
  }
];

export function getBreedByName(breedName: string): Breed | undefined {
  return breedData.find(breed => breed.breed === breedName);
}

export function getBreedsByRare(rareType: 'BAD' | 'NORMAL' | 'SPECIAL' | 'SUPER_SPECIAL'): Breed[] {
  return breedData.filter(breed => breed.rare === rareType);
}