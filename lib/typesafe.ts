import { TypeSafeClient } from "@typesafe-ai/sdk";

export function getTypeSafeClient() {
  const apiKey = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY;
  
  if (!apiKey) {
    throw new Error("Missing TYPESAFE_API_KEY or JEV_API_KEY environment variable");
  }
  
  return new TypeSafeClient({ apiKey });
}

export const MODEL = "jev-latest";