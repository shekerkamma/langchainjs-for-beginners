/**
 * Challenge 3 Solution: System Prompt Experiment
 * Run: npx tsx 01-introduction/solution/personality-test.ts
 *
 * Test how different system prompts affect AI personality.
 */

import { createChatModel } from "../../scripts/create-model.js";
import { HumanMessage, SystemMessage } from "langchain";
import "dotenv/config";

const model = createChatModel();

const personalities = [
  {
    name: "🏴‍☠️ Pirate",
    system:
      "You are a pirate. Answer all questions in pirate speak with 'Arrr!' and nautical terms.",
  },
  {
    name: "💼 Business Analyst",
    system: "You are a professional business analyst. Give precise, data-driven answers.",
  },
  {
    name: "👨‍🏫 Friendly Teacher",
    system: "You are a friendly teacher explaining concepts to 8-year-old children.",
  },
];

const question = "What is artificial intelligence?";

async function testPersonalities() {
  console.log("🎭 Personality Test\n");
  console.log(`Question: "${question}"\n`);
  console.log("=".repeat(80));

  for (const personality of personalities) {
    console.log(`\n${personality.name}`);
    console.log("-".repeat(80));

    const messages = [new SystemMessage(personality.system), new HumanMessage(question)];

    const response = await model.invoke(messages);

    console.log(response.content);
    console.log("\n");

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("=".repeat(80));
  console.log("\n✅ Notice how the same question gets completely different responses!");
  console.log("💡 SystemMessage is powerful for controlling AI behavior.");
}

testPersonalities().catch(console.error);
