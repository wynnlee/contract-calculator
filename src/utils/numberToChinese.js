/**
 * Convert a number to Chinese uppercase (大写) format
 * e.g., 12345.67 → 壹万贰仟叁佰肆拾伍元陆角柒分
 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UNITS = ['', '拾', '佰', '仟'];
const BIG_UNITS = ['', '万', '亿', '万亿'];

/**
 * Convert integer part (string) to Chinese uppercase
 */
function integerToChinese(numStr) {
  if (numStr === '0') return '零';

  const len = numStr.length;
  let result = '';
  let zeroFlag = false;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i], 10);
    const pos = len - 1 - i;
    const unitPos = pos % 4;
    const bigUnitPos = Math.floor(pos / 4);

    if (digit === 0) {
      zeroFlag = true;
      // Add big unit at every 4-digit boundary if not all zeros
      if (unitPos === 0 && bigUnitPos > 0) {
        result += BIG_UNITS[bigUnitPos];
        zeroFlag = false;
      }
    } else {
      if (zeroFlag) {
        result += '零';
        zeroFlag = false;
      }
      result += DIGITS[digit] + UNITS[unitPos];
      if (unitPos === 0 && bigUnitPos > 0) {
        result += BIG_UNITS[bigUnitPos];
      }
    }
  }

  return result;
}

/**
 * Convert decimal part (string, max 2 chars) to Chinese uppercase
 */
function decimalToChinese(decStr) {
  if (!decStr || decStr === '00') return '';

  let result = '';
  if (decStr.length >= 1 && decStr[0] !== '0') {
    result += DIGITS[parseInt(decStr[0], 10)] + '角';
  }
  if (decStr.length >= 2 && decStr[1] !== '0') {
    result += DIGITS[parseInt(decStr[1], 10)] + '分';
  }
  return result;
}

/**
 * Main function: convert a number to Chinese uppercase
 * @param {number} amount - The number to convert
 * @returns {string} Chinese uppercase representation
 */
export function numberToChinese(amount) {
  if (amount === 0) return '零元整';

  const rounded = Math.round(amount * 100) / 100;
  const [integerStr, decimalStr] = rounded.toFixed(2).split('.');

  const intPart = integerToChinese(integerStr);
  const decPart = decimalToChinese(decimalStr);

  let result = intPart + '元';
  if (decPart) {
    result += decPart;
  } else {
    result += '整';
  }

  return result;
}

/**
 * Format number with comma separators and 2 decimal places
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
