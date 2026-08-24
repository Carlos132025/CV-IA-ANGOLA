/**
 * Sanitizes user input string against HTML/Script injection.
 * Strips script tags, HTML markup, and dangerous javascript URI schemes.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // remove inline events like onload=, onclick=
    .trim();
}

/**
 * Sanitizes an object of string fields recursively.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        result[key] = sanitizeInput(val);
      } else if (typeof val === 'object' && val !== null) {
        result[key] = sanitizeObject(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}
