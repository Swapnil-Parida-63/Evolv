import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
console.log("Current API key:", process.env.API_KEY);

export const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});
