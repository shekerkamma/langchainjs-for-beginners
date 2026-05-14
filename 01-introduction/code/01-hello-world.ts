/**
 * Run: npx tsx 01-introduction/code/01-hello-world.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "What does the invoke() method return and how do I access different properties?"
 * - "How does the configuration baseURL work with different AI providers?"
 */

import "dotenv/config";
import { createChatModel } from "../../scripts/create-model.js";

async function main() {
  console.log("🚀 Hello LangChain.js!\n");
  const model = createChatModel();

  const response = await model.invoke("What is LangChain in one sentence?");

  console.log("🤖 AI Response:", response.content);
  console.log("\n✅ Success! You just made your first LangChain.js call!");
}

main().catch(console.error);
