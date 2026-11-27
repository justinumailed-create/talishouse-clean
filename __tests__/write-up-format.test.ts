import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseWriteUp,
  stripWriteUpHtml,
  wrapWriteUpSelection,
  WRITE_UP_TOKENS,
} from "../lib/talispros/write-up-format";

function texts(nodes: ReturnType<typeof parseWriteUp>["paragraphs"][0][0]): string {
  return nodes
    .map((node) => (node.type === "text" ? node.value : texts(node.children)))
    .join("");
}

describe("personal home write-up formatting", () => {
  it("leaves plain text and line breaks unchanged", () => {
    const text = "Welcome to my personal Home Page.\n\nOpen my Mapsite to explore.";
    const doc = parseWriteUp(text);
    expect(doc.paragraphs).toHaveLength(2);
    expect(doc.paragraphs[0]).toHaveLength(1);
    expect(texts(doc.paragraphs[0][0])).toBe("Welcome to my personal Home Page.");
    expect(texts(doc.paragraphs[1][0])).toBe("Open my Mapsite to explore.");
    expect(doc.paragraphs[0][0]).toEqual([
      { type: "text", value: "Welcome to my personal Home Page." },
    ]);
  });

  it("bolds a first line without eating the following line break", () => {
    const text = "**Welcome to my personal Home Page.**\nThe rest stays plain.";
    const doc = parseWriteUp(text);
    expect(doc.paragraphs).toHaveLength(1);
    expect(doc.paragraphs[0]).toHaveLength(2);
    expect(doc.paragraphs[0][0]).toEqual([
      { type: "bold", children: [{ type: "text", value: "Welcome to my personal Home Page." }] },
    ]);
    expect(doc.paragraphs[0][1]).toEqual([
      { type: "text", value: "The rest stays plain." },
    ]);
  });

  it("parses italic and underline markers", () => {
    const doc = parseWriteUp("This is *italic* and ++underlined++ text.");
    const line = doc.paragraphs[0][0];
    expect(line).toEqual([
      { type: "text", value: "This is " },
      { type: "italic", children: [{ type: "text", value: "italic" }] },
      { type: "text", value: " and " },
      { type: "underline", children: [{ type: "text", value: "underlined" }] },
      { type: "text", value: " text." },
    ]);
  });

  it("treats pasted HTML and scripts as plain text", () => {
    const raw = 'Safe <script>alert("x")</script> and <b>not html</b> **bold**.';
    const stripped = stripWriteUpHtml(raw);
    expect(stripped).toBe('Safe alert("x") and not html **bold**.');
    const doc = parseWriteUp(raw);
    const flat = texts(doc.paragraphs[0][0]);
    expect(flat).toContain("<script>");
    expect(flat).toContain("**bold**".slice(0, 0) + "bold");
    expect(JSON.stringify(doc)).not.toContain("dangerouslySetInnerHTML");
  });

  it("wraps and unwraps a selection with toolbar tokens", () => {
    const start = wrapWriteUpSelection("Welcome home", 0, 7, WRITE_UP_TOKENS.bold);
    expect(start.value).toBe("**Welcome** home");
    const undone = wrapWriteUpSelection(start.value, start.start - 2, start.end + 2, WRITE_UP_TOKENS.bold);
    expect(undone.value).toBe("Welcome home");
  });

  it("does not render write-ups with innerHTML in the public page or editor preview", () => {
    const renderer = readFileSync(
      join(__dirname, "../components/talispros/personal-home/PersonalHomeWriteUp.tsx"),
      "utf8",
    );
    expect(renderer).toContain("<strong");
    expect(renderer).toContain("<em");
    expect(renderer).toContain("<u");
    expect(renderer).not.toContain("dangerouslySetInnerHTML");
    const page = readFileSync(join(__dirname, "../app/home/[fastCode]/page.tsx"), "utf8");
    expect(page).toContain("PersonalHomeWriteUp");
    expect(page).not.toContain("paragraphs.map");
    const editor = readFileSync(
      join(__dirname, "../components/talispros/personal-home/PersonalHomeEditor.tsx"),
      "utf8",
    );
    expect(editor).toContain("personal-home-writeup-toolbar");
    expect(editor).toContain("WRITE_UP_TOKENS");
    expect(editor).toContain("onWriteUpKeyDown");
  });
});
