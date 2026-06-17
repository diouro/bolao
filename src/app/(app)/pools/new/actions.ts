"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createPool } from "@/lib/pools/crud";
import { poolCookieName } from "@/lib/pools/context";
import { cookies } from "next/headers";

const createPoolSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export async function createPoolAction(formData: FormData) {
  const profile = await requireProfile();
  const values = createPoolSchema.parse({
    name: formData.get("name"),
  });

  const pool = await createPool({
    name: values.name,
    userId: profile.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(poolCookieName, pool.slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect(`/pools/${pool.slug}/settings`);
}
