import dotenv from "dotenv";
dotenv.config();
import Paystack from "paystack-node";

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.error("❌ ERROR: PAYSTACK_SECRET_KEY is missing in .env");
}

const paystack = new Paystack(
  process.env.PAYSTACK_SECRET_KEY,
  process.env.NODE_ENV === "production" ? "production" : "development"
);

export const initializeTransaction = async ({ email, amount, callback_url, metadata, subaccount, isGift = false }) => {
  try {
    const body = {
      email,
      amount,
      callback_url,
      metadata: JSON.stringify(metadata),
    };

    if (isGift && subaccount) {
      body.subaccount = subaccount;
      body.transaction_charge = 0; 
    }

    const response = await paystack.initializeTransaction(body);
    if (!response.status) {
      console.error("🚨 PAYSTACK REJECTION:", response.message || response);
    }
    return response;
  } catch (error) {
    console.error("🚨 PAYSTACK LIBRARY CRASH:", error.message);
    return { status: false, message: error.message };
  }
};

export const verifyTransaction = async (reference) => {
  try {
    return await paystack.verifyTransaction({ reference });
  } catch (error) {
    console.error("🚨 VERIFICATION ERROR:", error.message);
    return { status: false };
  }
};

export const createSubaccount = async ({ momoName, momoNumber, momoNetwork }) => {
  const bankCodes = { 'MTN': 'MTN', 'VOD': 'VOD', 'ATL': 'ATL' };
  try {
    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_name: momoName,
        settlement_bank: bankCodes[momoNetwork],
        account_number: momoNumber,
        percentage_charge: 10,
        description: `Yenuvia Artist Payout Account for ${momoName}`
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Paystack Service Error:", error);
    throw new Error("Failed to connect to Paystack");
  }
};

/**
 * ✅ FIXED: createTransferRecipient
 * Uses lowercase slugs required by Paystack Payouts API
 */
export const createTransferRecipient = async (name, accountNumber, momoNetwork) => {
  // 🛰️ Paystack Transfer Bank Codes (Ghana Slugs)
  const transferBankMapping = {
  'MTN': 'MTN',
    'VOD': 'VOD',
    'ATL': 'ATL'
  };

  const response = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: "mobile_money",
      name: name,
      account_number: accountNumber,
      bank_code: transferBankMapping[momoNetwork] || 'MTN', 
      currency: "GHS"
    })
  });
  return await response.json();
};

export const releaseFunds = async (amountInGHS, recipientCode, orderId) => {
  const response = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: "balance", 
      amount: Math.round(amountInGHS * 100),
      recipient: recipientCode,
      reason: `Arena Payout for Order ${orderId}`
    })
  });
  return await response.json();
};

// services/paystackService.js
export const refundTransaction = async (reference) => {
  try {
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: reference }),
    });
    return await response.json();
  } catch (error) {
    console.error("Paystack Refund Error:", error);
    return { status: false, message: error.message };
  }
};