/**
 * Migrates all course TypeScript files from direct ChatOpenAI / OpenAIEmbeddings
 * instantiation to the createChatModel() / createEmbeddingsModel() factory,
 * making all examples provider-agnostic.
 *
 * Run:  npx tsx scripts/migrate-to-factory.ts [--dry-run]
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, relative, dirname, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const SKIP = new Set([
  "02-chat-models/code/04-init-chat-model.ts", // teaching file about provider switching
  "scripts/create-model.ts",
  "scripts/migrate-to-factory.ts",
  "scripts/validate-examples.ts",
  "scripts/validate-examples-parallel.ts",
  "scripts/build-check.ts",
]);

/** Walk a directory tree, yielding .ts file paths. */
function* walkTs(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walkTs(full);
    } else if (entry.endsWith(".ts")) {
      yield full;
    }
  }
}

/** Relative import path from `fromFile` to scripts/create-model.js */
function relativeImport(fromFile: string): string {
  const target = join(ROOT, "scripts", "create-model.js");
  let rel = relative(dirname(fromFile), target).split(sep).join("/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

type Change = string;

function transform(content: string, importPath: string): [string, Change[]] {
  const changes: Change[] = [];
  const chatImport = `import { createChatModel } from "${importPath}";`;
  const embImport = `import { createEmbeddingsModel } from "${importPath}";`;
  const bothImport = `import { createChatModel, createEmbeddingsModel } from "${importPath}";`;

  // ── 1. Rewrite imports ──────────────────────────────────────────────────

  // ChatOpenAI only
  if (/import \{ ChatOpenAI \} from "@langchain\/openai";/.test(content)) {
    content = content.replace(
      /import \{ ChatOpenAI \} from "@langchain\/openai";/g,
      chatImport
    );
    changes.push("rewrote ChatOpenAI-only import");
  }

  // ChatOpenAI + OpenAIEmbeddings (both orders) → both factories, no @langchain/openai left
  for (const pat of [
    /import \{ ChatOpenAI, OpenAIEmbeddings \} from "@langchain\/openai";/g,
    /import \{ OpenAIEmbeddings, ChatOpenAI \} from "@langchain\/openai";/g,
  ]) {
    if (pat.test(content)) {
      pat.lastIndex = 0;
      content = content.replace(pat, bothImport);
      changes.push("rewrote combined ChatOpenAI+OpenAIEmbeddings import → both factories");
    }
  }

  // OpenAIEmbeddings only (ch07 files never had ChatOpenAI)
  if (/import \{ OpenAIEmbeddings \} from "@langchain\/openai";/.test(content)) {
    content = content.replace(
      /import \{ OpenAIEmbeddings \} from "@langchain\/openai";/g,
      embImport
    );
    changes.push("rewrote OpenAIEmbeddings-only import");
  }

  // ── 2. Replace ChatOpenAI constructors ───────────────────────────────────

  const chatCtorPattern =
    /new ChatOpenAI\(\s*\{\s*model:\s*process\.env\.AI_MODEL,?\s*configuration:\s*\{[^}]*?baseURL:\s*process\.env\.AI_ENDPOINT[^}]*?\},?\s*apiKey:\s*process\.env\.AI_API_KEY,?(.*?)\s*\}\s*\)/gs;

  let chatCount = 0;
  content = content.replace(chatCtorPattern, (_match, extra: string) => {
    chatCount++;
    const trimmed = extra.trim().replace(/^,/, "").replace(/,$/, "").trim();
    return trimmed ? `createChatModel({ ${trimmed} })` : "createChatModel()";
  });
  if (chatCount) changes.push(`replaced ${chatCount} ChatOpenAI constructor(s) with createChatModel()`);

  // ── 3. Replace OpenAIEmbeddings constructors ─────────────────────────────

  const embCtorPattern =
    /new OpenAIEmbeddings\(\s*\{\s*model:\s*process\.env\.AI_EMBEDDING_MODEL[^,]*?,?\s*configuration:\s*\{[^}]*?baseURL:\s*process\.env\.AI_ENDPOINT[^}]*?\},?\s*apiKey:\s*process\.env\.AI_API_KEY,?(.*?)\s*\}\s*\)/gs;

  let embCount = 0;
  content = content.replace(embCtorPattern, (_match, extra: string) => {
    embCount++;
    const trimmed = extra.trim().replace(/^,/, "").replace(/,$/, "").trim();
    return trimmed ? `createEmbeddingsModel({ ${trimmed} })` : "createEmbeddingsModel()";
  });
  if (embCount) changes.push(`replaced ${embCount} OpenAIEmbeddings constructor(s) with createEmbeddingsModel()`);

  return [content, changes];
}

function processFile(absPath: string): void {
  const rel = relative(ROOT, absPath).split(sep).join("/");
  if (SKIP.has(rel)) {
    console.log(`  SKIP   ${rel}`);
    return;
  }

  const original = readFileSync(absPath, "utf8");
  const needsMigration = original.includes("ChatOpenAI") || original.includes("OpenAIEmbeddings");
  if (!needsMigration) return;

  const [updated, changes] = transform(original, relativeImport(absPath));

  if (!changes.length) {
    const leftovers = ["ChatOpenAI", "OpenAIEmbeddings"].filter((s) => updated.includes(s));
    if (leftovers.length) {
      console.log(`  MANUAL ${rel}  ← still has ${leftovers.join(", ")}, needs hand edit`);
    }
    return;
  }

  if (updated !== original && !DRY_RUN) {
    writeFileSync(absPath, updated, "utf8");
  }

  const status = DRY_RUN ? "DRY   " : "DONE  ";
  console.log(`  ${status} ${rel}`);
  changes.forEach((c) => console.log(`         - ${c}`));
}

// ── Main ──────────────────────────────────────────────────────────────────

const files = [...walkTs(ROOT)].sort();
console.log(`${DRY_RUN ? "DRY RUN — " : ""}Migrating ${files.length} TypeScript files...\n`);
files.forEach(processFile);
console.log("\nDone.");
