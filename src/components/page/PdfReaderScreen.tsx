import React from "react";
import { Platform } from "react-native";
import { PdfReaderScreen as NativePdfReader } from "./PdfReaderScreen.native";
import { PdfReaderScreen as WebPdfReader } from "./PdfReaderScreen.web";

export function PdfReaderScreen() {
  if (Platform.OS === "web") {
    return <WebPdfReader />;
  }
  return <NativePdfReader />;
}
