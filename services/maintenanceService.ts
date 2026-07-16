import {
    db,
    MAINTENANCE_KEYS,
    type MaintenanceItemState,
    type MaintenanceKey,
    type Vehicle,
} from "@/lib/db";
import { addVehicleToQueue } from "@/services/syncQueueService";

export type MaintenanceUrgency =
    | "vencido"
    | "proximo"
    | "em-dia"
    | "nao-configurado";

export interface MaintenanceItemStatus {
    urgency: MaintenanceUrgency;
    kmRestante?: number; // negativo = vencido há X km
    diasRestantes?: number; // negativo = vencido há X dias
    label: string;
}

// "Próximo do vencimento" quando resta 10% ou menos do intervalo configurado
// (proporcional a cada item, já que óleo/pneus/freios/filtros têm intervalos
// bem diferentes entre si).
const WARN_THRESHOLD = 0.1;

const URGENCY_RANK: Record<MaintenanceUrgency, number> = {
    vencido: 3,
    proximo: 2,
    "em-dia": 1,
    "nao-configurado": 0,
};

function daysBetween(from: Date, to: Date): number {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function dimensionUrgency(
    remaining: number,
    interval: number,
): MaintenanceUrgency | undefined {
    if (!interval || interval <= 0) return undefined;
    if (remaining <= 0) return "vencido";
    if (remaining <= interval * WARN_THRESHOLD) return "proximo";
    return "em-dia";
}

function worseUrgency(
    a: MaintenanceUrgency,
    b: MaintenanceUrgency,
): MaintenanceUrgency {
    return URGENCY_RANK[a] >= URGENCY_RANK[b] ? a : b;
}

function buildLabel(
    urgency: MaintenanceUrgency,
    kmRestante?: number,
    diasRestantes?: number,
): string {
    if (urgency === "nao-configurado") return "Não configurado";

    // Mostra a dimensão mais crítica (a que vence primeiro, ou já venceu).
    const candidates: { tipo: "km" | "dias"; valor: number }[] = [];
    if (kmRestante !== undefined) {
        candidates.push({ tipo: "km", valor: kmRestante });
    }
    if (diasRestantes !== undefined) {
        candidates.push({ tipo: "dias", valor: diasRestantes });
    }

    candidates.sort((a, b) => a.valor - b.valor);
    const maisUrgente = candidates[0];

    if (maisUrgente.valor <= 0) {
        const vencidoHa = Math.abs(maisUrgente.valor);
        return maisUrgente.tipo === "km"
            ? `vencido há ${vencidoHa.toLocaleString("pt-BR")} km`
            : `vencido há ${vencidoHa} dia${vencidoHa === 1 ? "" : "s"}`;
    }

    return maisUrgente.tipo === "km"
        ? `${maisUrgente.valor.toLocaleString("pt-BR")} km restantes`
        : `vence em ${maisUrgente.valor} dia${
            maisUrgente.valor === 1 ? "" : "s"
        }`;
}

/**
 * Calcula o status de um item de manutenção comparando o KM atual e a data
 * atual contra o intervalo configurado — vence o que chegar primeiro (km ou
 * tempo). Se nenhum dos dois intervalos estiver configurado (0), retorna
 * "nao-configurado" em vez de assumir "em dia" por padrão (evita falso
 * positivo de segurança).
 */
export function getMaintenanceItemStatus(
    item: MaintenanceItemState,
    currentKm: number,
    now: Date = new Date(),
): MaintenanceItemStatus {
    const kmRestante = item.intervaloKm > 0
        ? item.intervaloKm - (currentKm - item.ultimoKm)
        : undefined;

    const diasRestantes = item.intervaloDias > 0
        ? item.intervaloDias - daysBetween(new Date(item.ultimaData), now)
        : undefined;

    const kmUrgency = kmRestante !== undefined
        ? dimensionUrgency(kmRestante, item.intervaloKm)
        : undefined;
    const diasUrgency = diasRestantes !== undefined
        ? dimensionUrgency(diasRestantes, item.intervaloDias)
        : undefined;

    let urgency: MaintenanceUrgency = "nao-configurado";
    if (kmUrgency) urgency = kmUrgency;
    if (diasUrgency) {
        urgency = urgency === "nao-configurado"
            ? diasUrgency
            : worseUrgency(urgency, diasUrgency);
    }

    return {
        urgency,
        kmRestante,
        diasRestantes,
        label: buildLabel(urgency, kmRestante, diasRestantes),
    };
}

/** Calcula o status dos 4 itens de manutenção de um veículo de uma vez. */
export function getVehicleMaintenanceStatus(
    vehicle: Vehicle,
    currentKm: number = vehicle.km,
): Record<MaintenanceKey, MaintenanceItemStatus> | undefined {
    if (!vehicle.manutencao) return undefined;

    const manutencao = vehicle.manutencao;
    const now = new Date();
    return MAINTENANCE_KEYS.reduce(
        (acc, key) => {
            acc[key] = getMaintenanceItemStatus(
                manutencao[key],
                currentKm,
                now,
            );
            return acc;
        },
        {} as Record<MaintenanceKey, MaintenanceItemStatus>,
    );
}

/** Quantos itens estão vencidos — usado no badge da tabela e no dashboard. */
export function countOverdueItems(
    vehicle: Vehicle,
    currentKm: number = vehicle.km,
): number {
    const statuses = getVehicleMaintenanceStatus(vehicle, currentKm);
    if (!statuses) return 0;
    return Object.values(statuses).filter((s) => s.urgency === "vencido")
        .length;
}

/**
 * Registra que um item de manutenção foi feito agora — usado tanto pelo
 * admin quanto pelo motorista (ex: trocou pneu na rua). Grava o KM e a data
 * atuais como nova referência para esse item, mantendo o intervalo
 * configurado intacto.
 */
export async function registerMaintenanceDone(
    vehicleId: string,
    itemKey: MaintenanceKey,
    currentKm: number,
) {
    const vehicle = await db.vehicles.get(vehicleId);
    if (!vehicle) {
        throw new Error("Veículo não encontrado.");
    }

    // Se o veículo ainda não tem NENHUM histórico de manutenção, criamos a
    // estrutura zerada pros outros 3 itens (intervalo 0 = "não configurado",
    // sem carimbar km/data de hoje neles) — só o item realmente registrado
    // abaixo ganha o KM e a data de agora. Sem isso, registrar 1 item fazia
    // parecer que os outros 3 também tinham sido feitos ao mesmo tempo.
    const manutencaoAtual: Record<MaintenanceKey, MaintenanceItemState> =
        vehicle.manutencao ??
            MAINTENANCE_KEYS.reduce(
                (acc, key) => {
                    acc[key] = {
                        intervaloKm: 0,
                        intervaloDias: 0,
                        ultimoKm: 0,
                        ultimaData: "",
                    };
                    return acc;
                },
                {} as Record<MaintenanceKey, MaintenanceItemState>,
            );

    const novaManutencao = {
        ...manutencaoAtual,
        [itemKey]: {
            ...manutencaoAtual[itemKey],
            ultimoKm: currentKm,
            ultimaData: new Date().toISOString(),
        },
    };

    await db.vehicles.update(vehicleId, { manutencao: novaManutencao });
    const updatedVehicle = await db.vehicles.get(vehicleId);
    if (updatedVehicle) {
        await addVehicleToQueue("update", updatedVehicle);
    }
}
