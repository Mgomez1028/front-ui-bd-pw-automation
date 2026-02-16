/* eslint-disable no-console */
export const logger = {
  info: (message: string, data?: unknown): void => {
    console.log(`[INFO] ${message}`, data ?? "");
  },
  warn: (message: string, data?: unknown): void => {
    console.warn(`[WARN] ${message}`, data ?? "");
  },
  error: (message: string, data?: unknown): void => {
    console.error(`[ERROR] ${message}`, data ?? "");
  }
};
