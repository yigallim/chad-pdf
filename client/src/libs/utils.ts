import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withPdfPath(path: string) {
  return "http://127.0.0.1:5000/api/uploads/" + path + ".pdf";
}
