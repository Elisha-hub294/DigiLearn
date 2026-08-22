import { Image } from "expo-image";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import fallbackAvatar from "../../../assets/images/panda.png";
import { colors, radius, spacing } from "../../constants/theme";

// ─── Math & Equation Formatting Helper ──────────────────────────────────────

const SUPER_MAP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ",
  "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ",
  "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ",
  "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
  "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
};

const SUB_MAP: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
  "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
  "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
  "v": "ᵥ", "x": "ₓ",
};

function toSuperscript(str: string): string {
  return str
    .split("")
    .map((ch) => SUPER_MAP[ch] ?? ch)
    .join("");
}

function toSubscript(str: string): string {
  return str
    .split("")
    .map((ch) => SUB_MAP[ch] ?? ch)
    .join("");
}

function convertIndices(text: string): string {
  return text
    .replace(/\^\{([^}]+)\}/g, (_, inner) => toSuperscript(inner))
    .replace(/\^\(([^)]+)\)/g, (_, inner) => toSuperscript(inner))
    .replace(/\^([0-9a-zA-Z+=-]+)/g, (_, inner) => toSuperscript(inner))
    .replace(/_\{([^}]+)\}/g, (_, inner) => toSubscript(inner))
    .replace(/_\(([^)]+)\)/g, (_, inner) => toSubscript(inner))
    .replace(/_([0-9a-zA-Z+=-]+)/g, (_, inner) => toSubscript(inner));
}

function formatMathString(latexOrMath: string): string {
  const formatted = latexOrMath
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, "√$1")
    .replace(/\\pm/g, "±")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\neq/g, "≠")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\approx/g, "≈")
    .replace(/\\infty/g, "∞")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\delta/g, "δ")
    .replace(/\\cdot/g, "·")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\\$/g, "$");

  return convertIndices(formatted);
}

// ─── Fraction & Formula Component ───────────────────────────────────────────

function FractionView({ num, den }: { num: string; den: string }) {
  return (
    <View style={fractionStyles.container}>
      <Text style={fractionStyles.numerator}>{convertIndices(num.trim())}</Text>
      <View style={fractionStyles.line} />
      <Text style={fractionStyles.denominator}>{convertIndices(den.trim())}</Text>
    </View>
  );
}

type MathToken =
  | { kind: "text"; text: string }
  | { kind: "fraction"; num: string; den: string };

function parseMathTokens(formula: string): MathToken[] {
  const cleaned = formula
    .replace(/\\cos/g, "cos")
    .replace(/\\sin/g, "sin")
    .replace(/\\tan/g, "tan")
    .replace(/\\log/g, "log")
    .replace(/\\ln/g, "ln")
    .replace(/\^\\circ|\^o|\\circ/g, "°");

  const tokens: MathToken[] = [];
  const pattern =
    /\\frac\{([^}]+)\}\{([^}]+)\}|\(([^)]+)\)\s*\/\s*\(([^)]+)\)|([0-9a-zA-Z²³⁺⁻⁰-⁹\s+*-]+)\s*\/\s*([0-9a-zA-Z²³⁺⁻⁰-⁹\s+*-]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", text: cleaned.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      tokens.push({ kind: "fraction", num: match[1], den: match[2] });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      tokens.push({ kind: "fraction", num: match[3], den: match[4] });
    } else if (match[5] !== undefined && match[6] !== undefined) {
      const num = match[5].trim();
      const den = match[6].trim();
      if (num && den) {
        tokens.push({ kind: "fraction", num, den });
      } else {
        tokens.push({ kind: "text", text: match[0] });
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleaned.length) {
    tokens.push({ kind: "text", text: cleaned.slice(lastIndex) });
  }

  return tokens;
}

function MathFormulaView({ formula }: { formula: string }) {
  const tokens = parseMathTokens(formula);

  return (
    <View style={mdStyles.formulaRow}>
      {tokens.map((token, i) => {
        if (token.kind === "fraction") {
          return <FractionView key={i} num={token.num} den={token.den} />;
        }
        return (
          <Text key={i} style={mdStyles.mathFormulaText}>
            {convertIndices(token.text)}
          </Text>
        );
      })}
    </View>
  );
}

const fractionStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    paddingHorizontal: 2,
  },
  numerator: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 13,
    fontWeight: "600",
    color: "#0369A1",
    textAlign: "center",
    paddingBottom: 1,
  },
  line: {
    height: 1.5,
    backgroundColor: "#0284C7",
    width: "100%",
    minWidth: 16,
    marginVertical: 1,
  },
  denominator: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 13,
    fontWeight: "600",
    color: "#0369A1",
    textAlign: "center",
    paddingTop: 1,
  },
});

// ─── Inline markdown parser ─────────────────────────────────────────────────
// Splits a line of text into styled segments (bold, italic, code, math, plain).

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "math"; value: string }
  | { type: "bolditalic"; value: string };

function parseInline(line: string): Segment[] {
  const segments: Segment[] = [];
  // Order matters: bolditalic before bold before italic, math before plain text
  const pattern =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|`(.+?)`|\$(.+?)\$|\\\((.+?)\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: line.slice(lastIndex, match.index) });
    }
    const full = match[0];
    if (full.startsWith("***")) {
      segments.push({ type: "bolditalic", value: match[2] });
    } else if (full.startsWith("**") || full.startsWith("__")) {
      segments.push({ type: "bold", value: match[3] ?? match[4] });
    } else if (full.startsWith("_") || full.startsWith("*")) {
      segments.push({ type: "italic", value: match[5] ?? match[6] });
    } else if (full.startsWith("`")) {
      segments.push({ type: "code", value: match[7] });
    } else if (full.startsWith("$") || full.startsWith("\\(")) {
      const rawMath = match[8] ?? match[9];
      segments.push({ type: "math", value: formatMathString(rawMath) });
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < line.length) {
    segments.push({ type: "text", value: line.slice(lastIndex) });
  }
  return segments;
}

function InlineText({ segments, baseStyle }: { segments: Segment[]; baseStyle: object }) {
  return (
    <Text style={baseStyle}>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "bold":
            return <Text key={i} style={inlineStyles.bold}>{convertIndices(seg.value)}</Text>;
          case "italic":
            return <Text key={i} style={inlineStyles.italic}>{convertIndices(seg.value)}</Text>;
          case "bolditalic":
            return <Text key={i} style={inlineStyles.boldItalic}>{convertIndices(seg.value)}</Text>;
          case "code":
            return <Text key={i} style={inlineStyles.inlineCode}>{seg.value}</Text>;
          case "math":
            return <Text key={i} style={inlineStyles.mathInline}>{convertIndices(seg.value)}</Text>;
          default:
            return <Text key={i}>{convertIndices(seg.value)}</Text>;
        }
      })}
    </Text>
  );
}

// ─── Block-level markdown renderer ──────────────────────────────────────────

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; n: number; text: string }
  | { kind: "codeblock"; code: string }
  | { kind: "mathblock"; formula: string }
  | { kind: "divider" }
  | { kind: "paragraph"; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Math block ($$ ... $$ or \[ ... \])
    if (line.trim().startsWith("$$") || line.trim().startsWith("\\[")) {
      const codeLines: string[] = [];
      let inlineContent = line.trim().replace(/^(\$\$|\\\[)/, "").replace(/(\$\$|\\\])$/, "").trim();

      if (inlineContent && (line.trim().endsWith("$$") || line.trim().endsWith("\\]")) && line.trim().length > 4) {
        blocks.push({ kind: "mathblock", formula: formatMathString(inlineContent) });
        i++;
        continue;
      }

      i++;
      while (
        i < lines.length &&
        !lines[i].trim().endsWith("$$") &&
        !lines[i].trim().endsWith("\\]")
      ) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        const endLine = lines[i].trim().replace(/(\$\$|\\\])$/, "").trim();
        if (endLine) codeLines.push(endLine);
        i++;
      }
      blocks.push({
        kind: "mathblock",
        formula: formatMathString(codeLines.join("\n").trim()),
      });
      continue;
    }

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ kind: "codeblock", code: codeLines.join("\n") });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ kind: "divider" });
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      blocks.push({ kind: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^[\s]*[-*+]\s+(.+)/);
    if (bulletMatch) {
      blocks.push({ kind: "bullet", text: bulletMatch[1] });
      i++;
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      blocks.push({ kind: "numbered", n: parseInt(numberedMatch[1], 10), text: numberedMatch[2] });
      i++;
      continue;
    }

    // Blank line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph: accumulate consecutive non-special lines
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^(#{1,6})\s/) &&
      !lines[i].match(/^[\s]*[-*+]\s/) &&
      !lines[i].match(/^[\s]*\d+\.\s/) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("$$") &&
      !lines[i].trim().startsWith("\\[") &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

function MarkdownView({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <View>
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case "heading": {
            const headingStyle = [
              mdStyles.heading,
              block.level === 1 && mdStyles.h1,
              block.level === 2 && mdStyles.h2,
              block.level === 3 && mdStyles.h3,
            ];
            return (
              <Text key={idx} style={headingStyle}>
                {block.text}
              </Text>
            );
          }

          case "bullet":
            return (
              <View key={idx} style={mdStyles.listRow}>
                <Text style={mdStyles.bullet}>•</Text>
                <View style={mdStyles.listContent}>
                  <InlineText segments={parseInline(block.text)} baseStyle={mdStyles.bodyText} />
                </View>
              </View>
            );

          case "numbered":
            return (
              <View key={idx} style={mdStyles.listRow}>
                <Text style={mdStyles.bullet}>{block.n}.</Text>
                <View style={mdStyles.listContent}>
                  <InlineText segments={parseInline(block.text)} baseStyle={mdStyles.bodyText} />
                </View>
              </View>
            );

          case "mathblock":
            return (
              <View key={idx} style={mdStyles.mathCard}>
                <View style={mdStyles.mathHeader}>
                  <Text style={mdStyles.mathBadge}>FORMULA / EQUATION</Text>
                </View>
                <MathFormulaView formula={block.formula} />
              </View>
            );

          case "codeblock":
            return (
              <View key={idx} style={mdStyles.codeBlock}>
                <Text style={mdStyles.codeText}>{block.code}</Text>
              </View>
            );

          case "divider":
            return <View key={idx} style={mdStyles.divider} />;

          case "paragraph":
          default:
            return (
              <View key={idx} style={mdStyles.para}>
                <InlineText segments={parseInline(block.text)} baseStyle={mdStyles.bodyText} />
              </View>
            );
        }
      })}
    </View>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────

export function ChatBubble({
  role,
  message,
  avatar,
}: {
  role: "user" | "assistant";
  message: string;
  avatar?: string | null;
}) {
  const isUser = role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatarWrap}>
          <Image
            source={avatar ? { uri: avatar } : fallbackAvatar}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={styles.userText}>{message}</Text>
        ) : (
          <MarkdownView text={message} />
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  rowUser: {
    justifyContent: "flex-end",
    paddingLeft: 60,
  },
  rowAssistant: {
    justifyContent: "flex-start",
    paddingRight: 60,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  avatar: {
    width: 32,
    height: 32,
  },
  bubble: {
    flexShrink: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    backgroundColor: "#F0F4FF",
  },
  userText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 21,
  },
});

const mdStyles = StyleSheet.create({
  bodyText: {
    color: "#1e1e2e",
    fontSize: 14,
    lineHeight: 22,
    flexWrap: "wrap",
  },
  para: {
    marginBottom: 6,
  },
  heading: {
    color: colors.dark,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 6,
  },
  h1: { fontSize: 20 },
  h2: { fontSize: 17 },
  h3: { fontSize: 15 },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 22,
    marginRight: 6,
    flexShrink: 0,
  },
  listContent: {
    flex: 1,
  },
  mathCard: {
    backgroundColor: "#F0F9FF",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderColor: "#BAE6FD",
    borderWidth: 1,
  },
  mathHeader: {
    marginBottom: 4,
  },
  mathBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.8,
  },
  mathFormulaText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#0369A1",
    lineHeight: 24,
  },
  formulaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  codeBlock: {
    backgroundColor: "#E8ECF8",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#2d2d6b",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 8,
  },
});

const inlineStyles = StyleSheet.create({
  bold: {
    fontWeight: "700",
    color: "#001b5a",
  },
  italic: {
    fontStyle: "italic",
  },
  boldItalic: {
    fontWeight: "700",
    fontStyle: "italic",
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: 12,
    backgroundColor: "#E8ECF8",
    color: "#2d2d6b",
  },
  mathInline: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 14,
    fontWeight: "600",
    color: "#0284C7",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
