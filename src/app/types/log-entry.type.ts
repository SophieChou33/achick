export interface LogEntry {
  id: string;
  timestamp: string; // yyyy/mm/dd HH:mm:ss 格式
  type: 'toastr' | 'modal';
  category: 'success' | 'warning' | 'error' | 'info';
  message: string;
  title?: string; // modal 類型可能有標題
}

export interface LogData {
  entries: LogEntry[];
  lastCleared?: string; // 上次清除日誌的時間
}