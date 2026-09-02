import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MIME_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  MAX_FILE_SIZE,
} from "./constants";

/**
 * Checks if a file is an allowed document or presentation type.
 */
export const isAllowedDocument = (
  fileName: string,
  mimeType?: string | null,
): boolean => {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  const hasValidExtension = DOCUMENT_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );

  const hasValidMimeType = DOCUMENT_MIME_TYPES.some(
    (mime) => mime === lowerMime,
  );

  return hasValidExtension || hasValidMimeType;
};

/**
 * Checks if a file is an allowed image type (JPG, JPEG, PNG)
 */
export const isAllowedImage = (
  fileName: string,
  mimeType?: string | null,
): boolean => {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  const hasValidExtension = IMAGE_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );

  const hasValidMimeType = IMAGE_MIME_TYPES.some((mime) => mime === lowerMime);

  return hasValidExtension || hasValidMimeType;
};

/**
 * Validates file size
 */
export const isValidFileSize = (fileSize?: number): boolean => {
  if (!fileSize) return true;
  return fileSize <= MAX_FILE_SIZE;
};

/**
 * Gets error message for invalid file
 */
export const getFileValidationError = (
  fileName: string,
  fileSize: number | undefined,
  isImage: boolean,
  mimeType?: string | null,
): string | null => {
  if (isImage) {
    if (!isAllowedImage(fileName, mimeType)) {
      return "Unsupported image type. Please select a JPG, JPEG, or PNG image only.";
    }
    if (!isValidFileSize(fileSize)) {
      return "Image is too large. Please select an image smaller than 10 MB.";
    }
  } else {
    if (!isAllowedDocument(fileName)) {
      return "Unsupported file type. Please select a PDF, DOCX, PPT, or PPTX file only.";
    }
    if (!isValidFileSize(fileSize)) {
      return "File is too large. Please select a file smaller than 10 MB.";
    }
  }

  return null;
};
