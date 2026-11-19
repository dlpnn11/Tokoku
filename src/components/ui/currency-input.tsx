"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

const ID_NUMBER_FORMATTER = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const MAX_DIGITS = 12;

function formatNumberId(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return ID_NUMBER_FORMATTER.format(Math.floor(value));
}

function getCaretPositionForDigitCount(formatted: string, targetDigits: number): number {
  if (targetDigits <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen === targetDigits) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

export interface CurrencyInputProps
  extends Omit<InputProps, "type" | "value" | "onChange"> {
  value: number;
  onValueChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, onKeyDown, placeholder = "0", inputMode = "numeric", autoComplete = "off", ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const pendingCaretRef = React.useRef<number | null>(null);

    const formattedValue = formatNumberId(value);

    const setMergedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    React.useLayoutEffect(() => {
      const el = internalRef.current;
      if (
        pendingCaretRef.current !== null &&
        el &&
        document.activeElement === el
      ) {
        const pos = Math.min(pendingCaretRef.current, el.value.length);
        el.setSelectionRange(pos, pos);
        pendingCaretRef.current = null;
      }
    }, [formattedValue]);

    const applyDigitMutation = (
      rawValue: string,
      digitsBeforeCursorRaw: string,
      el: HTMLInputElement
    ) => {
      const rawDigits = rawValue.replace(/\D/g, "").slice(0, MAX_DIGITS);
      const strippedDigits = rawDigits.replace(/^0+/, "");
      const leadingZerosCount = rawDigits.length - strippedDigits.length;

      const nextNumeric = strippedDigits ? Number(strippedDigits) : 0;
      const nextFormatted = formatNumberId(nextNumeric);

      const targetDigitCount = Math.max(
        0,
        digitsBeforeCursorRaw.length - leadingZerosCount
      );
      const nextCaret = getCaretPositionForDigitCount(
        nextFormatted,
        targetDigitCount
      );

      pendingCaretRef.current = nextCaret;

      if (nextNumeric === value) {
        el.value = nextFormatted;
        el.setSelectionRange(nextCaret, nextCaret);
        pendingCaretRef.current = null;
        return;
      }

      onValueChange(nextNumeric);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = e.target;
      const rawValue = el.value;
      const cursorPos = el.selectionStart ?? rawValue.length;
      const digitsBeforeCursorRaw = rawValue.slice(0, cursorPos).replace(/\D/g, "");
      applyDigitMutation(rawValue, digitsBeforeCursorRaw, el);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start === null || end === null || start !== end) return;

      // Skip over '.' thousand separator when Backspace/Delete is pressed right adjacent to it
      if (e.key === "Backspace" && start > 0 && el.value[start - 1] === ".") {
        e.preventDefault();
        const removeIdx = start - 2;
        if (removeIdx < 0) return;
        const nextRaw = el.value.slice(0, removeIdx) + el.value.slice(removeIdx + 1);
        const digitsBefore = el.value.slice(0, removeIdx).replace(/\D/g, "");
        applyDigitMutation(nextRaw, digitsBefore, el);
      } else if (e.key === "Delete" && start < el.value.length && el.value[start] === ".") {
        e.preventDefault();
        const removeIdx = start + 1;
        if (removeIdx >= el.value.length) return;
        const nextRaw = el.value.slice(0, removeIdx) + el.value.slice(removeIdx + 1);
        const digitsBefore = el.value.slice(0, start).replace(/\D/g, "");
        applyDigitMutation(nextRaw, digitsBefore, el);
      }
    };

    return (
      <Input
        ref={setMergedRef}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={formattedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
