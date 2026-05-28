````md
# 🚛 SF Frota

Sistema de gestão de frota desenvolvido com Next.js, TypeScript e TailwindCSS.

O projeto possui:

- painel administrativo
- gestão de veículos
- gestão de motoristas
- rastreamento em mapa
- relatórios
- fluxo operacional do motorista
- controle de utilização de veículos

---

# 📸 Preview

## Painel Administrativo

- Dashboard operacional
- Gestão de veículos
- Gestão de motoristas
- Rastreamento em tempo real
- Relatórios operacionais

## Aplicação do Motorista

- Escaneamento de QR Code
- Início de utilização
- Controle de KM inicial/final
- Tempo de viagem
- Revisão operacional
- Finalização de utilização

---

# 🛠️ Tecnologias

- Next.js 16
- React
- TypeScript
- TailwindCSS
- Leaflet
- React Leaflet

---

# 📂 Estrutura do Projeto

```bash
app/
components/
hooks/
lib/
public/
```
````

---

# 🚀 Como rodar o projeto

## 1️⃣ Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/sf-frota.git
```

---

## 2️⃣ Entrar na pasta

```bash
cd sf-frota
```

---

## 3️⃣ Instalar dependências

```bash
npm install
```

---

## 4️⃣ Rodar ambiente de desenvolvimento

```bash
npm run dev
```

---

# 🌐 Rodar na rede local (celular/outro dispositivo)

```bash
npm run dev -- -H 0.0.0.0
```

---

# ⚠️ Next.js 16 — allowedDevOrigins

Para acessar pela rede local:

```ts
// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["SEU-IP-LOCAL"],
};

export default nextConfig;
```

Exemplo:

```ts
allowedDevOrigins: ["192.168.2.64"];
```

---

# 📦 Build de produção

```bash
npm run build
```

---

# ▶️ Rodar produção

```bash
npm start
```

---

# ✅ Funcionalidades atuais

## Administração

- Cadastro de veículos
- Edição de veículos
- Controle de status
- Gestão de motoristas
- Controle de CNH
- Rastreamento no mapa
- Relatórios operacionais

## Motorista

- Fluxo de utilização
- Controle de KM
- Controle de tempo
- Revisão final da viagem

---

# 📌 Roadmap

## Próximos passos

- Integração entre admin e motorista
- Persistência real de viagens
- Backend/API
- Banco de dados
- Autenticação
- QR Code real
- Dashboard analítico
- Tracking em tempo real

---

# 🧠 Objetivo do projeto

O projeto foi desenvolvido como estudo prático de:

- arquitetura frontend
- componentização
- TypeScript
- modelagem operacional
- UX
- aplicações SaaS
- fluxo operacional de frota

---

# 👨‍💻 Autor

Victor Macedo

```

```
