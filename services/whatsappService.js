import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

// Environment configuration
const API_VERSION = process.env.API_VERSION || "v23.0";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN =
  process.env.TEMPORARY_ACCESS_TOKEN || process.env.ACCESS_TOKEN;

if (!PHONE_NUMBER_ID) {
  console.warn("[WARN] PHONE_NUMBER_ID is not set in environment variables.");
}
if (!ACCESS_TOKEN) {
  console.warn(
    "[WARN] ACCESS_TOKEN/TEMPORARY_ACCESS_TOKEN is not set in environment variables. Outbound messages will fail."
  );
}

const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

// Build axios instance
const http = axios.create({
  baseURL: GRAPH_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  },
  timeout: 15_000,
});

// Validates E.164 or digits-only formats; returns standardized string
function normalizePhoneNumber(num) {
  if (!num) return null;
  const s = String(num).trim();
  // If already starts with +, keep it; else try to add + if numeric
  if (/^\+\d{6,15}$/.test(s)) return s;
  if (/^\d{6,15}$/.test(s)) return `+${s}`;
  // Some payloads provide without plus; WhatsApp may accept without + as well
  return s;
}

// Core send function for text messages
export async function sendWhatsAppText({ to, body, previewUrl = false }) {
  if (!PHONE_NUMBER_ID) throw new Error("PHONE_NUMBER_ID is not configured");
  if (!ACCESS_TOKEN) throw new Error("ACCESS_TOKEN is not configured");
  const recipient = normalizePhoneNumber(to);
  if (!recipient) throw new Error("Recipient phone number is invalid");
  if (!body) throw new Error("Message body is required");

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      preview_url: Boolean(previewUrl),
      body,
    },
  };

  try {
    console.log("[WhatsApp] Sending message", {
      to: recipient,
      length: body.length,
    });
    const { data, status } = await http.post("", payload);
    console.log("[WhatsApp] Message sent", {
      status,
      id: data?.messages?.[0]?.id,
    });
    return data;
  } catch (error) {
    // Extract Graph API error details if present
    const status = error?.response?.status;
    const errData = error?.response?.data;
    console.error("[WhatsApp] Send failed", {
      status,
      err: errData || error.message,
    });
    throw error;
  }
}

// High-level helper to send Thank You message
export async function sendThankYou(to, name) {
  const greeting = name ? `Thank you, ${name}!` : "Thank you!";
  return sendWhatsAppText({ to, body: greeting, previewUrl: false });
}
