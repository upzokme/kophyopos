/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatKyat(value: number): string {
  // Use Math.round for Kyats since Myanmar Kyat doesn't use fractional/pya values in POS systems
  const formattedEnglish = Math.round(value).toLocaleString("en-US");
  const myanmarDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
  const formattedMyanmar = formattedEnglish.replace(/[0-9]/g, (char) => myanmarDigits[parseInt(char, 10)]);
  return `${formattedMyanmar} ကျပ်`;
}

// Translate dates to Burmese months
export function formatBurmeseDate(dateString: string): string {
  const date = new Date(dateString);
  const year = toMyanmarDigits(date.getFullYear().toString());
  const day = toMyanmarDigits(date.getDate().toString());
  
  const burmeseMonths = [
    "ဇန်နဝါရီ",
    "ဖေဖော်ဝါရီ",
    "မတ်",
    "ဧပြီ",
    "မေ",
    "ဇွန်",
    "ဇူလိုင်",
    "ဩဂုတ်",
    "စက်တင်ဘာ",
    "အောက်တိုဘာ",
    "နိုဝင်ဘာ",
    "ဒီဇင်ဘာ"
  ];
  const month = burmeseMonths[date.getMonth()];
  return `${year} ခုနှစ်၊ ${month}လ ${day} ရက်`;
}

export function toMyanmarDigits(text: string | number): string {
  const str = String(text);
  const myanmarDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
  return str.replace(/[0-9]/g, (char) => myanmarDigits[parseInt(char, 10)]);
}
