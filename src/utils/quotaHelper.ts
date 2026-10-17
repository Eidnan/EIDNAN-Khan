/**
 * Parses and formats Gemini API 429 quota exhaustion errors with retryDelay and quotaValue
 */

export interface QuotaErrorInfo {
  isQuotaExceeded: boolean;
  totalQuota?: number | string;
  retrySeconds?: number;
  remainingTimeFormattedBn: string;
  remainingTimeFormattedEn: string;
  userFriendlyMessageBn: string;
  userFriendlyMessageEn: string;
}

export function toBengaliDigits(input: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (digit) => bnDigits[parseInt(digit, 10)]);
}

export function parseQuotaError(rawError: any): QuotaErrorInfo {
  let errorData: any = null;

  // 1. Gather all string contents from rawError (including Error.prototype.message, stack, status, etc.)
  let combinedString = '';
  if (typeof rawError === 'string') {
    combinedString = rawError;
  } else if (rawError && typeof rawError === 'object') {
    const msg = rawError.message || '';
    const stack = rawError.stack || '';
    let jsonStr = '';
    try {
      jsonStr = JSON.stringify(rawError);
    } catch {
      // ignore circular
    }
    combinedString = `${rawError.name || ''} ${msg} ${stack} ${jsonStr} ${String(rawError)}`;
  } else {
    combinedString = String(rawError || '');
  }

  // 2. Try to extract plain JSON object directly or from string
  if (rawError && typeof rawError === 'object' && !(rawError instanceof Error)) {
    errorData = rawError;
  }

  // If not found or if rawError is an Error object, inspect rawError.message or combinedString for JSON
  if (!errorData || !errorData.error) {
    const rawSearchTarget = (rawError && rawError.message) || combinedString;
    const jsonMatch = rawSearchTarget.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        errorData = JSON.parse(jsonMatch[0]);
      } catch {
        // try looking for {"error": ...}
        const errorBlockMatch = rawSearchTarget.match(/\{"error"[\s\S]*\}/);
        if (errorBlockMatch) {
          try {
            errorData = JSON.parse(errorBlockMatch[0]);
          } catch {
            // ignore
          }
        }
      }
    }
  }

  // Also check if rawError has attached error/details
  if (!errorData && rawError && typeof rawError === 'object') {
    errorData = {
      error: rawError.error || rawError.errorResponse || rawError,
      details: rawError.details,
    };
  }

  let totalQuota: string | number | undefined = undefined;
  let retrySeconds: number | undefined = undefined;

  // 3. Extract from parsed details list if present
  const details =
    errorData?.error?.details ||
    errorData?.details ||
    errorData?.errorResponse?.details ||
    (rawError && Array.isArray(rawError.details) ? rawError.details : undefined);

  if (Array.isArray(details)) {
    for (const item of details) {
      // Daily limit / quota check
      if (item?.violations && Array.isArray(item.violations)) {
        for (const violation of item.violations) {
          if (violation?.quotaValue !== undefined) {
            totalQuota = violation.quotaValue;
          }
        }
      }
      // How many seconds until reset
      if (item?.retryDelay) {
        const delayStr = String(item.retryDelay).replace('s', '').trim();
        const sec = parseInt(delayStr, 10);
        if (!isNaN(sec)) {
          retrySeconds = sec;
        }
      }
    }
  }

  // 4. Regex fallback for quotaValue / limit
  if (totalQuota === undefined) {
    const limitMatch =
      combinedString.match(/quotaValue["']?:\s*["']?(\d+)/i) ||
      combinedString.match(/limit:\s*(\d+)/i);
    if (limitMatch) {
      totalQuota = limitMatch[1];
    }
  }

  // 5. Regex fallback for retryDelay (e.g. retryDelay: "23808s" or retryDelay: 23808)
  if (retrySeconds === undefined) {
    const retryDelayMatch = combinedString.match(/retryDelay["']?:\s*["']?(\d+)/i);
    if (retryDelayMatch) {
      retrySeconds = parseInt(retryDelayMatch[1], 10);
    } else {
      // Look for string format: "retry in 6h36m48.255900573s" or "retry in 8h48m" or "6h11m5s"
      const hmsMatch =
        combinedString.match(/retry (?:in|after)\s*(?:(\d+)\s*(?:h|hours?))?\s*(?:(\d+)\s*(?:m|mins?|minutes?))?(?:\s*([\d.]+)\s*(?:s|secs?|seconds?))?/i) ||
        combinedString.match(/(?:(\d+)\s*(?:h|hours?))\s*(?:(\d+)\s*(?:m|mins?|minutes?))/i);

      if (hmsMatch) {
        const hours = parseInt(hmsMatch[1] || '0', 10);
        const mins = parseInt(hmsMatch[2] || '0', 10);
        const secs = Math.floor(parseFloat(hmsMatch[3] || '0'));
        retrySeconds = hours * 3600 + mins * 60 + secs;
      }
    }
  }

  // 6. Determine if this is a quota exceeded error
  const isQuota =
    Boolean(totalQuota) ||
    Boolean(retrySeconds) ||
    combinedString.includes('RESOURCE_EXHAUSTED') ||
    combinedString.includes('429') ||
    combinedString.includes('Quota exceeded') ||
    combinedString.toLowerCase().includes('rate-limit') ||
    rawError?.status === 429 ||
    rawError?.code === 429 ||
    errorData?.error?.code === 429;

  // Standard cooldown interval: 8 hours 48 minutes (31,680 seconds)
  const STANDARD_COOLDOWN_SECONDS = 31680;
  if (isQuota && (retrySeconds === undefined || retrySeconds <= 0)) {
    retrySeconds = STANDARD_COOLDOWN_SECONDS;
  }

  let remainingTimeBn = '৮ ঘণ্টা ৪৮ মিনিট';
  let remainingTimeEn = '8 hours 48 minutes';

  if (retrySeconds !== undefined && retrySeconds > 0) {
    const hours = Math.floor(retrySeconds / 3600);
    const minutes = Math.floor((retrySeconds % 3600) / 60);
    const seconds = retrySeconds % 60;

    if (hours > 0 && minutes > 0) {
      remainingTimeBn = `${toBengaliDigits(hours)} ঘণ্টা ${toBengaliDigits(minutes)} মিনিট`;
      remainingTimeEn = `${hours} hours ${minutes} minutes`;
    } else if (hours > 0) {
      remainingTimeBn = `${toBengaliDigits(hours)} ঘণ্টা`;
      remainingTimeEn = `${hours} hours`;
    } else if (minutes > 0) {
      remainingTimeBn = `${toBengaliDigits(minutes)} মিনিট`;
      remainingTimeEn = `${minutes} minutes`;
    } else {
      remainingTimeBn = `${toBengaliDigits(Math.max(1, seconds))} সেকেন্ড`;
      remainingTimeEn = `${Math.max(1, seconds)} seconds`;
    }
  }

  const userFriendlyMessageBn = `⚠️ দৈনিক ফ্রি ভয়েস কোটা শেষ হয়ে গেছে!\n⏳ আপনি পুনরায় ভয়েস তৈরি করতে পারবেন: ${remainingTimeBn} পর।\n(জরুরি সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন: https://www.facebook.com/EIDNAN.KHAN.5)`;
  const userFriendlyMessageEn = `⚠️ Daily free voice quota has been exhausted!\n⏳ You will be able to generate voice again in: ${remainingTimeEn}.\n(For urgent support, contact admin: https://www.facebook.com/EIDNAN.KHAN.5)`;

  return {
    isQuotaExceeded: isQuota,
    totalQuota,
    retrySeconds,
    remainingTimeFormattedBn: remainingTimeBn,
    remainingTimeFormattedEn: remainingTimeEn,
    userFriendlyMessageBn,
    userFriendlyMessageEn,
  };
}
