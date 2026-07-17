export function normalizeNepalPhone(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("977") && digits.length === 13) {
    return digits.slice(3);
  }
  if (digits.length === 10 && /^(97|98)\d{8}$/.test(digits)) {
    return digits;
  }
  return digits;
}

export function isValidNepalPhone(input: string) {
  return /^(97|98)\d{8}$/.test(normalizeNepalPhone(input));
}

export function lastFourPhoneDigits(input: string) {
  return normalizeNepalPhone(input).slice(-4);
}
