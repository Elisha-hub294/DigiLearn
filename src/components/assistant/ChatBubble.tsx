import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import fallbackAvatar from "../../../assets/images/panda.png";
import { colors, radius, spacing } from "../../constants/theme";

// ─── Inline markdown parser ─────────────────────────────────────────────────
// Splits a line of text into styled segments (bold, italic, code, plain).

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "bolditalic"; value: string };

function parseInline(line: string): Segment[] {
  const segments: Segment[] = [];
  // Order matters: bolditalic before bold before italic
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|`(.+?)`)/g;
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
            return <Text key={i} style={inlineStyles.bold}>{seg.value}</Text>;
          case "italic":
            return <Text key={i} style={inlineStyles.italic}>{seg.value}</Text>;
          case "bolditalic":
            return <Text key={i} style={inlineStyles.boldItalic}>{seg.value}</Text>;
          case "code":
            return <Text key={i} style={inlineStyles.inlineCode}>{seg.value}</Text>;
          default:
            return <Text key={i}>{seg.value}</Text>;
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
  | { kind: "divider" }
  | { kind: "paragraph"; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

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
    paddingLeft: 60, // prevent user bubble from spanning full width
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
});
