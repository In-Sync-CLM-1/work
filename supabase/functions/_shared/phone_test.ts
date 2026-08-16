// Run with: deno test supabase/functions/_shared/phone_test.ts
//
// Every case below is a shape that really exists in the profiles table (or a
// near miss worth guarding), so this is a record of the data as much as a test.

import { toExotelRecipient } from './phone.ts';

const CASES: [string | null, string | null, string][] = [
  ['9876543210', '919876543210', 'bare 10-digit local number'],
  ['98765 43210', '919876543210', '10 digits written with a space'],
  ['9123456789', '919123456789', '10-digit number starting 91 is local, not country-coded'],
  ['9876543210,9123456789', '919876543210', 'two numbers, comma separated -> first wins'],
  ['9876543210/ 9123456789', '919876543210', 'two numbers, slash separated -> first wins'],
  ['919876543210', '919876543210', 'already carries the country code'],
  ['+91 98765-43210', '919876543210', 'plus, spaces and punctuation'],
  ['09876543210', '919876543210', 'trunk-dialled leading zero'],
  ['442071838750', '442071838750', 'non-Indian number passes through untouched'],
  ['12345', null, 'too short to be a mobile'],
  ['abc', null, 'no digits at all'],
  ['', null, 'empty string'],
  [null, null, 'null'],
];

Deno.test('toExotelRecipient normalises every shape in the profiles table', () => {
  const failures: string[] = [];

  for (const [input, expected, label] of CASES) {
    const actual = toExotelRecipient(input);
    if (actual !== expected) {
      failures.push(`${label}: ${JSON.stringify(input)} -> ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`\n  ${failures.join('\n  ')}\n`);
  }
});
