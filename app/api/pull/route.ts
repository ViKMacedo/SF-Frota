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
            { data: activeTrips, error: activeError },
            { data: recentTrips, error: recentError },
            { data: vehicles, error: vehiclesError },
        ] = await Promise.all([
            // Duas queries separadas evitam o escape frágil do .or() com strings
            supabaseAdmin
                .from("trips")
                .select("*")
                .eq("status", "Em andamento"),

            supabaseAdmin
                .from("trips")
                .select("*")
                .gte("ended_at", sinceDate),

            supabaseAdmin.from("vehicles").select("*"),
        ]);

        if (activeError) throw activeError;
        if (recentError) throw recentError;

        // Deduplica por id (uma trip ativa pode também ter ended_at recente)
        const tripsMap = new Map<string, typeof activeTrips[0]>();
        for (const t of [...(activeTrips ?? []), ...(recentTrips ?? [])]) {
            tripsMap.set(t.id, t);
        }
        const trips = Array.from(tripsMap.values());

        if (vehiclesError) throw vehiclesError;

        return NextResponse.json({ success: true, trips, vehicles });
    } catch (error) {
        console.error("[PULL]", error);
        return NextResponse.json({ error: "Falha no pull" }, { status: 500 });
    }
}
