import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { error: "Token ausente" },
                { status: 401 },
            );
        }

        const secret = new TextEncoder().encode(
            process.env.SUPABASE_JWT_SECRET!,
        );

        await jwtVerify(token, secret);

        const [
            { data: drivers, error: driversError },
            { data: vehicles, error: vehiclesError },
            { data: trips, error: tripsError },
        ] = await Promise.all([
            supabaseAdmin
                .from("drivers")
                .select("*"),

            supabaseAdmin
                .from("vehicles")
                .select("*"),

            supabaseAdmin
                .from("trips")
                .select("*"),
        ]);

        if (driversError) {
            throw driversError;
        }

        if (vehiclesError) {
            throw vehiclesError;
        }

        if (tripsError) {
            throw tripsError;
        }

        return NextResponse.json({
            success: true,
            drivers,
            vehicles,
            trips,
        });
    } catch (error) {
        console.error("[BOOTSTRAP]", error);

        return NextResponse.json(
            { error: "Falha no bootstrap" },
            { status: 500 },
        );
    }
}
