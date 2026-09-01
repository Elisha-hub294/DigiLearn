export type FormType = "book" | "banner" | "paper" | "page";

export type FormState = {
  title: string;
  subtitle: string;
  author: string;
  extra: string;
  cover: string;
  rating: string;
  isTop: boolean;
  pages: string;
  doc: string;
  subject: string;
  description: string;
  document: string;
  book: string;
  level: string;
  schoolClass: string;
  notifyUsers: boolean;
};

export const INITIAL_FORM_STATE: FormState = {
  title: "",
  subtitle: "",
  author: "",
  extra: "",
  cover: "",
  rating: "",
  isTop: false,
  pages: "",
  doc: "",
  subject: "",
  description: "",
  document: "",
  book: "",
  level: "",
  schoolClass: "",
  notifyUsers: true,
};

export const FALLBACK_ICON_URL = "icons/default-2d.png";
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const CLASS_OPTIONS = {
  ordinary: [
    { label: "Senior 1", value: "Senior 1" },
    { label: "Senior 2", value: "Senior 2" },
    { label: "Senior 3", value: "Senior 3" },
    { label: "Senior 4", value: "Senior 4" },
  ],
  advanced: [
    { label: "Senior 5", value: "Senior 5" },
    { label: "Senior 6", value: "Senior 6" },
  ],
};

export const LEVEL_OPTIONS = [
  { label: "Ordinary", value: "Ordinary" },
  { label: "Advanced", value: "Advanced" },
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const DOCUMENT_EXTENSIONS = [".pdf", ".docx"];
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const PDF_JS_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
export const PDF_WORKER_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

export const UPLOAD_PROGRESS_LABELS = {
  preparingUpload: "Preparing upload",
  uploadingCoverImage: "Uploading cover image",
  uploadingDocument: "Uploading announcement document",
  uploadingPreview: "Uploading announcement preview",
  uploadingPageDocument: "Uploading page document",
  uploadingPagePreview: "Uploading page preview",
  uploadingPastPaper: "Uploading past paper",
  uploadingPaperPreview: "Uploading paper preview",
} as const;

export const FORM_FIELD_TITLES = {
  book: "Add Book",
  banner: "Post Announcement",
  page: "Add page",
  paper: "Add Past Paper",
} as const;

export const FORM_FIELD_PLACEHOLDERS = {
  book: {
    title: "Book title",
    description: "Book description",
  },
  banner: {
    title: "Announcement title",
    description: "Announcement description",
  },
  page: {
    title: "Page title",
    description: "Page description",
  },
  paper: {
    title: "Paper title",
    description: "Brief description of this paper",
  },
} as const;
