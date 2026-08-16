// Phone numbers reach us however the person who typed them felt that day.
// Exotel wants one recipient in country-code form, digits only, no plus --
// e.g. 919876543210. This is the same shape RMPL sends on the same Exotel
// account, which is the proof that it is the right one.
//
// What is actually in the Work-Sync profiles table today:
//   94  bare 10-digit local numbers          9876543210
//    5  10 digits with a space               98765 43210
//    2  two numbers separated by a comma     9876543210,9123456789
//    2  two numbers separated by a slash     9876543210/ 9123456789
//    1  10-digit number that starts with 91  9123456789   (a real prefix,
//                                                          not a country code)
// The two-number cases matter most: blindly stripping punctuation would
// concatenate them into a 20-digit number that silently goes nowhere.

const DEFAULT_COUNTRY_CODE = '91';

/**
 * Exotel-ready recipient, or null if the value can't be a real mobile number.
 * Returning null is deliberate — skipping the send and logging beats posting
 * a malformed recipient, which Exotel accepts and then quietly drops.
 */
export function toExotelRecipient(
  raw: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!raw) return null;

  // Several numbers in one field: the first one is the primary.
  const first = raw.split(/[,;/|]|\s{2,}/)[0] ?? '';

  let digits = first.replace(/\D/g, '');
  if (!digits) return null;

  // 0-prefixed trunk dialling, e.g. 09876543210
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Bare local number -- the common case. Note a 10-digit value starting "91"
  // is a local number whose prefix happens to be 91, NOT a country code, so
  // length is checked before any prefix.
  if (digits.length === 10) {
    return countryCode + digits;
  }

  // Already carries the country code.
  if (digits.length === 12 && digits.startsWith(countryCode)) {
    return digits;
  }

  // Some other international number, passed through as dialled.
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
}
