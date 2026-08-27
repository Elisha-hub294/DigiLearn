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
  accent?: string;
};

export type SourceBook = {
  id: string;
  title: string;
  cover: string | ImageSourcePropType;
  author?: string;
};

export const DEFAULT_SUBJECT_AVATAR = "icons/default-2d.png";
