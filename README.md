# SF Frota

Sistema operacional de frota com suporte **offline-first**, rastreamento GPS em tempo real e sincronização automática com Supabase. Desenvolvido para operar em campo — o motorista trabalha sem depender de internet, e o admin acompanha tudo ao vivo.

---

## Como funciona

O sistema tem dois lados:

**Motorista (mobile)**
Acessa pelo celular como PWA instalado na tela inicial. Escaneia o QR Code do veículo, registra KM inicial, realiza a viagem e finaliza com KM final. Tudo funciona offline — os dados ficam salvos localmente e sincronizam automaticamente quando a internet voltar.

**Administrador (web)**
Acompanha a frota em tempo real pelo painel: mapa com posição dos veículos, KPIs do dia, histórico de viagens, relatórios e gestão de motoristas e veículos. O painel atualiza sozinho a cada 10 segundos.

```
Motorista                          Admin
   │                                 │
   ├─ Escaneia QR Code               ├─ Vê mapa ao vivo
   ├─ Registra KM                    ├─ Acompanha KPIs
   ├─ Viagem offline                 ├─ Gerencia motoristas
   ├─ Sync automático ──────────────►├─ Gerencia veículos
   └─ Finaliza viagem                └─ Exporta relatórios
```

---

## Stack

|              |                                    |
| ------------ | ---------------------------------- |
| Framework    | Next.js 16 + React 19 + TypeScript |
| Estilo       | Tailwind CSS v4 + shadcn/ui        |
| Banco local  | Dexie (IndexedDB)                  |
| Banco remoto | Supabase (PostgreSQL)              |
| Auth         | JWT + bcrypt                       |
| Mapas        | Leaflet + React Leaflet            |
| Gráficos     | Recharts                           |
| Exportação   | jsPDF + xlsx                       |

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

---

## Instalação

**1. Clone o repositório**

```bash
git clone https://github.com/seu-usuario/sf-frota.git
cd sf-frota
```

**2. Instale as dependências**

```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=seu-jwt-secret
```

> O `SUPABASE_JWT_SECRET` está em **Supabase → Settings → API → JWT Secret**.

**4. Configure o banco de dados**

Execute no SQL Editor do Supabase:

```sql
-- Linha inicial de configurações
INSERT INTO settings (id, company_name, session_timeout, allow_delete_drivers, allow_delete_vehicles, allow_delete_trips)
VALUES (1, 'SF Frota', '60', true, true, false)
ON CONFLICT (id) DO NOTHING;

-- Índice que impede dois motoristas usarem o mesmo veículo simultaneamente
CREATE UNIQUE INDEX IF NOT EXISTS one_active_trip_per_vehicle
  ON trips (vehicle_id)
  WHERE status = 'Em andamento';
```

**5. Crie o primeiro administrador**

Gere um hash bcrypt do PIN escolhido e insira no banco:

```sql
INSERT INTO drivers (id, name, registration, pin_hash, role, license, status)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin',
  '$2b$12$...', -- hash bcrypt do seu PIN
  'admin',
  'B',
  'Ativo'
);
```

**6. Rode em desenvolvimento**

```bash
npm run dev
```

Acesse em `http://localhost:3000`.

---

## Acessar pelo celular (desenvolvimento)

```bash
npm run dev -- --hostname 0.0.0.0
```

Acesse pelo IP da máquina na rede local: `http://192.168.x.x:3000`

> A câmera para o QR Code só funciona em HTTPS. Em desenvolvimento, use o Chrome com a flag `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.

---

## Deploy (Vercel)

1. Faça push do repositório para o GitHub
2. Importe o projeto em [vercel.com](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push na branch `main`

Em produção o HTTPS é automático — câmera, PWA e instalação na tela inicial funcionam sem configuração extra.

---

## Instalar como PWA

Em produção (HTTPS), acesse pelo Chrome no celular e toque em **"Adicionar à tela inicial"** no menu do navegador. O app abre em modo standalone, sem barra de endereço, igual a um app nativo.

---

## Funcionalidades

**Painel administrativo**

- Dashboard com KPIs em tempo real
- Mapa de rastreamento ao vivo
- Gestão de veículos (cadastro, edição, QR Code, status)
- Gestão de motoristas (cadastro, edição, PIN)
- Histórico de utilizações com filtros
- Relatórios exportáveis em PDF e Excel
- Configurações da empresa e do sistema
- Backup e restauração do banco local

**Aplicação do motorista**

- Login offline com sessão cacheada
- Escaneamento de QR Code do veículo
- Registro de KM inicial e final
- Rastreamento GPS durante a viagem
- Sincronização automática em background
- Funciona sem internet — sincroniza quando reconectar

---

## Autor

Victor Macedo
