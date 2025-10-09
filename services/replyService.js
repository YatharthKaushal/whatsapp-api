import { sendWhatsAppText } from "./whatsappService.js";
import generateAIReply from "../langchain/aiResponder.js";

/**
 * High-level service to process an incoming message and respond via WhatsApp.
 *
 * Responsibilities:
 * 1. Generate AI reply using the LLM and prompt template.
 * 2. Send the generated reply back to the sender's WhatsApp number.
 * 3. Log detailed steps for observability.
 *
 * @param {Object} params
 * @param {string} params.senderNumber - WhatsApp WA_ID (E.164 format preferred).
 * @param {string} [params.senderName] - Optional sender's display name.
 * @param {string} params.messageText - The text received from the sender.
 */
export async function handleIncomingMessage({
  senderNumber,
  senderName,
  messageText,
}) {
  console.log("[ReplyService] Handling incoming message", {
    senderNumber,
    hasName: Boolean(senderName),
    textLength: messageText?.length ?? 0,
  });

  if (!senderNumber) {
    console.warn("[ReplyService] Missing senderNumber. Aborting reply.");
    return;
  }

  const replyText = await generateAIReply({ messageText, senderName });

  try {
    console.log("[ReplyService] Sending AI reply to user", {
      to: senderNumber,
      length: replyText.length,
    });
    await sendWhatsAppText({
      to: senderNumber,
      body: replyText,
      previewUrl: false,
    });
    console.log("[ReplyService] Reply sent successfully");
  } catch (err) {
    console.error(
      "[ReplyService] Failed to send reply:",
      err?.response?.data || err?.message || err
    );
  }
}

export default handleIncomingMessage;
