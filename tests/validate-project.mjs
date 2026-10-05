import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

function text(path) {
  return readFileSync(join(root, path), "utf8");
}

function walk(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.name === ".git") return [];
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const required = [
  "AGENTS.md",
  ".gitignore",
  "LICENSE.md",
  "README.md",
  "index.html",
  "styles.css",
  "script.js",
  "package.json",
  "assets/cover.svg",
  "assets/workbooth-mark.png",
  "docs/PROJECT_PLAN.md",
  "docs/ROADMAP.md",
  "docs/CHECKLIST.md",
  "docs/TEST_PLAN.md",
];

required.forEach((path) => check(existsSync(join(root, path)), `required file: ${path}`));

const html = text("index.html");
const css = text("styles.css");
const script = text("script.js");
const readme = text("README.md");
const allFiles = walk();
const publicTexts = allFiles
  .filter((path) => !relative(root, path).replaceAll("\\", "/").startsWith("tests/"))
  .filter((path) => [".html", ".css", ".js", ".mjs", ".json", ".md", ".svg"].includes(extname(path).toLowerCase()))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

check(/<html\s+lang="ru"/i.test(html), "document language is Russian");
check(/<title>[^<]{20,}<\/title>/i.test(html), "descriptive title exists");
check(/name="description"/i.test(html), "meta description exists");
check(/class="skip-link"/i.test(html), "skip link exists");
check(/<main[\s>]/i.test(html) && /<footer[\s>]/i.test(html), "main and footer landmarks exist");
check(/id="constellation"/i.test(html) && /id="dashboard"/i.test(html), "AI and Dashboard story sections exist");
check(/без внутренних подробностей|не раскрывает внутреннюю архитектуру/i.test(`${html}\n${readme}`), "public-safe boundary is explicit");
check(/prefers-reduced-motion/i.test(css), "reduced-motion support exists");
check(/IntersectionObserver/.test(script), "progressive reveal uses IntersectionObserver");
check(/<noscript>/i.test(html), "no-script notice exists");
check(/<html\s+lang="ru"\s+class="no-js"/i.test(html), "document starts in no-JavaScript mode");
check(/classList\.replace\("no-js", "js"\)/.test(html), "JavaScript progressively enables reveal effects");
check(/\.reveal\s*\{\s*opacity:\s*1;\s*transform:\s*none;/.test(css), "story content remains visible without JavaScript");

const localRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
const externalRefs = localRefs.filter((ref) => /^(?:https?:)?\/\//i.test(ref));
check(externalRefs.length === 0, "HTML has no external runtime resources");

for (const ref of localRefs) {
  if (ref.startsWith("#")) {
    check(new RegExp(`id=["']${ref.slice(1)}["']`).test(html), `anchor resolves: ${ref}`);
    continue;
  }
  const file = ref.split("#")[0];
  check(existsSync(join(root, file)), `local reference resolves: ${file}`);
}

const forbiddenPatterns = [
  [/(?:password|passwd|secret|access[_-]?token|api[_-]?key)\s*[:=]\s*[^\s<]{6,}/i, "credential-shaped value"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, "private key"],
  [/(?:\d{1,3}\.){3}\d{1,3}/, "IPv4 address"],
  [/workinbooth\.com/i, "operational hostname"],
  [/(?:LocalRuntime|C:\\GitHub\\PASS|D:\\Jarvice|\.env\b)/i, "internal path/state marker"],
  [/(?:mqtt|ssh|wireguard|routeros|gitea|fullgita)/i, "internal technology/route detail"],
];

for (const [pattern, label] of forbiddenPatterns) {
  check(!pattern.test(publicTexts), `public package excludes ${label}`);
}

const unwanted = allFiles
  .map((path) => relative(root, path).replaceAll("\\", "/"))
  .filter((path) => /(^|\/)(node_modules|dist|coverage|LocalRuntime|Pass)(\/|$)|\.log$|\.env/i.test(path));
check(unwanted.length === 0, "tree excludes runtime, dependencies, logs and environment files");

const logo = join(root, "assets/workbooth-mark.png");
check(statSync(logo).size === 931, "WorkBooth mark has expected size");
const logoHash = createHash("sha256").update(readFileSync(logo)).digest("hex");
check(logoHash === "8b446e20d8630785337dfe4bfa8b8c5dcd77d5bd14a248d163881226ee38c1a1", "WorkBooth mark checksum is unchanged");

console.log(`c_history validation: ${passes.length} PASS, ${failures.length} FAIL`);
passes.forEach((message) => console.log(`PASS ${message}`));

if (failures.length > 0) {
  failures.forEach((message) => console.error(`FAIL ${message}`));
  process.exitCode = 1;
}
