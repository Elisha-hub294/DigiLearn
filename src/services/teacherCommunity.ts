import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebaseConfig";

type CommunityResponse = {
  joined: boolean;
};

const manageTeacherCommunity = httpsCallable<
  { teacherId: string; action: "status" | "join" | "leave" },
  CommunityResponse
>(functions, "manageTeacherCommunity");

export async function getTeacherCommunityStatus(teacherId: string) {
  if (!teacherId) return false;
  const result = await manageTeacherCommunity({ teacherId, action: "status" });
  return result.data.joined;
}

export async function setTeacherCommunityMembership(
  teacherId: string,
  joined: boolean,
) {
  if (!teacherId) return false;
  const result = await manageTeacherCommunity({
    teacherId,
    action: joined ? "join" : "leave",
  });
  return result.data.joined;
}
