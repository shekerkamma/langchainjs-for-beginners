/**
 * Shared Model Configuration Utilities
 *
 * Supports two provider modes, set via .env:
 *
 * Mode A — Anthropic (chat) + GitHub Models (embeddings):
 *   AI_PROVIDER=anthropic
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   AI_MODEL=claude-sonnet-4-5
 *   GITHUB_MODELS_KEY=github_pat_...   ← fine-grained PAT, models:read scope
 *   AI_EMBEDDING_MODEL=text-embedding-3-small
 *
 * Mode B — GitHub Models / Azure for everything:
 *   AI_API_KEY=github_pat_... (or Azure key)
 *   AI_ENDPOINT=https://models.inference.ai.azure.com
 *   AI_MODEL=openai/gpt-4.1-mini
 *   AI_EMBEDDING_MODEL=text-embedding-3-small
 *
 * Usage:
 *   import { createChatModel, createEmbeddingsModel } from "../../scripts/create-model.js";
 *   const model = createChatModel();
 *   const embeddings = createEmbeddingsModel();
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com";

/**
 * Creates a chat model.
 * Uses ChatAnthropic when AI_PROVIDER=anthropic, otherwise ChatOpenAI.
 */
export function createChatModel(options?: Record<string, unknown>) {
  if (process.env.AI_PROVIDER === "anthropic") {
    return new ChatAnthropic({
      model: process.env.AI_MODEL ?? "claude-sonnet-4-5",
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(options as ConstructorParameters<typeof ChatAnthropic>[0]),
    });
  }
  return new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
    ...(options as ConstructorParameters<typeof ChatOpenAI>[0]),
  });
}

/**
 * Creates an embeddings model.
 *
 * When AI_PROVIDER=anthropic, uses GITHUB_MODELS_KEY against the GitHub Models
 * endpoint — Anthropic has no native embedding model so we route embeddings to
 * GitHub Models (free, text-embedding-3-small).
 *
 * Falls back to AI_API_KEY + AI_ENDPOINT for the GitHub Models / Azure mode.
 */
export function createEmbeddingsModel(options?: ConstructorParameters<typeof OpenAIEmbeddings>[0]) {
  const isAnthropic = process.env.AI_PROVIDER === "anthropic";

  const apiKey = isAnthropic
    ? process.env.GITHUB_MODELS_KEY
    : process.env.AI_API_KEY;

  const endpoint = isAnthropic
    ? GITHUB_MODELS_ENDPOINT
    : process.env.AI_ENDPOINT;

  if (isAnthropic && !apiKey) {
    throw new Error(
      "GITHUB_MODELS_KEY is not set. Embeddings require a GitHub Models fine-grained PAT " +
      "(models:read scope). Add it to your .env file."
    );
  }

  return new OpenAIEmbeddings({
    model: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    configuration: { baseURL: endpoint },
    apiKey,
    ...options,
  });
}
