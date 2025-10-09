// Import Express.js
import express from "express";
import dotenv from "dotenv";
import test from "./langchain/chat.js";
import handleIncomingMessage from "./services/replyService.js";

// Load environment variables
dotenv.config();

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

if (!verifyToken) {
  console.warn(
    "[WARN] Environment variable VERIFY_TOKEN is not set. Webhook verification may fail."
  );
}

// Utility: convert WhatsApp timestamp (seconds or ms) to ISO string
function toIsoFromTimestamp(ts) {
  if (!ts) return new Date().toISOString();
  const n = Number(ts);
  if (Number.isFinite(n) && n > 0) {
    const ms = String(ts).length <= 10 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// Utility: extract a readable text summary for various message types
function extractTextFromMessage(msg = {}) {
  const type = msg.type;
  if (!type) return null;
  switch (type) {
    case "text":
      return msg.text?.body ?? null;
    case "image":
      return msg.image?.caption ?? "[image]";
    case "video":
      return msg.video?.caption ?? "[video]";
    case "audio":
      return "[audio]";
    case "document":
      return msg.document?.filename ?? "[document]";
    case "sticker":
      return "[sticker]";
    case "location": {
      const lat = msg.location?.latitude;
      const lon = msg.location?.longitude;
      return lat != null && lon != null
        ? `[location: ${lat},${lon}]`
        : "[location]";
    }
    case "contacts":
      return "[contacts]";
    case "button":
      return msg.button?.text ?? "[button]";
    case "interactive": {
      const it = msg.interactive;
      if (!it) return "[interactive]";
      if (it.type === "button_reply")
        return it.button_reply?.title ?? "[button_reply]";
      if (it.type === "list_reply")
        return it.list_reply?.title ?? "[list_reply]";
      return "[interactive]";
    }
    default:
      return `[${type}]`;
  }
}

// Transform a single change entry to 0..n normalized events
function normalizeChangeToEvents(change = {}) {
  const field = change.field || "unknown";
  const value = change.value || {};

  if (field !== "messages" || !Array.isArray(value.messages)) {
    return [
      {
        eventName: field,
        senderNumber: null,
        senderName: null,
        receivedText: null,
        timeReceived: new Date().toISOString(),
        rawPayload: value,
      },
    ];
  }

  const contacts = Array.isArray(value.contacts) ? value.contacts : [];
  const contactMap = new Map();
  for (const c of contacts) {
    if (c?.wa_id) contactMap.set(c.wa_id, c);
  }

  return value.messages.map((m = {}) => {
    const waId = m.from || contacts[0]?.wa_id || null;
    const contact = waId
      ? contactMap.get(waId) || contacts.find((c) => c?.wa_id === waId)
      : contacts[0];
    const name = contact?.profile?.name || null;
    const text = extractTextFromMessage(m);
    const eventName = `messages.${m?.type || "unknown"}`;
    const timeReceived = toIsoFromTimestamp(m?.timestamp);

    return {
      eventName,
      senderNumber: waId || null,
      senderName: name || null,
      receivedText: text || null,
      timeReceived,
      rawPayload: m,
    };
  });
}

// Parse the full webhook body into a flat list of normalized events
function parseWebhookBody(body = {}) {
  const entries = Array.isArray(body.entry) ? body.entry : [];
  const events = [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const evs = normalizeChangeToEvents(change);
      events.push(...evs);
    }
  }
  return events;
}

// Log event in the requested structured manner
function logStructuredEvent(event, fullPayload) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`\nWebhook received ${ts}`);
  console.log(`- event name: ${event.eventName}`);
  console.log(`- sender's number: ${event.senderNumber ?? "N/A"}`);
  console.log(`- sender's name: ${event.senderName ?? "N/A"}`);
  console.log(`- received text: ${event.receivedText ?? "N/A"}`);
  console.log(`- time received: ${event.timeReceived ?? "N/A"}`);
  console.log("- full response:");
  console.log(JSON.stringify(fullPayload, null, 2));
}

// Route for GET requests
app.get("/", (req, res) => {
  const {
    "hub.mode": mode,
    "hub.challenge": challenge,
    "hub.verify_token": token,
  } = req.query;

  const isSubscribe = String(mode || "").toLowerCase() === "subscribe";
  if (isSubscribe && token === verifyToken) {
    console.log("WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    console.warn("[WARN] Webhook verification failed.", {
      mode,
      hasToken: Boolean(token),
    });
    res.status(403).end();
  }
});

// Route for POST requests
app.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      console.warn("[WARN] Invalid webhook payload (not an object).");
      return res.sendStatus(200);
    }

    const events = parseWebhookBody(body);

    if (!events.length) {
      console.info("[INFO] No events found in webhook payload.");
      logStructuredEvent(
        {
          eventName: "unknown",
          senderNumber: null,
          senderName: null,
          receivedText: null,
          timeReceived: new Date().toISOString(),
          rawPayload: {},
        },
        body
      );
      return res.sendStatus(200);
    }

    for (const ev of events) {
      logStructuredEvent(ev, body);

      // If it is a message from a user, generate AI reply and send
      if (ev.eventName.startsWith("messages.")) {
        const to = ev.senderNumber;
        const name = ev.senderName;
        const text = ev.receivedText;

        if (to && text) {
          try {
            console.log("[Reply] Handling inbound user message", {
              to,
              hasName: Boolean(name),
              length: text.length,
            });
            await handleIncomingMessage({
              senderNumber: to,
              senderName: name,
              messageText: text,
            });
          } catch (sendErr) {
            console.error(
              "[Reply] Failed to handle incoming message",
              sendErr?.response?.data || sendErr?.message || sendErr
            );
          }
        } else {
          console.warn(
            "[Reply] Missing sender number or message text; skipping reply",
            {
              toPresent: Boolean(to),
              hasText: Boolean(text),
            }
          );
        }
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("[ERROR] Exception while handling webhook:", err);
    return res.sendStatus(200);
  }
});

app.get("/test", async (req, res) => {
  console.log("> recieved");
  await test();
  res.send("completed");
});

// Global error handler (for unexpected errors in other routes/middleware)
app.use((err, _req, res, _next) => {
  console.error("[ERROR] Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
