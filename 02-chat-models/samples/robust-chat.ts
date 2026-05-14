/**
 * Challenge 4 Solution: Robust Error Handler with Built-In Retries
 * Run: npx tsx 02-chat-models/samples/robust-chat.ts
 */

import { createChatModel } from "../../scripts/create-model.js";
import "dotenv/config";

interface ChatOptions {
  maxRetries?: number;
  timeout?: number;
  fallbackResponse?: string;
}

async function robustChat(prompt: string, options: ChatOptions = {}): Promise<string> {
  const {
    maxRetries = 3,
    timeout = 30000,
    fallbackResponse = "I apologize, but I'm having trouble connecting right now. Please try again later.",
  } = options;

  const model = createChatModel();

  // Use LangChain's built-in retry logic - automatically handles retries with exponential backoff
  const modelWithRetry = model.withRetry({
    stopAfterAttempt: maxRetries,
  });

  try {
    console.log(`🔄 Making call with automatic retry (max ${maxRetries} attempts)...`);

    const response = await modelWithRetry.invoke(prompt);
    console.log(`✅ Success!\n`);

    return response.content.toString();
  } catch (error: any) {
    console.error(`❌ All ${maxRetries} attempts failed: ${error.message}`);

    // Categorize the error
    let errorType = "Unknown error";
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      errorType = "Authentication failed (check API key)";
    } else if (error.message.includes("429") || error.message.includes("rate limit")) {
      errorType = "Rate limit exceeded";
    } else if (error.message.includes("timeout")) {
      errorType = "Request timeout";
    } else if (error.message.includes("network")) {
      errorType = "Network error";
    }

    console.log(`📋 Error type: ${errorType}`);
    console.log(`💡 Returning fallback response\n`);

    return fallbackResponse;
  }
}

async function testRobustChat() {
  console.log("🛡️  Robust Error Handler Test\n");
  console.log("=".repeat(80));
  console.log("\n1️⃣  Test: Normal Call (should succeed)\n");
  const response1 = await robustChat("What is 2+2?");
  console.log("Response:", response1);
  console.log("\n" + "=".repeat(80));
  console.log("\n2️⃣  Test: Invalid API Key (will retry then fallback)\n");

  // Temporarily test with invalid key
  process.env.AI_API_KEY_BACKUP = process.env.AI_API_KEY;
  process.env.AI_API_KEY = "invalid_key";

  const response2 = await robustChat("Hello", {
    maxRetries: 2,
    fallbackResponse: "Sorry, I'm having connection issues. Please try again.",
  });

  console.log("Final response:", response2);

  // Restore valid key
  process.env.AI_API_KEY = process.env.AI_API_KEY_BACKUP;

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Error handling demonstration complete!");
  console.log("\n💡 Key Features Demonstrated:");
  console.log("   - Built-in withRetry() for automatic retries and exponential backoff");
  console.log("   - Error categorization for different error types");
  console.log("   - Graceful fallback responses when all retries fail");
  console.log("   - User-friendly error messages");
  console.log("\n🎯 Benefits of withRetry():");
  console.log("   - Less code (no manual retry loops)");
  console.log("   - Production-tested retry logic");
  console.log("   - Works with agents and RAG systems");
}

testRobustChat().catch(console.error);
