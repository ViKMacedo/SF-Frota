-- Garante no nível do banco que um veículo não pode ter
-- duas viagens "Em andamento" simultaneamente.
create unique index if not exists one_active_trip_per_vehicle
on trips (vehicle_id)
where status = 'Em andamento';