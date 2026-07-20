import type { IStorageService, UploadResult } from "@/services/interfaces/storage";

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const JPEG_QUALITY = 0.85;

function getApiKey(): string {
  const key = import.meta.env.VITE_IMGBB_API_KEY;
  if (!key) {
    throw new Error(
      "ImgBB API key is not configured. Set VITE_IMGBB_API_KEY in your .env file.",
    );
  }
  return key;
}

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
    const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image compression failed"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

const uploadCache = new Map<string, UploadResult>();

export class ImgBBStorageService implements IStorageService {
  async upload(file: File, _path?: string): Promise<UploadResult> {
    const hash = await computeFileHash(file);
    const cached = uploadCache.get(hash);
    if (cached) return cached;

    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("key", getApiKey());
    formData.append("image", compressed, file.name);

    const response = await fetch(IMGBB_API_URL, { method: "POST", body: formData });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ImgBB upload failed (${response.status}): ${text}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(`ImgBB upload error: ${json.error?.message ?? JSON.stringify(json)}`);
    }

    const result: UploadResult = {
      url: json.data.url,
      deleteUrl: json.data.delete_url,
      width: json.data.width,
      height: json.data.height,
      size: json.data.size,
    };

    uploadCache.set(hash, result);
    return result;
  }

  async delete(url: string): Promise<void> {
    // ImgBB free tier does not provide a delete API endpoint.
    // delete_url from upload response can be used manually by the user.
  }

  async getUrl(_path: string): Promise<string> {
    throw new Error("ImgBB does not support path-based URL resolution. Use the URL returned from upload().");
  }
}

export { computeFileHash };
