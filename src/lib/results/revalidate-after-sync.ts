import { revalidatePath } from "next/cache";

export function revalidateAfterMatchResultsSync() {
  revalidatePath("/admin/results");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
  revalidatePath("/leaderboard");
  revalidatePath("/breakdown");
  revalidatePath("/stats");
  revalidatePath("/bracket");
  revalidatePath("/groups");
  revalidatePath("/schedule");
}
