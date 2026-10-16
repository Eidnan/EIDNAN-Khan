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

export function parseQuotaError(rawError: any): QuotaErrorInfo {
  let errorData: any = null;
  const rawString =
    typeof rawError === 'string'
      ? rawError
      : JSON.stringify(rawError || {});

  if (typeof rawError === 'object' && rawError !== null) {
    errorData = rawError;
  } else {
    try {
      errorData = JSON.parse(rawError);
    } catch {
      // not a clean JSON string, will regex below
    }
  }

  // Check nested error JSON in string (e.g. ApiError: {"error": ...})
  if (!errorData?.error && rawString.includes('{')) {
    const jsonMatch = rawString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        errorData = JSON.parse(jsonMatch[0]);
      } catch {
        // ignore
      }
    }
  }

  let totalQuota: string | number | undefined = undefined;
  let retrySeconds: number | undefined = undefined;

  // Extract from parsed details list if present
  const details =
    errorData?.error?.details ||
    errorData?.details ||
    errorData?.errorResponse?.details;

  if (Array.isArray(details)) {
    for (const item of details) {
      // Daily limit check
      if (item?.violations && Array.isArray(item.violations)) {
        for (const violation of item.violations) {
          if (violation?.quotaValue) {
            totalQuota = violation.quotaValue;
          }
        }
      }
      // How many seconds until reset
      if (item?.retryDelay) {
        const delayStr = String(item.retryDelay).replace('s', '');
        const sec = parseInt(delayStr, 10);
        if (!isNaN(sec)) {
          retrySeconds = sec;
        }
      }
    }
  }

  // Regex fallback for quotaValue / limit
  if (totalQuota === undefined) {
    const limitMatch =
      rawString.match(/quotaValue["']?:\s*["']?(\d+)/i) ||
      rawString.match(/limit:\s*(\d+)/i);
    if (limitMatch) {
      totalQuota = limitMatch[1];
    }
  }

  // Regex fallback for retryDelay
  if (retrySeconds === undefined) {
    const retryDelayMatch = rawString.match(/retryDelay["']?:\s*["']?(\d+)/i);
    if (retryDelayMatch) {
      retrySeconds = parseInt(retryDelayMatch[1], 10);
    } else {
      // Look for string format: "retry in 8h48m59s"
      const hmsMatch = rawString.match(
        /retry in\s*(?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?/i
      );
      if (hmsMatch) {
        const hours = parseInt(hmsMatch[1] || '0', 10);
        const mins = parseInt(hmsMatch[2] || '0', 10);
        const secs = parseInt(hmsMatch[3] || '0', 10);
        retrySeconds = hours * 3600 + mins * 60 + secs;
      }
    }
  }

  const isQuota =
    Boolean(totalQuota) ||
    Boolean(retrySeconds) ||
    rawString.includes('RESOURCE_EXHAUSTED') ||
    rawString.includes('429') ||
    rawString.includes('Quota exceeded');

  let remainingTimeBn = 'নির্দিষ্ট সময় পরে';
  let remainingTimeEn = 'after some time';

  if (retrySeconds !== undefined && retrySeconds > 0) {
    const hours = Math.floor(retrySeconds / 3600);
    const minutes = Math.floor((retrySeconds % 3600) / 60);
    remainingTimeBn = `${hours} ঘণ্টা ${minutes} মিনিট`;
    remainingTimeEn = `${hours} hours ${minutes} minutes`;
  }

  const quotaMsgBn = totalQuota ? ` (মোট লিমিট ছিল: ${totalQuota} টি)` : '';
  const quotaMsgEn = totalQuota ? ` (Total limit was: ${totalQuota})` : '';

  const userFriendlyMessageBn = `⚠️ আপনার আজকের ফ্রি ভয়েস কোটা শেষ হয়ে গেছে${quotaMsgBn}!\n⏳ আপনি আবার নতুন ভয়েস তৈরি করতে পারবেন: ${remainingTimeBn} পর।`;
  const userFriendlyMessageEn = `⚠️ Your daily free voice quota has been exhausted${quotaMsgEn}!\n⏳ You will be able to generate new voice again in: ${remainingTimeEn}.`;

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
