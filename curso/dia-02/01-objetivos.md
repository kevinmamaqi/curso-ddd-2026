# Sesión 2 · Jueves 29-ene-2026  
**Duración:** 16:00 – 19:00
**Tema global:** *Arquitectura Hexagonal + DDD táctico: Domain Objects, Use Cases, Puertos y Adaptadores*

**Temario (referencia):**
- [10 · Arquitectura hexagonal y la aplicación de DDD](../../NUEVO_TEMARIO.md#10-arquitectura-hexagonal-y-la-aplicación-de-ddd)
  - Introducción a la arquitectura hexagonal
  - Principios de la arquitectura hexagonal
  - Módulos de la arquitectura hexagonal
  - Convirtiendo microservicios a arquitectura hexagonal
  - Diferencias entre Arquitecturas: Clean vs Hexagonal vs Onion
- [11 · Domain Objects y casos de uso](../../NUEVO_TEMARIO.md#11-domain-objects-y-casos-de-uso)
  - ¿Qué son los Domain Objects?
  - ¿Para que sirven los Domain Objects?
  - Creando nuestro primer Domain Object en un proyecto Node bajo un modelo de arquitectura hexagonal
  - ¿Qué son los casos de uso en la arquitectura hexagonal?
  - ¿Para que sirven los casos de uso?
  - Creación de proyecto Node bajo un modelo de arquitectura hexagonal
- [12 · Patrones de arquitectura en DDD](../../NUEVO_TEMARIO.md#12-patrones-de-arquitectura-en-ddd)
  - Arquitectura por capas
  - Capa de presentación
  - Capa de lógica empresarial
  - Capa de acceso de datos
  - Comunicación entre capas
  - Puertos de entrada y salida en la arquitectura hexagonal
  - ¿Cómo se relacionan los puertos con los Domain Object y los casos de uso?
  - Creando un puerto de entrada y salida en un proyecto Node bajo un modelo de arquitectura hexagonal
  - Tipos de adaptadores en la arquitectura hexagonal
  - Segregación de responsabilidad entre comandos y consultas
  - Scope

## Objetivos del día

| # | Objetivo concreto                                                 | ¿Por qué importa?                                                      |
|---|-------------------------------------------------------------------|------------------------------------------------------------------------|
| 1 | Entender la arquitectura hexagonal y cómo se relaciona con DDD     | Protege el core de dominio y facilita evolución y testabilidad en microservicios. |
| 2 | Crear nuestros primeros **Domain Objects** (Entities/VO) y **Use Cases** | Traslada reglas de negocio a un modelo explícito (no a controladores). |
| 3 | Diferenciar **puertos de entrada/salida** y sus adaptadores        | Define contratos; reduce acoplamiento y habilita *swaps* tecnológicos. |
| 4 | Configurar DI con Awilix (scopes) e inyectar adapters (Postgres, broker) | Permite reemplazar infraestructura sin tocar dominio/aplicación. |
| 5 | Exponer un API HTTP fino que delegue en Use Cases + tests           | Un servicio operable necesita endpoints, contratos y pruebas automatizadas. |

---

## Relación con el Proyecto Final

Hoy trabajamos en dos fases:

1. **Durante la sesión (práctica rápida):** implementamos los conceptos en `curso/dia-02/ejercicios` con un mini‑dominio “biblioteca” (reservas de stock), para que el foco sea arquitectura y modelado, no el proyecto.
2. **Al final (transfer):** aplicamos el mismo patrón al **inventory-service** en `project/services/inventory-service`.

---

## Requisitos antes de empezar

- Para **ejercicios**: Node.js 20+ y editor listo  
- Para el **transfer al proyecto** (final): contenedores up (`docker compose up -d`)  
- Código base del proyecto funcionando en `project/services/inventory-service`  
- VS Code abierto en la carpeta del servicio con ESLint activo  

Con estos objetivos claros, arrancamos sesión 2 enfocándonos en puertos, adapters y DI. ¡Vamos allá!
