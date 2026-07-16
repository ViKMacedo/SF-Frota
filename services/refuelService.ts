import { db, Vehicle } from "@/lib/db";
import {
    addRefuelToQueue,
    addVehicleToQueue,
} from "@/services/syncQueueService";
import { generateId } from "@/lib/generateId";

/**
 * Estima o % de combustível restante com base no km rodado desde o último
 * abastecimento registrado e no consumo médio configurado pro veículo.
 * Retorna undefined se o veículo não tiver consumoMedioKmL/capacidadeTanqueL
 * configurados (não dá pra estimar sem esses dados) — quem chama decide como
 * tratar a ausência (ex: esconder o indicador).
 */
export function estimateFuelLevel(
    vehicle: Vehicle,
    currentKm: number,
): number | undefined {
    const { consumoMedioKmL, capacidadeTanqueL, nivelCombustivelEstimado } =
        vehicle;

    if (!consumoMedioKmL || !capacidadeTanqueL) {
        return undefined;
    }

    // Sem abastecimento registrado ainda: assume nível já salvo, ou 100% como
    // ponto de partida neutro (evita mostrar 0% pra veículo recém-cadastrado).
    const baseLevel = nivelCombustivelEstimado ?? 100;
    const baseKm = vehicle.ultimoAbastecimentoKm ?? currentKm;

    const kmRodado = Math.max(0, currentKm - baseKm);
    const litrosConsumidos = kmRodado / consumoMedioKmL;
    const percentualConsumido = (litrosConsumidos / capacidadeTanqueL) * 100;

    return Math.max(0, Math.min(100, baseLevel - percentualConsumido));
}

/** Estima a autonomia restante em km, dado o nível estimado atual. */
export function estimateRangeKm(
    vehicle: Vehicle,
    nivelEstimado: number,
): number | undefined {
    const { consumoMedioKmL, capacidadeTanqueL } = vehicle;
    if (!consumoMedioKmL || !capacidadeTanqueL) return undefined;

    const litrosRestantes = (nivelEstimado / 100) * capacidadeTanqueL;
    return Math.round(litrosRestantes * consumoMedioKmL);
}

interface RegisterRefuelParams {
    vehicleId: string;
    tripId?: string;
    driverId: string;
    driverName: string;
    litros: number;
    kmAtual: number;
}

/**
 * Registra um abastecimento (parcial ou completo): grava o histórico e
 * atualiza o estado calculado do veículo (nivelCombustivelEstimado +
 * ultimoAbastecimentoKm), a partir do nível estimado no momento do
 * abastecimento — não assume tanque cheio.
 */
export async function registerRefuel({
    vehicleId,
    tripId,
    driverId,
    driverName,
    litros,
    kmAtual,
}: RegisterRefuelParams) {
    const vehicle = await db.vehicles.get(vehicleId);
    if (!vehicle) {
        throw new Error("Veículo não encontrado.");
    }
    if (!vehicle.capacidadeTanqueL) {
        throw new Error(
            "Este veículo não tem capacidade de tanque configurada. Configure no cadastro do veículo antes de registrar abastecimento.",
        );
    }

    const nivelAntesDoAbastecimento = estimateFuelLevel(vehicle, kmAtual) ?? 0;
    const percentualAdicionado = (litros / vehicle.capacidadeTanqueL) * 100;
    const novoNivel = Math.max(
        0,
        Math.min(100, nivelAntesDoAbastecimento + percentualAdicionado),
    );

    const refuel = {
        id: generateId(),
        vehicleId,
        tripId,
        driverId,
        driverName,
        litros,
        kmAtual,
        createdAt: new Date().toISOString(),
    };

    await db.refuels.add(refuel);
    await addRefuelToQueue("create", refuel);

    await db.vehicles.update(vehicleId, {
        ultimoAbastecimentoKm: kmAtual,
        nivelCombustivelEstimado: novoNivel,
    });
    const updatedVehicle = await db.vehicles.get(vehicleId);
    if (updatedVehicle) {
        await addVehicleToQueue("update", updatedVehicle);
    }

    return { novoNivel };
}

export async function getRefuelsByVehicle(vehicleId: string) {
    return await db.refuels.where("vehicleId").equals(vehicleId).toArray();
}
