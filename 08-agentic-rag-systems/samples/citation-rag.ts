/**
 * Chapter 7 Sample: Agentic RAG with Citation Generator
 *
 * This demonstrates how an agent decides when to search documents
 * and automatically generates citations for retrieved information.
 *
 * Run: npx tsx 07-agentic-rag-systems/samples/citation-rag.ts
 */

import { createEmbeddingsModel } from "../../scripts/create-model.js";
import { createChatModel } from "../../scripts/create-model.js";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

// Knowledge base with rich metadata
const knowledgeBase = [
  new Document({
    pageContent:
      "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves.",
    metadata: {
      title: "Introduction to Machine Learning",
      section: "Chapter 1",
      page: 12,
      author: "AI Research Team",
    },
  }),
  new Document({
    pageContent:
      "Supervised learning involves training a model on labeled data. The algorithm learns to map inputs to outputs based on example input-output pairs. Common applications include classification and regression problems.",
    metadata: {
      title: "Supervised Learning Fundamentals",
      section: "Chapter 2",
      page: 34,
      author: "AI Research Team",
    },
  }),
  new Document({
    pageContent:
      "Neural networks are computing systems inspired by biological neural networks. They consist of layers of interconnected nodes (neurons) that process and transform data. Deep learning uses neural networks with many layers.",
    metadata: {
      title: "Neural Networks Explained",
      section: "Chapter 3",
      page: 56,
      author: "Deep Learning Group",
    },
  }),
  new Document({
    pageContent:
      "Natural Language Processing (NLP) enables computers to understand, interpret, and generate human language. Techniques include tokenization, part-of-speech tagging, named entity recognition, and sentiment analysis.",
    metadata: {
      title: "Natural Language Processing",
      section: "Chapter 5",
      page: 89,
      author: "NLP Research Lab",
    },
  }),
  new Document({
    pageContent:
      "Transfer learning involves taking a pre-trained model and fine-tuning it for a specific task. This approach saves time and resources while often achieving better performance than training from scratch.",
    metadata: {
      title: "Transfer Learning Techniques",
      section: "Chapter 7",
      page: 134,
      author: "AI Research Team",
    },
  }),
];

async function main() {
  console.log("📝 Agentic RAG with Citation Generator\n");
  console.log("=".repeat(80) + "\n");

  const embeddings = createEmbeddingsModel();

  const model = createChatModel();

  console.log("📚 Loading knowledge base with rich metadata...\n");

  const vectorStore = await MemoryVectorStore.fromDocuments(knowledgeBase, embeddings);

  // Create retrieval tool that includes citations
  const searchWithCitations = tool(
    async (input) => {
      const results = await vectorStore.similaritySearchWithScore(input.query, 3);

      // Format results with citation numbers
      const formattedResults = results
        .map((result, index) => {
          const doc = result[0];
          const score = result[1];
          const relevancePercent = Math.round((1 - score) * 100);

          return `[${index + 1}] ${doc.pageContent}
Source: ${doc.metadata.title} - ${doc.metadata.section} (Page ${doc.metadata.page})
Author: ${doc.metadata.author}
Relevance: ${relevancePercent}%`;
        })
        .join("\n\n");

      return formattedResults || "No relevant documents found.";
    },
    {
      name: "searchKnowledgeBase",
      description:
        "Search the knowledge base for information about machine learning, NLP, neural networks, and AI topics. Use this when you need specific technical information from the knowledge base. The tool returns results with citation numbers [1], [2], [3] that you should reference in your answer.",
      schema: z.object({
        query: z.string().describe("The search query to find relevant documents"),
      }),
    }
  );

  // Create agent with citation-aware retrieval tool
  const agent = createAgent({
    model,
    tools: [searchWithCitations],
  });

  console.log("✅ Agentic citation system ready!\n");
  console.log("=".repeat(80) + "\n");

  // Questions to test - mix of general knowledge and knowledge base questions
  const questions = [
    "What is machine learning?", // Should use retrieval
    "What is 2 + 2?", // Should answer directly
    "Explain neural networks and deep learning", // Should use retrieval
    "What color is the sky?", // Should answer directly
    "What is NLP and what can it do?", // Should use retrieval
  ];

  for (const question of questions) {
    console.log(`❓ Question: ${question}\n`);
    console.log("─".repeat(80) + "\n");

    const response = await agent.invoke({
      messages: [new HumanMessage(question)],
    });

    const lastMessage = response.messages[response.messages.length - 1];
    console.log(`🤖 Answer:\n${lastMessage.content}\n`);

    // Check if agent used the retrieval tool
    const toolUse = response.messages.find(
      (msg) => msg instanceof AIMessage && msg.tool_calls && msg.tool_calls.length > 0
    );

    if (toolUse) {
      console.log("─".repeat(80));
      console.log("\n✅ Agent Decision: Used knowledge base search");
      console.log("   📚 Citations included in answer\n");
    } else {
      console.log("─".repeat(80));
      console.log("\n✅ Agent Decision: Answered from general knowledge");
      console.log("   💡 No retrieval needed\n");
    }

    console.log("=".repeat(80) + "\n");
  }

  console.log("✅ Agentic Citation RAG Complete!\n");
  console.log("💡 Key Features:");
  console.log("   ✓ Agent decides when to search vs answer directly");
  console.log("   ✓ Automatic citation generation with [1], [2], [3] format");
  console.log("   ✓ Detailed source information (title, section, page, author)");
  console.log("   ✓ Relevance scores for each source");
  console.log("   ✓ Intelligent decision-making (no unnecessary searches)");
  console.log("\n📊 Comparison to Traditional Approach:");
  console.log("   • Traditional RAG: Always searches, even for '2 + 2'");
  console.log("   • Agentic: Only searches when knowledge base information is needed");
  console.log("   • Result: More efficient, lower cost, better user experience");
}

main().catch(console.error);
