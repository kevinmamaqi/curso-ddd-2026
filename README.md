# Curso “Arquitectura de Microservicios, Hexagonal y DDD en Node con Typescript”  
**30 h · Ene–Feb 2026 · remoto**

- Curso de [Imagina Formación](https://imaginaformacion.com/).
- Formador: [Kevin Mamaqi Kapllani](https://www.linkedin.com/in/kevinmamaqi/).
- Repo: [https://github.com/kevinmamaqi/curso-ddd-2026](https://github.com/kevinmamaqi/curso-ddd-2026).

---

### 📄 Licencia

Este contenido está disponible públicamente para su consulta y aprendizaje, pero **no puede ser reutilizado, modificado ni distribuido con fines comerciales** sin autorización expresa del autor.

**Licencia**: [Creative Commons Atribución-NoComercial-SinDerivadas 4.0 Internacional (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es)

Esto significa:

- ✅ Puedes ver, descargar y compartir el material con atribución al autor.
- ❌ No puedes modificarlo, adaptarlo ni crear obras derivadas.
- ❌ No puedes utilizarlo con fines comerciales (como cursos, bootcamps, o formación interna).

Para usos distintos a los permitidos por esta licencia, contacta al autor.

---

## 📌 Descripción del curso

Este curso en línea se enfoca en el diseño y desarrollo de aplicaciones web usando los principios de la **Arquitectura de Microservicios**, **Arquitectura Hexagonal**, **DDD** y **CQRS** en Node.

**Dirigido a:** Desarrolladores experimentados en desarrollo de Web APIs en Node que quieran valorar rediseños a través de soluciones DDD/hexagonal y garantizar alto rendimiento bajo el patrón CQRS.

**Objetivos:**

- Aprender los conceptos y establecer un criterio unificado en los conceptos de microservicios para proyectos Node.
- Aprender a establecer planes a largo plazo para crear arquitecturas limpias, mantenibles, escalables y robustas (Arquitectura hexagonal y DDD).
- Establecer estrategias unificadas, evitar errores comunes y criterios comunes para la comunicación síncrona y garantía de alta disponibilidad.
- Aprender a garantizar arquitecturas de alta capacidad, analizando estrategias de implantación y estableciendo buenas prácticas.
- Dominar técnicas de migración desde otras arquitecturas hacia microservicios y poder aplicar microservicios, arquitectura hexagonal y DDD en proyectos reales.

**Requisitos (previos):**

- Experiencia previa en desarrollo de Web APIs con JavaScript/TypeScript y Express (u otros frameworks Node) y experiencia dockerizando este tipo de soluciones.
- Tener instalado previamente: NodeJS LTS, npm, Git (con cuenta GitHub), Docker/Docker Desktop y Visual Studio Code.
- Equipo con permisos suficientes de instalación, mínimo 8GB de RAM, 20GB de espacio libre y conexión estable a Internet.
- Tener Zoom de escritorio configurado (micrófono, auriculares/cámara y permisos para compartir pantalla).

> El temario y la planificación están integrados en las sesiones del repositorio.

## 🗓️ Horario del curso (2026)

Sesiones de **16:00 a 19:00**.

Duración total: **30h** · Área profesional: **Desarrollo** · Grupo de acciones: **Informática**

| Sesión | Día | Fecha |
|--------|-----|-------|
| 1 | Martes | 27-ene-2026 |
| 2 | Jueves | 29-ene-2026 |
| 3 | Martes | 03-feb-2026 |
| 4 | Jueves | 05-feb-2026 |
| 5 | Martes | 10-feb-2026 |
| 6 | Jueves | 12-feb-2026 |
| 7 | Martes | 17-feb-2026 |
| 8 | Jueves | 19-feb-2026 |
| 9 | Martes | 24-feb-2026 |
| 10 | Jueves | 26-feb-2026 |

## 📚 Estructura del repositorio

```
.
├── curso/                    # 10 carpetas, una por sesión
│   ├── dia-01/               # markdown, ejemplos y quiz
│   ├── dia-02/
│   ├── ...
│   └── dia-10/
├── project/                  # Proyecto evolutivo + stack local
│   ├── docker-compose.yml    # Postgres, RabbitMQ, Prometheus, Grafana
│   ├── .env                  # variables para el stack
│   ├── services/             # servicios de dominio (Fastify + TS)
│   ├── clients/              # APIs cliente/BFF (Fastify + TS)
│   ├── prometheus/           # config de scrape
│   └── grafana/              # provisioning (opcional)
└── README.md                 # (este archivo)
```

| Pilar | Sesiones | Carpeta principal |
|-------|------|-------------------|
| Microservicios (Fundamentos) | 1 | `curso/dia-01/` |
| Arquitectura Hexagonal & DDD | 2 – 5 | `curso/dia-02/` … `curso/dia-05/` |
| CQRS & Rendimiento           | 6 – 7 | `curso/dia-06/`, `curso/dia-07/` |
| Comunicación asíncrona (EDA) | 8 – 9 | `curso/dia-08/`, `curso/dia-09/` |
| Observabilidad & Cierre      | 10    | `curso/dia-10/` |

---

## 🚀 Requisitos rápidos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 20 LTS |
| **npm**     | ≥ 10 |
| Docker & Compose | ≥ 20.10 |
| Git         | ≥ 2.34 |

### Puesta en marcha (Docker)

```bash
docker compose --env-file project/.env -f project/docker-compose.yml up -d --build
```

Servicios expuestos en local:

- `http://localhost:3000` (Grafana)
- `http://localhost:9090` (Prometheus)
- `http://localhost:15672` (RabbitMQ)
- `http://localhost:3001/health` (inventory-service)
- `http://localhost:3002/health` (order-service)
- `http://localhost:4001/health` (inventory-api)
- `http://localhost:4002/health` (order-api)

---

## 🧩 Proyecto Evolutivo (carpeta `project/`)

| Componente | Rol | Tech |
|----------|-----|------|
| **inventory-service** | Inventario (dominio + eventos) | Node 20 + TS + Fastify + Prisma |
| **order-service** | Pedidos (servicio mínimo para el curso) | Node 20 + TS + Fastify |
| **inventory-api** | API cliente (lectura + reposición) | Node 20 + TS + Fastify |
| **order-api** | API cliente (base para ejercicios) | Node 20 + TS + Fastify |
| **postgres** | Base de datos | Postgres 17 |
| **rabbit** | Broker de mensajería | RabbitMQ 4.1 |
| **prometheus** | Métricas | Prometheus |
| **grafana** | Dashboards | Grafana |

Estructura interna:

```
services/<svc>/
├── src/
│   ├── domain/          # Aggregates, VO, Domain Events
│   ├── application/     # Puertos + UseCases
│   ├── infrastructure/  # Adapters HTTP, DB, MQ
│   └── main.ts          # Bootstrap + DI (awilix)
└── Dockerfile
```

---

## 🛠️ Scripts npm principales

| Comando | Descripción |
|---------|-------------|
| `docker compose --env-file project/.env -f project/docker-compose.yml up -d --build` | Levanta el stack local |
| `docker compose --env-file project/.env -f project/docker-compose.yml down` | Para el stack |
| `npm --prefix project/services/inventory-service run dev` | Dev del inventory-service |
| `npm --prefix project/services/order-service run dev` | Dev del order-service |
| `npm --prefix project/services/inventory-service test:run` | Tests del inventory-service |

---

## 📈 Observabilidad local

| URL | Notas |
|-----|-------|
| `http://localhost:3000` (Grafana) | admin / admin |
| `http://localhost:15672` (RabbitMQ) | guest / guest |
| `http://localhost:9090` (Prometheus) | — |

---

## ✍️ Cómo contribuir

1. **Fork** y clona tu copia  
2. Crea rama `feat/<nombre>` o `fix/<issue>`  
3. Commits con Conventional Commits  
4. Abre **draft PR** — revisión en vivo durante el curso  

---

¡A diseñar software alineado al dominio! 🚀
