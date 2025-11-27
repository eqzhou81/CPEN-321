import { sanitizeArgs, sanitizeInput } from './sanitizeInput.util';

const logger = {
  info: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    process.stdout.write("[INFO] " + sanitizeInput(message) + " " + sanitizeArgs(args).join(" ") + "\n");
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${sanitizeInput(message)}`, ...sanitizeArgs(args));
  },
  warn: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${sanitizeInput(message)}`, ...sanitizeArgs(args));
  },
  debug: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] ${sanitizeInput(message)}`, ...sanitizeArgs(args));
  },
};

export default logger;
