import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function preloadImage(url: string) {
  return new Promise((resolve, reject) => {
    // doing new Image() resulted in "Invalid Hook Call" errors
    const img = document.createElement('img');
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });
}

export function preloadImages(urls: string[]) {
  Promise.allSettled(urls.map(preloadImage)).catch((error) => {
    console.error(`error preloading images ${urls.join(',')}`, error);
  });
}
