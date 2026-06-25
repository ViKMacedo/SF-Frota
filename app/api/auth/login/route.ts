import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { registration, pin } = await req.json();

  const { data: driver, error } = await supabaseAdmin
    .from("drivers")
    .select("*")
    .eq("registration", registration)
    .eq("status", "Ativo")
    .single();

  if (error || !driver) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 401 },
    );
  }

  // pin_hash tem prioridade; fallback para pin em texto puro durante migração
  const pinValid = await bcrypt.compare(pin, driver.pin_hash);

  if (!pinValid) {
    return NextResponse.json({ error: "PIN inválido" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
  const token = await new SignJWT({
    sub: driver.id,
    role: driver.role === "admin" ? "service_role" : "authenticated",
    app_metadata: { role: driver.role },
    user_metadata: { name: driver.name, registration: driver.registration },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return NextResponse.json({ token, driver });
}
