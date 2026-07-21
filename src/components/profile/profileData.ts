export type Interest = { id: string; title: string; image: number; colors: readonly [string, string] };
export type SavedResource = { id: string; title: string; type: "video" | "book" | "document"; image: number };
export const interests: Interest[] = [
  { id: "math", title: "Mathematics", image: require("../../../assets/images/interest-math.png"), colors: ["#2E73F2", "#5B95FF"] },
  { id: "chemistry", title: "Chemistry", image: require("../../../assets/images/interest-chem.png"), colors: ["#FF5F8A", "#FFB347"] },
  { id: "biology", title: "Biology", image: require("../../../assets/images/interest-bio.png"), colors: ["#35C759", "#62D26F"] },
  { id: "art", title: "Art", image: require("../../../assets/images/interest-art.png"), colors: ["#A855F7", "#D977FA"] },
];
export const savedResources: SavedResource[] = [
  { id: "quantum-frontiers", title: "Quantum Frontiers: Exploring Entrepreneurship", type: "video", image: require("../../../assets/images/thumb-1.jpeg") },
  { id: "king-of-the-jungle", title: "King of the Jungle", type: "book", image: require("../../../assets/images/book1.jpg") },
  { id: "job-application", title: "Writing a Job Application", type: "document", image: require("../../../assets/images/lang-2d.png") },
];
