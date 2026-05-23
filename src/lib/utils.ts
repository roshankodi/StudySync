import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export function base64ToFile(base64: string, filename: string): File {
  const splitted = base64.split(",");
  if (!splitted || splitted.length < 2 || !splitted[0] || !splitted[1])
    throw new Error("Invalid base64 string");

  // Extract MIME type from base64 data URL
  const mimeTypeMatch = /data:([^;]+)/.exec(splitted[0]);
  const fullMimeType = mimeTypeMatch ? mimeTypeMatch[1] : "";

  // Legacy mapping for simple types
  const mimeType = splitted[0].split("/")[1]?.split(";")[0];
  const mimeMap = {
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
    "vnd.openxmlformats-officedocument.wordprocessingml.document":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  // Use full MIME type if available, otherwise fall back to mapped type
  const finalMimeType =
    fullMimeType ??
    mimeMap[mimeType as keyof typeof mimeMap] ??
    "application/octet-stream";

  let blob;
  if (typeof window === "undefined") {
    const buffer = Buffer.from(splitted[1], "base64");
    blob = new Blob([buffer], { type: finalMimeType });
  } else {
    const byteString = window.atob(splitted[1]);

    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    blob = new Blob([intArray], { type: finalMimeType });
  }

  const file = new File([blob], filename, { type: finalMimeType });
  return file;
}


export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };

    reader.onerror = () => {
      reader.abort();
      reject(new DOMException("Could not parse file"));
    };

    reader.readAsDataURL(file);
  });
}
