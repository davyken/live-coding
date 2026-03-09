import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

// Check if credentials are valid (not placeholder values)
const isValidCredentials = apiKey && apiSecret && 
  apiKey.length > 10 && 
  !apiKey.includes(" ") &&
  apiSecret.length > 10;

if (!isValidCredentials) {
  console.warn("⚠️  Stream API credentials are missing or invalid. Video/chat features will be disabled.");
  console.warn("   To enable, add valid STREAM_API_KEY and STREAM_API_SECRET to .env");
}

export const chatClient = isValidCredentials ? StreamChat.getInstance(apiKey, apiSecret) : null;
export const streamClient = isValidCredentials ? new StreamClient(apiKey, apiSecret) : null;

export const isStreamEnabled = () => isValidCredentials;

export const upsertStreamUser = async (userData) => {
  try {
    await chatClient.upsertUser(userData);
    console.log("Stream user upserted successfully:", userData);
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await chatClient.deleteUser(userId);
    console.log("Stream user deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting the Stream user:", error);
  }
};
