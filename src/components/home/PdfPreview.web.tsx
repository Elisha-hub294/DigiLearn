import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface PdfPreviewProps {
  uri: string;
  style: any;
}

const loadPdfJs = () => {
  return new Promise<any>((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function PdfPreview({ uri, style }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    loadPdfJs()
      .then(async (pdfjsLib) => {
        try {
          const loadingTask = pdfjsLib.getDocument(uri);
          const pdf = await loadingTask.promise;
          if (!active) return;

          const page = await pdf.getPage(1);
          if (!active) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext("2d");
          if (!context) return;

          // Render at a high resolution for crispness, CSS will scale it down
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
          if (active) {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error rendering PDF on web:", err);
          if (active) {
            setError(true);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("Error loading PDF.js:", err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [uri]);

  if (error) {
    return (
      <Image
        source={require("../../../assets/images/pdf-preview.png")}
        style={style}
        contentFit="cover"
        contentPosition="top"
      />
    );
  }

  return (
    <View style={[style, styles.container]}>
      {loading && (
        <View
          style={StyleSheet.absoluteFill}
          className="justify-center items-center"
        >
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          display: loading ? "none" : "block",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
