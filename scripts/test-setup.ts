/**
 * Setup Test - Verify AI Provider Access
 */
import { createChatModel } from "./create-model.js";
import "dotenv/config";

async function testSetup() {
  console.log("🚀 Testing AI provider connection...\n");

  // Check if required variables are set
  const isAnthropic = process.env.AI_PROVIDER === "anthropic";
  const requiredKey = isAnthropic ? process.env.ANTHROPIC_API_KEY : process.env.AI_API_KEY;

  if (!requiredKey) {
    const varName = isAnthropic ? "ANTHROPIC_API_KEY" : "AI_API_KEY";
    console.error(`❌ ERROR: ${varName} not found in .env file`);
    process.exit(1);
  }

  if (!isAnthropic && !process.env.AI_ENDPOINT) {
    console.error("❌ ERROR: AI_ENDPOINT not found in .env file");
    process.exit(1);
  }

  try {
    const model = createChatModel();

    const response = await model.invoke("Say 'Setup successful!' if you can read this.");

    console.log("✅ SUCCESS! Your AI provider is working!");
    const provider = isAnthropic ? "Anthropic" : process.env.AI_ENDPOINT;
    console.log(`   Provider: ${provider}`);
    console.log(`   Model: ${process.env.AI_MODEL}`);
    console.log("\nModel response:", response.content);
    console.log("\n🎉 You're ready to start the course!");
  } catch (error) {
    console.error("❌ ERROR:", error instanceof Error ? error.message : String(error));
    console.log("\nTroubleshooting:");
    console.log("1. Check your AI_API_KEY in .env file");
    console.log("2. Verify the AI_ENDPOINT is correct");
    console.log("3. Ensure the AI_MODEL is valid for your provider");
    console.log("4. Verify the token/key has no extra spaces");
  }
}

testSetup();
