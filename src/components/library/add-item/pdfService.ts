import JSZip from "jszip";
import { Platform } from "react-native";
import { PDF_JS_CDN, PDF_WORKER_CDN } from "./constants";

let FileSystem: any = null;

if (Platform.OS !== "web") {
  try {
    FileSystem = require("expo-file-system");
  } catch (error) {
    console.error("Failed to load FileSystem:", error);
  }
}

/**
 * WebView HTML for PDF processing
 */
export const getWebViewHtml = (): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="${PDF_JS_CDN}"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDF_WORKER_CDN}';
  </script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: white; }
    canvas { display: none; }
  </style>
</head>
<body>
  <canvas id="pdf-canvas"></canvas>
  <script>
    setTimeout(() => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'ready' }));
      }
    }, 150);

    window.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
          if (data.mode !== 'docxCover' && !data.base64Data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error: 'No PDF data provided' }));
          return;
        }

        const { base64Data, mode = 'cover', docxText = '' } = data;

        if (mode === 'docxCover') {
          const canvas = document.getElementById('pdf-canvas');
          const context = canvas.getContext('2d');
          const pageWidth = 612;
          const pageHeight = 792;
          canvas.width = pageWidth;
          canvas.height = pageHeight;
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, pageWidth, pageHeight);
          context.fillStyle = '#172033';
          context.font = 'bold 24px sans-serif';
          context.fillText('DigiLearn document', 48, 64);
          context.strokeStyle = '#D9E0EA';
          context.beginPath();
          context.moveTo(48, 84);
          context.lineTo(pageWidth - 48, 84);
          context.stroke();
          context.font = '16px sans-serif';
          const lines = docxText.split('\\n');
          let y = 122;
          for (const paragraph of lines) {
            const words = paragraph.trim().split(/\\s+/).filter(Boolean);
            let line = '';
            for (const word of words) {
              const nextLine = line ? line + ' ' + word : word;
              if (context.measureText(nextLine).width > pageWidth - 96) {
                if (line) { context.fillText(line, 48, y); y += 24; }
                line = word;
              } else {
                line = nextLine;
              }
            }
            if (line) { context.fillText(line, 48, y); y += 30; }
            if (y > pageHeight - 48) break;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', dataUrl }));
          return;
        }

        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale: 1.0 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        if (mode === 'pageCount') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', pageCount: pdf.numPages || 1 }));
          return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', dataUrl }));
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error: err.message || String(err) }));
      }
    });
  </script>
</body>
</html>
`;

/**
 * Loads PDF.js library on web platform
 */
const loadPdfJsLib = async (): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = PDF_JS_CDN;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Generates a thumbnail of the first page of a PDF (web platform)
 */
const generateWebPdfThumbnail = async (fileUri: string): Promise<string> => {
  const pdfjsLib = await loadPdfJsLib();

  const loadingTask = pdfjsLib.getDocument({
    url: fileUri,
    withCredentials: false,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2D context");

  const viewport = page.getViewport({ scale: 1.0 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.85);
};

const decodeXmlText = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );

const extractDocxText = async (data: ArrayBuffer | string): Promise<string> => {
  const zip = await JSZip.loadAsync(
    data,
    typeof data === "string" ? { base64: true } : undefined,
  );
  const documentXml = await zip.file("word/document.xml")?.async("text");
  if (!documentXml) throw new Error("DOCX document content is missing");

  const paragraphs = [
    ...documentXml.matchAll(/<w:p(?: [^>]*)?>([\s\S]*?)<\/w:p>/g),
  ];
  return paragraphs
    .map(([, paragraph]) =>
      decodeXmlText(
        paragraph
          .replace(/<w:tab\s*\/?>/g, "\t")
          .replace(/<w:br\s*\/?>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      ),
    )
    .filter(Boolean)
    .join("\n");
};

const generateOfficeThumbnail = async (text: string): Promise<string> => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2D context");

  const pageWidth = 612;
  const pageHeight = 792;
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, pageWidth, pageHeight);
  context.fillStyle = "#172033";
  context.font = "bold 24px sans-serif";
  context.fillText("DigiLearn document", 48, 64);
  context.strokeStyle = "#D9E0EA";
  context.beginPath();
  context.moveTo(48, 84);
  context.lineTo(pageWidth - 48, 84);
  context.stroke();
  context.font = "16px sans-serif";
  let y = 122;
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const nextLine = line ? `${line} ${word}` : word;
      if (context.measureText(nextLine).width > pageWidth - 96) {
        if (line) {
          context.fillText(line, 48, y);
          y += 24;
        }
        line = word;
      } else {
        line = nextLine;
      }
    }
    if (line) {
      context.fillText(line, 48, y);
      y += 30;
    }
    if (y > pageHeight - 48) break;
  }
  return canvas.toDataURL("image/jpeg", 0.85);
};

/**
 * Generates a thumbnail of the first page of a PDF (native platforms)
 */
export const generatePdfFirstPageThumbnail = async (
  fileUri: string,
  setPdfToProcess: (state: any) => void,
  webViewRef: React.RefObject<any>,
  fileName?: string,
): Promise<string> => {
  const isPresentation =
    /\.(ppt|pptx)$/i.test(fileName || "") || /\.(ppt|pptx)$/i.test(fileUri);
  const isDocx =
    fileName?.toLowerCase().endsWith(".docx") ||
    fileUri.toLowerCase().endsWith(".docx");

  if (isPresentation) {
    const presentationText = "PowerPoint presentation\nFirst slide preview";
    if (Platform.OS === "web") {
      return generateOfficeThumbnail(presentationText);
    }

    return new Promise<string>((resolve, reject) => {
      setPdfToProcess({
        docxText: presentationText,
        mode: "docxCover",
        resolve,
        reject,
      });
    });
  }

  if (isDocx) {
    if (Platform.OS === "web") {
      const response = await fetch(fileUri);
      const text = await extractDocxText(await response.arrayBuffer());
      return generateOfficeThumbnail(text);
    }

    if (!FileSystem) {
      throw new Error("FileSystem native module is not loaded");
    }
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const text = await extractDocxText(base64Data);
    return new Promise<string>((resolve, reject) => {
      setPdfToProcess({ docxText: text, mode: "docxCover", resolve, reject });
    });
  }

  if (Platform.OS === "web") {
    return generateWebPdfThumbnail(fileUri);
  }

  if (!FileSystem) {
    throw new Error("FileSystem native module is not loaded");
  }

  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return new Promise<string>((resolve, reject) => {
    setPdfToProcess({
      base64Data,
      resolve,
      reject,
    });
  });
};

/**
 * Gets the page count of a PDF (web platform)
 */
const getWebPdfPageCount = async (fileUri: string): Promise<number> => {
  const pdfjsLib = await loadPdfJsLib();

  const pdf = await pdfjsLib.getDocument({
    url: fileUri,
    withCredentials: false,
  }).promise;

  return pdf.numPages || 1;
};

/**
 * Gets the page count of a PDF
 */
export const getPdfPageCount = async (
  fileUri: string,
  setPdfToProcess: (state: any) => void,
  webViewRef: React.RefObject<any>,
): Promise<number> => {
  if (Platform.OS === "web") {
    return getWebPdfPageCount(fileUri);
  }

  if (!FileSystem) {
    throw new Error("FileSystem native module is not loaded");
  }

  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return new Promise<number>((resolve, reject) => {
    setPdfToProcess({
      base64Data,
      resolve: (result: any) => resolve(Number(result) || 1),
      reject,
      mode: "pageCount",
    });
  });
};
