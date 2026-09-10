import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultServices } from "@/lib/queries/services";

const schema = z.object({
  agencyName: z.string().min(1).max(255),
  fullName: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
      },
      { status: 400 },
    );
  }

  const { agencyName, fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (authError || !auth.user) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_ERROR", message: authError?.message ?? "Sign up failed" } },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({ data: { name: agencyName } });
      await tx.user.create({
        data: {
          id: auth.user!.id,
          email,
          fullName,
          role: "admin",
          agencyId: agency.id,
        },
      });
      await ensureDefaultServices(tx, agency.id);
    });
  } catch (err) {
    console.error("signup: failed to provision agency/user", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROVISION_ERROR",
          message:
            "Account created but agency setup failed. Ensure DATABASE_URL is configured and migrations have run.",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { needsConfirmation: !auth.session },
  });
}
