import { ImageSourcePropType } from "react-native";

export type TopicalNote = {
  id: string;
  title?: string;
  description?: string;
  preview?: string;
  document?: string;
  createdAt?: any;
  subject?: string | string[];
  book?: string | string[];
  pages?: string | number;
  userInterests?: string[];
  isRecommended?: boolean;
};

export type SubjectItem = {
  id: string;
  name: string;
  avatar: string;
};

export type SourceBook = {
  id: string;
  title: string;
  cover: string | ImageSourcePropType;
  author?: string;
};

export const FALLBACK_DOC_PREVIEW =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/images/doc-preview.jpeg";

export const DEFAULT_SUBJECT_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png";
