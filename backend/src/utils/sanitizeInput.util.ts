export const sanitizeArgs = (args: unknown[]): unknown[] => {
  return args.map(arg => {
    try {
      return sanitizeInput(String(arg));
    } catch (e) {
      // If sanitization fails, return a safe placeholder
      return '[sanitized]';
    }
  });
};

export const sanitizeInput = (input: string): string => {
  // Remove CRLF characters instead of throwing error
  // This prevents log injection while still allowing normal logging
  return input.replace(/[\r\n]/g, ' ');
};
