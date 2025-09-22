export interface DirtyObject {
  dirtyNo: number;
  dirtyTime: string; // yyyy/mm/dd HH:mm:ss
  lastPunishTime?: string; // 最後懲罰時間，用於避免重複懲罰
}