import { ImageSourcePropType } from "react-native";

export type SubjectKey =
  | "Mathematics"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "English"
  | "Geography"
  | "History"
  | "ICT"
  | "Economics"
  | "Entrepreneurship"
  | "Art"
  | "Agriculture"
  | "Literature"
  | "CRE";

export type SubjectColorMap = Record<SubjectKey, string>;

export const subjectColors: SubjectColorMap = {
  Mathematics: "#C85F4B",
  Physics: "#4C7CF0",
  Chemistry: "#56A96B",
  Biology: "#43A047",
  English: "#9C27B0",
  Geography: "#00ACC1",
  History: "#B45F06",
  ICT: "#5468FF",
  Economics: "#F39C12",
  Entrepreneurship: "#FF7043",
  Art: "#EC407A",
  Agriculture: "#7CB342",
  Literature: "#8E44AD",
  CRE: "#6D4C41",
};

export type TopicalNote = {
  id: string;
  subject: SubjectKey;
  title: string;
  image: ImageSourcePropType;
  accent: string;
};

export type TeacherPost = {
  id: string;
  teacherName: string;
  teacherImage: ImageSourcePropType;
  verified: boolean;
  time: string;
  content: string;
  previewImage?: ImageSourcePropType;
  type: "pdf" | "image" | "announcement";
  subject: SubjectKey;
};

export type CourseItem = {
  id: string;
  title: string;
  teacher: string;
  duration: string;
  image: ImageSourcePropType;
  accent: string;
};

export type ResourceItem = {
  id: string;
  title: string;
  subject: SubjectKey;
  metadata: string;
  previewImage?: ImageSourcePropType;
  accent: string;
};

export type BookItem = {
  id: string;
  title: string;
  author: string;
  rating: string;
  image: ImageSourcePropType;
  accent: string;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  teacherName: string;
  time: string;
  variant: 1 | 2 | 3;
  image?: ImageSourcePropType;
  quote?: string;
  subject?: SubjectKey;
};

export const topicalNotes: TopicalNote[] = [];
export const courses: CourseItem[] = [];
export const books: BookItem[] = [];

// export const topicalNotes: TopicalNote[] = [
//   {
//     id: "note-1",
//     subject: "Mathematics",
//     title: "Quadratic Equations",
//     image: imageImports.math,
//     accent: subjectColors.Mathematics,
//   },
//   {
//     id: "note-2",
//     subject: "Physics",
//     title: "Motion & Force",
//     image: imageImports.physics,
//     accent: subjectColors.Physics,
//   },
//   {
//     id: "note-3",
//     subject: "Chemistry",
//     title: "Acids & Bases",
//     image: imageImports.chemistry,
//     accent: subjectColors.Chemistry,
//   },
// ];

// export const teacherPosts: TeacherPost[] = [
//   {
//     id: "post-1",
//     teacherName: "Tr. Sarah Namusoke",
//     teacherImage: imageImports.tr1,
//     verified: true,
//     time: "10 min ago",
//     content:
//       "Shared a polished PDF pack for last-minute revision with worked examples and mnemonics.",
//     type: "pdf",
//     subject: "Mathematics",
//   },
//   {
//     id: "post-2",
//     teacherName: "Tr. Daniel Kato",
//     teacherImage: imageImports.tr2,
//     verified: true,
//     time: "1 hr ago",
//     content:
//       "New conceptual diagrams for motion and vectors are live in the classroom library.",
//     type: "image",
//     subject: "Physics",
//   },
// ];

// export const courses: CourseItem[] = [
//   {
//     id: "course-1",
//     title: "Mastering Quadratics",
//     teacher: "Tr. Sarah",
//     duration: "18 min",
//     image: imageImports.thumb1,
//     accent: subjectColors.Mathematics,
//   },
//   {
//     id: "course-2",
//     title: "Physics in Practice",
//     teacher: "Tr. Daniel",
//     duration: "24 min",
//     image: imageImports.thumb2,
//     accent: subjectColors.Physics,
//   },
//   {
//     id: "course-3",
//     title: "Organic Chemistry Essentials",
//     teacher: "Tr. Joy",
//     duration: "12 min",
//     image: imageImports.thumb4,
//     accent: subjectColors.Chemistry,
//   },
// ];

export const unebPapers: ResourceItem[] = [
  {
    id: "uneb-1",
    title: "UNEB 2024 Paper",
    subject: "Biology",
    metadata: "12 pages • PDF • Updated 3 days ago",
    accent: subjectColors.Biology,
  },
  {
    id: "uneb-2",
    title: "Marking Guide",
    subject: "English",
    metadata: "8 pages • PDF • Updated 1 day ago",
    accent: subjectColors.English,
  },
];

export const markingGuides: ResourceItem[] = [
  {
    id: "guide-1",
    title: "Chemistry Marking Guide",
    subject: "Chemistry",
    metadata: "10 pages • PDF • Updated 2 days ago",
    accent: subjectColors.Chemistry,
  },
  {
    id: "guide-2",
    title: "History Revision Guide",
    subject: "History",
    metadata: "7 pages • PDF • Updated 5 days ago",
    accent: subjectColors.History,
  },
];

// export const books: BookItem[] = [
//   {
//     id: "book-1",
//     title: "Mathematics for Senior",
//     author: "K. Tendo",
//     rating: "4.8",
//     image: imageImports.book1,
//     accent: subjectColors.Mathematics,
//   },
//   {
//     id: "book-2",
//     title: "Physics Study Guide",
//     author: "A. Mwanga",
//     rating: "4.7",
//     image: imageImports.book2,
//     accent: subjectColors.Physics,
//   },
//   {
//     id: "book-3",
//     title: "Chemistry Workbook",
//     author: "J. Nakato",
//     rating: "4.9",
//     image: imageImports.book3,
//     accent: subjectColors.Chemistry,
//   },
// ];

export const announcements: AnnouncementItem[] = [
  {
    id: "announcement-1",
    title: "New revision pack has arrived",
    teacherName: "Tr. Clara",
    time: "Today • 08:30",
    variant: 1,
    subject: "Geography",
  },
  {
    id: "announcement-2",
    title: "Keep showing up. Consistency wins this term.",
    teacherName: "Tr. Joy",
    time: "Yesterday • 18:20",
    variant: 2,
    quote: "Small steps each day build extraordinary results.",
    subject: "English",
  },
  {
    id: "announcement-3",
    title: "Workshop slides are ready for download",
    teacherName: "Tr. Kevin",
    time: "2 days ago",
    variant: 3,
    subject: "ICT",
  },
];

export const continueLearning = {
  title: "Continue Learning",
  subtitle: "Resume the note you were reading earlier",
  topic: "Quadratic Equations",
  subject: "Mathematics" as SubjectKey,
  progress: "73% complete",
};

export const studyTip = {
  title: "Daily Study Tip",
  body: "Review one difficult topic immediately after class while it is still fresh in your mind.",
  streak: "7 day streak",
  goal: "Weekly goal: 5 sessions",
};
