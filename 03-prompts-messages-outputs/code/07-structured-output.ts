/**
 * Structured Output Example
 * Run: npx tsx 03-prompts-messages-outputs/code/07-structured-output.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does withStructuredOutput() ensure the response matches the schema?"
 * - "Can I make some Zod schema fields optional instead of required?"
 */

import { createChatModel } from "../../scripts/create-model.js";
import * as z from "zod";
import "dotenv/config";

async function main() {
  console.log("📋 Structured Output Example\n");

  const model = createChatModel();

  // Define the structure using Zod schema
  const PersonSchema = z.object({
    name: z.string().describe("The person's full name"),
    age: z.number().describe("The person's age in years"),
    email: z.string().email().describe("The person's email address"),
    occupation: z.string().describe("The person's job or profession"),
  });

  // Create a model that returns structured output
  // strict: true ensures the model output exactly matches the schema (recommended)
  const structuredModel = model.withStructuredOutput(PersonSchema, {
    strict: true,
  });

  console.log("🧪 Testing with different inputs:\n");
  console.log("=".repeat(80));

  // Test 1: Complete information
  console.log("\n1️⃣  Complete Information:\n");
  const result1 = await structuredModel.invoke(
    "My name is Alice Johnson, I'm 28 years old, work as a software engineer, and you can reach me at alice.j@email.com"
  );

  console.log("✅ Structured Output (typed!):");
  console.log(JSON.stringify(result1, null, 2));
  console.log("\n📝 Type-safe field access:");
  console.log(`   Name: ${result1.name}`);
  console.log(`   Age: ${result1.age} years old`);
  console.log(`   Email: ${result1.email}`);
  console.log(`   Occupation: ${result1.occupation}`);

  // Test 2: Casual conversation
  console.log("\n" + "=".repeat(80));
  console.log("\n2️⃣  From Casual Conversation:\n");
  const result2 = await structuredModel.invoke(
    "Hey! I'm Bob, a 35-year-old data scientist. You can email me at bob.smith@company.com"
  );

  console.log("✅ Extracted Data:");
  console.log(JSON.stringify(result2, null, 2));

  // Test 3: Resume-like format
  console.log("\n" + "=".repeat(80));
  console.log("\n3️⃣  From Resume Text:\n");
  const result3 = await structuredModel.invoke(
    "Sarah Martinez | Marketing Director | Age: 42 | Contact: sarah.m@marketing.co"
  );

  console.log("✅ Parsed Resume:");
  console.log(JSON.stringify(result3, null, 2));

  console.log("\n" + "=".repeat(80));
  console.log("\n💡 Benefits of Structured Outputs:");
  console.log("   - ✅ Type-safe data access (TypeScript knows the types!)");
  console.log("   - ✅ No manual parsing needed");
  console.log("   - ✅ Validation built-in (age is number, email is valid)");
  console.log("   - ✅ Consistent format regardless of input style");
  console.log("   - ✅ Easy to integrate with databases, APIs, and UI");
}

main().catch(console.error);
