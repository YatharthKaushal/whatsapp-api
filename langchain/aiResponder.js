import { HumanMessage } from "@langchain/core/messages";
import model from "./llm.js";
import { msgPromptTemplate } from "./promptTemplates.js";

/**
 * Generate an AI reply using the configured LLM and chat prompt template.
 *
 * The user's message (and name if available) is passed as a single HumanMessage
 * to the ChatPromptTemplate, then the model is invoked to produce a response.
 *
 * @param {Object} params
 * @param {string} params.messageText - The message text received from the sender.
 * @param {string} [params.senderName] - Optional sender's display name.
 * @returns {Promise<string>} - The generated reply text.
 */
export async function generateAIReply({ messageText, senderName }) {
  const text = String(messageText ?? "").trim();
  const name = String(senderName ?? "").trim();

  if (!text) {
    console.log(
      "[AIResponder] Empty incoming message; returning fallback reply."
    );
    return "Could you please share more details about your query?";
  }

  // Per requirement: pass the sender's message, include name if available.
  // Example payloads: "John Doe: I need help with a website" or just the raw text.
  const humanMsgPayload = name ? `${name}: ${text}` : text;

  try {
    console.log("[AIResponder] Generating AI reply", {
      hasName: Boolean(name),
      inputLength: text.length,
    });

    // Build a simple chain: ChatPromptTemplate -> Model
    const chain = msgPromptTemplate.pipe(model);

    // Invoke the chain with the HumanMessage as specified
    const aiMessage = await chain.invoke({
      msgs: [new HumanMessage(humanMsgPayload)],
    });

    // aiMessage.content can be a string or array of parts depending on the model
    if (typeof aiMessage?.content === "string" && aiMessage.content.trim()) {
      const reply = aiMessage.content.trim();
      console.log("[AIResponder] AI reply generated", { length: reply.length });
      return reply;
    }

    if (Array.isArray(aiMessage?.content)) {
      const merged = aiMessage.content
        .map((part) => (typeof part?.text === "string" ? part.text : ""))
        .join("")
        .trim();
      if (merged) {
        console.log("[AIResponder] AI reply (merged parts) generated", {
          length: merged.length,
        });
        return merged;
      }
    }

    console.warn(
      "[AIResponder] Model returned empty content; using fallback reply."
    );
    return "I'm here to help. Could you please clarify your request?";
  } catch (err) {
    console.error(
      "[AIResponder] Failed to generate reply:",
      err?.response?.data || err?.message || err
    );
    // Provide a graceful fallback so the user still gets a response
    return "I couldn't process that right now. Please try again or contact our team at +91 99264 46622 or aibinnovations@gmail.com.";
  }
}

export default generateAIReply;
