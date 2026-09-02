export type ActivityType = "lesson" | "page" | "book" | "paper";

export type ActivityRecord = {
  id: string;
  openedAt: string;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  openedAt: string;
  targetId: string;
  rawDoc?: any;
};
