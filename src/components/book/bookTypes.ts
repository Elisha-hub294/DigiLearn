import { ImageSourcePropType } from "react-native";

export type Book = {
  id: string;
  title: string;
  description: string;
  cover: string | ImageSourcePropType;
  year?: string;
  edition?: string;
  author: string[];
  subject: string[];
  pages?: string;
  rating?: number;
  saves?: number;
};

export const FALLBACK_COVER = require("../../../assets/images/lib.jpeg");
export const DEFAULT_AUTHOR_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/tr-default.png";
export const OPERO_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/opero-stephen.jpeg";
