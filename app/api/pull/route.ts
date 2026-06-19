import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
    try {
        const { token, since } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token ausente" }, {
                status: 401,
            });
        }

        const secret = new TextEncoder().encode(
            process.env.SUPABASE_JWT_SECRET!,
        );
        await jwtVerify(token, secret);

        const sinceDate = since ??
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [
            { data: trips, error: tripsError },
            { data: vehicles, error: vehiclesError },
        ] = await Promise.all([
            supabaseAdmin
                .from("trips")
                .select("*")
                .or(`status.eq."Em andamento",ended_at.gte.${sinceDate}`),

            supabaseAdmin.from("vehicles").select("*"),
        ]);

        if (tripsError) throw tripsError;
        if (vehiclesError) throw vehiclesError;

        return NextResponse.json({ success: true, trips, vehicles });
    } catch (error) {
        console.error("[PULL]", error);
        return NextResponse.json({ error: "Falha no pull" }, { status: 500 });
    }
}
