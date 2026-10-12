/**
 * Security utilities for TokoKu POS & Inventory Management System.
 * Defense-in-depth protection against injection, tampering, and malicious payloads.
 */

/**
 * Sanitizes user input specifically for PostgREST `.or()` and `.filter()` clauses.
 *
 * In PostgREST (Supabase), `.or()` expressions use commas (,) to separate distinct
 * conditions, parentheses (()) for logical grouping, quotes for string delimiters,
 * and dots (.) with operators (e.g., .eq., .neq., .is.).
 *
 * Direct string interpolation of unsanitized user search terms into `.or(...)` allows
 * malicious actors to inject arbitrary filter clauses, bypass status filters, or
 * cause syntax errors that break client search functionality.
 *
 * @param term Raw user input string
 * @param maxLength Maximum allowable length to prevent ReDoS / payload flooding (default: 50)
 * @returns Cleaned string safe for PostgREST .or() filter interpolation, or empty string if input is blank
 */
export function sanitizePostgrestFilter(term: unknown, maxLength = 50): string {
  if (typeof term !== "string") return "";

  // 1. Trim and enforce length limit
  let sanitized = term.trim().slice(0, maxLength);

  // 2. Remove PostgREST reserved delimiter and control characters:
  // - Comma (,): Delimiter between separate OR conditions
  // - Parentheses (()): Filter grouping / sub-filters
  // - Quotes (" ' `): String literal delimiters
  // - Colons (:): PostgREST type casting / modifiers
  // - Semicolons (;): Query boundary
  // - Backslash (\): Escape manipulation
  // - Square brackets ([]): Array operators
  sanitized = sanitized.replace(/[,():"'\`;\\\[\]]/g, "");

  // 3. Remove consecutive wildcards (% or _) that can degrade PostgreSQL ILIKE performance
  sanitized = sanitized.replace(/[%]{2,}/g, "%");

  // 4. Collapse multiple whitespace characters into a single space
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

/**
 * Validates if an input string contains suspicious injection signatures.
 * Useful for logging or early rejection.
 */
export function isSafeSearchTerm(term: string): boolean {
  if (!term) return true;
  // Detect PostgREST operator injection patterns like ",col.eq.", "or(", "and(", "not."
  const injectionPattern = /(?:,|;|\(|\)|\b(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|ov|sl|sr|nxr|nxl|adj|ov|fts|plfts|phfts|wfts)\b\.)/i;
  return !injectionPattern.test(term);
}

/**
 * Validates that a numeric value is non-negative (>= 0).
 * Throws a TypeError if negative, NaN, or non-finite.
 */
export function validateNonNegative(value: number, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Nilai ${fieldName} harus berupa angka valid.`);
  }
  if (num < 0) {
    throw new Error(`Nilai ${fieldName} tidak boleh bernilai negatif (ditemukan: ${num}).`);
  }
  return num;
}

/**
 * Validates that an integer quantity is strictly positive (> 0).
 */
export function validatePositiveInteger(value: number, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num) || !Number.isInteger(num)) {
    throw new Error(`Nilai ${fieldName} harus berupa bilangan bulat valid.`);
  }
  if (num <= 0) {
    throw new Error(`Nilai ${fieldName} harus lebih besar dari 0 (ditemukan: ${num}).`);
  }
  return num;
}

