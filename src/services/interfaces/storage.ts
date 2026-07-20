export interface UploadResult {
  url: string;
  deleteUrl?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface IStorageService {
  upload(file: File, path?: string): Promise<UploadResult>;
  delete(url: string): Promise<void>;
  getUrl(path: string): Promise<string>;
}
