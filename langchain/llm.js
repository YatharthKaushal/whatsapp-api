import dotenv from "dotenv";
dotenv.config();
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Prefer GOOGLE_API_KEY (expected by Google/SDK), fallback to GEMINI_API_KEY for convenience
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "[LLM] Missing API key. Set GOOGLE_API_KEY or GEMINI_API_KEY in your environment/.env."
  );
}

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  apiKey: API_KEY,
});

export default model;
