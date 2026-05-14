/**
 * Multiple Template Formats
 * Run: npx tsx 03-prompts-messages-outputs/code/04-template-formats.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "When should I use ChatPromptTemplate vs PromptTemplate?"
 * - "How does stringTemplate.format() differ from using pipe and invoke?"
 */

import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { createChatModel } from "../../scripts/create-model.js";
import "dotenv/config";

async function main() {
  console.log("🎨 Template Formats Example\n");
  console.log("=".repeat(80));

  const model = createChatModel();

  // Format 1: ChatPromptTemplate (structured messages)
  console.log("\n1️⃣  ChatPromptTemplate (Recommended for chat models):\n");

  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a {role} who speaks in {style} style."],
    ["human", "{question}"],
  ]);

  const chain1 = chatTemplate.pipe(model);

  const result1 = await chain1.invoke({
    role: "pirate captain",
    style: "dramatic and adventurous",
    question: "What is TypeScript?",
  });

  console.log("Pirate response:");
  console.log(result1.content);

  // Format 2: PromptTemplate (simple string-based)
  console.log("\n" + "=".repeat(80));
  console.log("\n2️⃣  PromptTemplate (Simple string format):\n");

  const stringTemplate = PromptTemplate.fromTemplate("Write a {adjective} {item} about {topic}.");

  // Format the template to see the final prompt
  const formattedPrompt = await stringTemplate.format({
    adjective: "funny",
    item: "limerick",
    topic: "JavaScript developers",
  });

  console.log("Generated prompt:", formattedPrompt);

  const result2 = await model.invoke(formattedPrompt);
  console.log("\nResponse:");
  console.log(result2.content);

  // Format 3: Multiple variables
  console.log("\n" + "=".repeat(80));
  console.log("\n3️⃣  Complex Template with Many Variables:\n");

  const complexTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a {job_title} at {company} writing to a {recipient_role}."],
    ["human", "Write a {message_type} about {topic}. Tone: {tone}"],
  ]);

  const chain3 = complexTemplate.pipe(model);

  const result3 = await chain3.invoke({
    job_title: "Senior Developer",
    company: "TechCorp",
    recipient_role: "Product Manager",
    message_type: "brief update",
    topic: "API migration progress",
    tone: "professional but friendly",
  });

  console.log(result3.content);

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Key Takeaways:");
  console.log("   - ChatPromptTemplate: Best for multi-message conversations");
  console.log("   - PromptTemplate: Good for simple single-string prompts");
  console.log("   - Both support multiple variables with {variable} syntax");
  console.log("   - Use .pipe(model) to create chains");
}

main().catch(console.error);
