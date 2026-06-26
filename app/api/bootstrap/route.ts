import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PAGE_SIZE = 500;

async function fetchAllPages<T>(
    query: () => ReturnType<typeof supabaseAdmin.from>,
    table: string,
): Promise<T[]> {
    const results: T[] = [];
    let from = 0;

    while (true) {
        const { data, error } = await supabaseAdmin
            .from(table)
            .select("*")
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        results.push(...(data as T[]));
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return results;
}

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

        const [drivers, vehicles, trips, settingsRaw] = await Promise.all([
            fetchAllPages(
                () => supabaseAdmin.from("drivers"),
                "drivers",
            ),
            fetchAllPages(
                () => supabaseAdmin.from("vehicles"),
                "vehicles",
            ),
            supabaseAdmin
                .from("trips")
                .select("*")
                .or(
                    `status.eq.Em andamento,ended_at.gte.${
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            .toISOString()
                    }`,
                )
                .then(({ data, error }) => {
                    if (error) throw error;
                    return data ?? [];
                }),
            supabaseAdmin
                .from("settings")
                .select("*")
                .eq("id", 1)
                .single()
                .then(({ data }) => data),
        ]);

        const settings = settingsRaw
            ? {
                id: "default",
                companyName: settingsRaw.company_name ?? "SF Frota",
                companyDocument: settingsRaw.company_document ?? "",
                companyPhone: settingsRaw.company_phone ?? "",
                companyEmail: settingsRaw.company_email ?? "",
                sessionTimeout: settingsRaw.session_timeout ?? "60",
                allowDeleteDrivers: settingsRaw.allow_delete_drivers ?? true,
                allowDeleteVehicles: settingsRaw.allow_delete_vehicles ?? true,
                allowDeleteTrips: settingsRaw.allow_delete_trips ?? false,
            }
            : null;

        return NextResponse.json({
            success: true,
            drivers,
            vehicles,
            trips,
            settings,
        });
    } catch (error) {
        console.error("[BOOTSTRAP]", error);

        return NextResponse.json(
            { error: "Falha no bootstrap" },
            { status: 500 },
        );
    }
}
