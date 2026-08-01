import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

export function PdfReaderScreen() {
  const { uri, title } = useLocalSearchParams<{ uri: string; title?: string }>();
  const [iframeError, setIframeError] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  const decodedUri = uri ? decodeURIComponent(uri as string) : null;

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={goBack} accessibilityLabel="Close PDF">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || "PDF Reader"}
          </Text>
        </View>

        {/* Open in new tab button */}
        {decodedUri && (
          <Pressable
            style={styles.headerAction}
            accessibilityLabel="Open in new tab"
            onPress={() => window.open(decodedUri, "_blank")}
          >
            <Feather name="external-link" size={18} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* ── Content ── */}
      {!decodedUri || iframeError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#CBD5E1" />
          <Text style={styles.errorTitle}>PDF unavailable</Text>
          <Text style={styles.errorText}>
            The document could not be displayed.
          </Text>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        // Browsers natively render PDFs in iframes — no external viewer needed
        <iframe
          src={decodedUri}
          title={title || "PDF Reader"}
          style={{
            flex: 1,
            border: "none",
            width: "100%",
            height: "100%",
            backgroundColor: "#1A1A2E",
          }}
          onError={() => setIframeError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },

  // Header
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  // Error / empty
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  errorText: {
    fontSize: 13,
    color: colors.subtitle,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
