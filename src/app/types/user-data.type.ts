export interface PetRecord {
  petName: string | null;
  birthTime: string | null; // yyyy/mm/dd HH:mm:ss
  evolutionTime: string | null; // yyyy/mm/dd HH:mm:ss
  deathTime: string | null; // yyyy/mm/dd HH:mm:ss
}

export interface UserData {
  coins: number;
  totalPetsRaised: number;
  petHistory: PetRecord[];
}