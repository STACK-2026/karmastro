import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface SmartDateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Smart date input that accepts multiple formats:
 * DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DDMMYYYY, DD MM YYYY
 * Also has a fallback native date picker via calendar icon.
 */
function parseDate(input: string): string | null {
  const cleaned = input.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DDMMYYYY (8 digits)
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(4)}-${cleaned.slice(2, 4)}-${cleaned.slice(0, 2)}`;
  }

  // DD MM YYYY (with spaces)
  match = cleaned.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // MM/DD/YYYY won't be supported (we're in France, DD/MM/YYYY)
  return null;
}

function formatDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function isValidDate(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

const SmartDateInput = ({ value, onChange, placeholder = "JJ/MM/AAAA", className = "" }: SmartDateInputProps) => {
  const [displayValue, setDisplayValue] = useState(value ? formatDisplay(value) : "");
  const [error, setError] = useState(false);
  const nativeDateRef = useRef<HTMLInputElement>(null);

  // Sync displayValue when value prop changes externally (e.g. pre-fill from DB/sessionStorage)
  useEffect(() => {
    if (value && formatDisplay(value) !== displayValue) {
      setDisplayValue(formatDisplay(value));
      setError(false);
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    setDisplayValue(text);
    setError(false);

    // Auto-add slashes
    const digits = text.replace(/\D/g, "");
    if (digits.length >= 8) {
      const formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      setDisplayValue(formatted);

      const parsed = parseDate(formatted);
      if (parsed && isValidDate(parsed)) {
        onChange(parsed);
        setError(false);
      } else {
        setError(true);
      }
      return;
    }

    // Try parsing as-is
    if (text.length >= 8) {
      const parsed = parseDate(text);
      if (parsed && isValidDate(parsed)) {
        onChange(parsed);
        setError(false);
      } else {
        setError(true);
      }
    }
  };

  const handleBlur = () => {
    if (displayValue && !value) {
      setError(true);
    }
    if (value) {
      setDisplayValue(formatDisplay(value));
      setError(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`bg-secondary border-border pr-10 ${error ? "border-red-500/50" : ""}`}
      />
      {/* Calendar icon → native date picker fallback */}
      <button
        type="button"
        onClick={() => nativeDateRef.current?.showPicker?.()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <Calendar className="h-4 w-4" />
      </button>
      <input
        ref={nativeDateRef}
        type="date"
        className="sr-only"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setDisplayValue(formatDisplay(e.target.value));
          setError(false);
        }}
      />
      {error && <p className="text-[10px] text-red-400 mt-1">Format attendu : JJ/MM/AAAA</p>}
    </div>
  );
};

export default SmartDateInput;
