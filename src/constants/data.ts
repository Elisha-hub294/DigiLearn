import { ImageSourcePropType } from "react-native";

export type CarouselItem = {
  id: string;
  title: string;
  cta: string;
  color: string;
  image: ImageSourcePropType;
  subtitle?: string;
  titleColor?: string;
};

export type ForYouItem = {
  id: string;
  title: string;
  subtitle?: string;
  duration?: string;
  color: string;
  image?: ImageSourcePropType;
};

export type SubjectItem = {
  id: string;
  title: string;
  image: ImageSourcePropType;
};

export type VideoItem = {
  id: string;
  title: string;
  author: string;
  image: ImageSourcePropType;
};

export type PastPaperItem = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  accent: string;
  tags: string[];
};

const imageImports = {
  panda: require("../../assets/images/panda.png"),
  user: require("../../assets/images/user.png"),
  avatars: require("../../assets/images/avatars.png"),
  bulb: require("../../assets/images/bulb.png"),
  brain: require("../../assets/images/brain.png"),
  video: require("../../assets/images/video.jpg"),
  mock: require("../../assets/images/mock.png"),
  uneb: require("../../assets/images/uneb.png"),
  bookshop: require("../../assets/images/bookshop.png"),
  bookstore: require("../../assets/images/bookstore.png"),
  download: require("../../assets/images/download.png"),
  progress: require("../../assets/images/progress.png"),
  exam: require("../../assets/images/exam.png"),
  footer: require("../../assets/images/footer-home.png"),
};

export const carouselData: CarouselItem[] = [
  {
    id: "slide-1",
    title: "What would you like to learn today?",
    subtitle:
      "Choose a path that fits your goals and start learning confidently.",
    cta: "Get Started",
    color: "#DDEBFF",
    titleColor: "#31527F",
    image: imageImports.panda,
  },
  {
    id: "slide-2",
    title: "Get the best textbooks from the best teachers",
    subtitle: "Discover curated resources made to help you learn faster.",
    cta: "Browse Books",
    color: "#FDDA76",
    titleColor: "#6B3E00",
    image: imageImports.bookstore,
  },
  {
    id: "slide-3",
    title: "Download Notes Instantly",
    subtitle: "Access high-quality revision notes anytime.",
    cta: "Download Notes",
    color: "#D1B3F0",
    titleColor: "#4A2066",
    image: imageImports.download,
  },
  {
    id: "slide-4",
    title: "Track your progress",
    subtitle: "Stay motivated by seeing your learning journey.",
    cta: "View Progress",
    color: "#FDF0DC",
    titleColor: "#6B4A00",
    image: imageImports.progress,
  },
  {
    id: "slide-5",
    title: "Prepare with Past Papers",
    subtitle: "Practice with real examination papers.",
    cta: "Explore Papers",
    color: "#F9C269",
    titleColor: "#6B3A00",
    image: imageImports.exam,
  },
  {
    id: "slide-6",
    title: "Daily Revision Tips",
    subtitle: "Learn smarter with effective study techniques.",
    cta: "Read Tips",
    color: "#E1E0E0",
    titleColor: "#7A7A7A",
    image: imageImports.brain,
  },
];

export const forYouData: ForYouItem[] = [
  {
    id: "fy-1",
    title: "Basic What is an organism",
    subtitle: "Learn the fundamentals",
    duration: "30 min",
    color: "#6BCB77",
  },
  {
    id: "fy-2",
    title: "Join your class",
    subtitle: "Stay engaged with peers",
    color: "#E2E2E2",
    image: imageImports.avatars,
  },
  {
    id: "fy-3",
    title: "Tips for better Revision",
    subtitle: "Simple study habits",
    color: "#BCAAEE",
    image: imageImports.bulb,
  },
  {
    id: "fy-4",
    title: "Get tips from others",
    subtitle: "Grow with community",
    color: "#E2E2E2",
    image: imageImports.brain,
  },
];

export const videosData: VideoItem[] = [
  {
    id: "video-1",
    title: "Everything you need to know about Global Warming",
    author: "By Rikhav Sharma",
    image: imageImports.video,
  },
  {
    id: "video-2",
    title: "How to solve algebra faster",
    author: "By Maya L.",
    image: imageImports.video,
  },
  {
    id: "video-3",
    title: "Physics explained in 10 mins",
    author: "By Noah K.",
    image: imageImports.video,
  },
];

export const pastPapersData: PastPaperItem[] = [
  {
    id: "paper-1",
    title: "Mocks",
    image: imageImports.mock,
    accent: "",
    tags: ["MOCKS"],
  },
  {
    id: "paper-2",
    title: "UNEB",
    image: imageImports.uneb,
    accent: "",
    tags: ["UNEB"],
  },
  {
    id: "paper-3",
    title: "Marking Guides",
    image: imageImports.mock,
    accent: "",
    tags: ["UNEB", "MOCKS"],
  },
  {
    id: "paper-4",
    title: "Other exam papers",
    image: imageImports.uneb,
    accent: "",
    tags: ["MORE"],
  },
];
