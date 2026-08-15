export interface ParsedSms {
  amount: number | null;
  transactionId: string | null;
  date: string | null;
  rawText: string;
}

export interface SmsMatchResult {
  isMatch: boolean;
  matchScore: number; // 0 to 100
  reason: string;
  parsedSms: ParsedSms;
}

export class SmsParserService {
  /**
   * Parse bank or UPI credit SMS to extract amount, transaction ID, and date.
   */
  public static parseSms(smsText: string): ParsedSms {
    if (!smsText || typeof smsText !== "string") {
      return { amount: null, transactionId: null, date: null, rawText: "" };
    }

    const text = smsText.trim();

    // Extract Amount: matches "Rs 5000", "Rs. 5,000.00", "INR 5000", "₹5,000"
    let amount: number | null = null;
    const amountRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const amountMatch = text.match(amountRegex);

    if (amountMatch && amountMatch[1]) {
      const cleanNum = amountMatch[1].replace(/,/g, "");
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed)) {
        amount = parsed;
      }
    }

    // Extract Transaction ID / UPI Ref / UTR / Txn ID
    let transactionId: string | null = null;
    const txnRegexes = [
      /(?:Ref\s*(?:no|num|number)?|UPI|UTR|Txn\s*ID|Transaction\s*ID|rrn)[:\s/-]*([A-Za-z0-9]{8,20})/i,
      /(?:UPI\/|Ref\/)(\d{12})/i,
      /\b(\d{12})\b/, // Standalone 12-digit number (standard Indian UPI RR/Ref)
    ];

    for (const regex of txnRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        transactionId = match[1].trim();
        break;
      }
    }

    // Extract Date if present (e.g. 10Aug26, 10-08-2026, 10/08/26)
    let date: string | null = null;
    const dateRegex = /\b(\d{1,2}[-/\s]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[-/\s]?\d{2,4})\b/i;
    const dateMatch = text.match(dateRegex);
    if (dateMatch && dateMatch[1]) {
      date = dateMatch[1].trim();
    }

    return {
      amount,
      transactionId,
      date,
      rawText: text,
    };
  }

  /**
   * Verify customer submitted payment against pasted bank SMS.
   */
  public static verifyPaymentWithSms(
    submittedAmount: number,
    submittedTxnId: string,
    smsText: string
  ): SmsMatchResult {
    const parsedSms = this.parseSms(smsText);
    const cleanSubmittedTxn = (submittedTxnId || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanSmsText = (smsText || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    if (!cleanSubmittedTxn) {
      return {
        isMatch: false,
        matchScore: 0,
        reason: "No customer Transaction ID provided for verification.",
        parsedSms,
      };
    }

    // Check if customer's transaction ID is in the SMS text
    const txnInSms = cleanSmsText.includes(cleanSubmittedTxn);

    // Check amount match
    const amountMatched =
      parsedSms.amount !== null &&
      Math.abs(parsedSms.amount - Number(submittedAmount)) < 1; // within ₹1 allowance for rounding

    if (txnInSms && amountMatched) {
      return {
        isMatch: true,
        matchScore: 100,
        reason: `✅ Verified! Transaction ID '${submittedTxnId}' and Amount (₹${submittedAmount}) match Bank SMS.`,
        parsedSms,
      };
    }

    if (txnInSms) {
      return {
        isMatch: true,
        matchScore: 85,
        reason: `✅ Transaction ID '${submittedTxnId}' matched in Bank SMS (Amount in SMS: ₹${parsedSms.amount ?? "N/A"}).`,
        parsedSms,
      };
    }

    // Amount match only fallback
    if (amountMatched && parsedSms.transactionId) {
      return {
        isMatch: false,
        matchScore: 40,
        reason: `⚠️ Amount matches (₹${submittedAmount}), but Transaction ID '${submittedTxnId}' was not found in SMS (SMS Txn ID: ${parsedSms.transactionId}).`,
        parsedSms,
      };
    }

    return {
      isMatch: false,
      matchScore: 0,
      reason: `❌ Verification failed. Transaction ID '${submittedTxnId}' was not found in the provided SMS text.`,
      parsedSms,
    };
  }
}
