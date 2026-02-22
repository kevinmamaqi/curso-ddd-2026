import Fastify from 'fastify'
import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import { loadConfig } from './src/config/config'
import { healthRoutes } from './src/infra/http/healthRoutes'
import { bookStockRouter } from './src/infra/http/bookStockRouter'
import { ReserveBookUseCase } from './src/application/ReserveBookUseCase'
import { BookRepositoryPostgres } from './src/infra/repository/BookRepositoryPostgres'
import { DBClient } from './src/infra/repository/pg'
import { BookEventsPublisher } from './src/infra/events/BookEventsPublisherAdapter'
import { InventoryViewRepositoryPostgres } from './src/infra/repository/InventoryViewRepositoryPostgres'
import { InventoryViewProjector } from './src/application/InventoryViewProjector'
import { GetInventoryBySkuQuery } from './src/application/GetInventoryBySkuQuery'
import { ListInventoryQuery } from "./src/application/ListInventoryQuery";
import { OutboxRepositoryPostgres } from './src/infra/repository/OutboxRepositoryPostgres'
import { InboxRepositoryPostgres } from './src/infra/repository/InboxRepositoryPostgres'
import { OutboxRabbitPublisher } from './src/infra/events/OutboxRabbitPublisher'
import { InventoryIntegrationEventsPublisher } from './src/infra/events/InventoryIntegrationEventsPublisher'
import { integrationRouter } from './src/infra/http/integrationRouter'
import { HandleReserveStockRequestedUseCase } from './src/application/HandleReserveStockRequestedUseCase'
import { ReserveStockRequestedRabbitConsumer } from './src/infra/messaging/ReserveStockRequestedRabbitConsumer'
import { startOtel } from './src/infra/observability/otel'
import { ReservationRepositoryPostgres } from "./src/infra/repository/ReservationRepositoryPostgres";
import { UnitOfWorkPostgres } from "./src/infra/repository/UnitOfWorkPostgres";
import { ReplenishStockUseCase } from "./src/application/ReplenishStockUseCase";
import { ReleaseReservationUseCase } from "./src/application/ReleaseReservationUseCase";
import { GetReservationsByReservationIdQuery } from "./src/application/GetReservationsByReservationIdQuery";
import { HandleReleaseReservationRequestedUseCase } from "./src/application/HandleReleaseReservationRequestedUseCase";
import { ReleaseReservationRequestedRabbitConsumer } from "./src/infra/messaging/ReleaseReservationRequestedRabbitConsumer";
import { InventoryGrpcServer } from "./src/infra/grpc/InventoryGrpcServer";
import pino from "pino";
import fs from "node:fs";
import path from "node:path";

async function start() {
    const config = loadConfig()

    const otelSdk = await startOtel({
        serviceName: config.otelServiceName,
        otlpEndpoint: config.otelExporterOtlpEndpoint,
        metricsPort: config.metricsPort,
    })

    const dbClient = new DBClient(config)
    await dbClient.connect()

    const container = createContainer({ injectionMode: InjectionMode.CLASSIC })
    container.register({
        config: asValue(config),
        dbClient: asValue(dbClient),
        uow: asClass(UnitOfWorkPostgres).singleton(),
        bookRepo: asClass(BookRepositoryPostgres).singleton(),
        reservationRepo: asClass(ReservationRepositoryPostgres).singleton(),
        inventoryViewRepo: asClass(InventoryViewRepositoryPostgres).singleton(),
        inventoryViewProjector: asClass(InventoryViewProjector).singleton(),
        bookEvents: asClass(BookEventsPublisher).singleton(),
        reserveBookUseCase: asClass(ReserveBookUseCase).singleton(),
        getInventoryBySkuQuery: asClass(GetInventoryBySkuQuery).singleton(),
        listInventoryQuery: asClass(ListInventoryQuery).singleton(),
        replenishStockUseCase: asClass(ReplenishStockUseCase).singleton(),
        releaseReservationUseCase: asClass(ReleaseReservationUseCase).singleton(),
        getReservationsByReservationIdQuery: asClass(GetReservationsByReservationIdQuery).singleton(),
        outboxRepo: asClass(OutboxRepositoryPostgres).singleton(),
        inboxRepo: asClass(InboxRepositoryPostgres).singleton(),
        outboxPublisher: asClass(OutboxRabbitPublisher).singleton(),
        integrationEvents: asClass(InventoryIntegrationEventsPublisher).singleton(),
        handleReserveStockRequestedUseCase: asClass(HandleReserveStockRequestedUseCase).singleton(),
        reserveStockRequestedConsumer: asClass(ReserveStockRequestedRabbitConsumer)
          .inject((cradle: any) => ({ useCase: cradle.handleReserveStockRequestedUseCase }))
          .singleton(),
        handleReleaseReservationRequestedUseCase: asClass(HandleReleaseReservationRequestedUseCase).singleton(),
        releaseReservationRequestedConsumer: asClass(ReleaseReservationRequestedRabbitConsumer)
          .inject((cradle: any) => ({ useCase: cradle.handleReleaseReservationRequestedUseCase }))
          .singleton(),
        grpcServer: asClass(InventoryGrpcServer).singleton(),
    })

    await container.resolve<BookRepositoryPostgres>("bookRepo").initSchema()
    await container.resolve<ReservationRepositoryPostgres>("reservationRepo").initSchema()
    await container.resolve<InventoryViewRepositoryPostgres>("inventoryViewRepo").initSchema()
    await container.resolve<OutboxRepositoryPostgres>("outboxRepo").initSchema()
    await container.resolve<InboxRepositoryPostgres>("inboxRepo").initSchema()

    const logger =
        config.logFile
            ? (() => {
                fs.mkdirSync(path.dirname(config.logFile as string), { recursive: true })
                return pino({}, pino.destination({ dest: config.logFile as string, sync: false }))
            })()
            : true
    const app = Fastify({ logger })
    app.register(healthRoutes)
    app.register(bookStockRouter, { deps: {
        reserveBookUseCase: container.resolve("reserveBookUseCase"),
        getInventoryBySkuQuery: container.resolve("getInventoryBySkuQuery"),
        replenishStockUseCase: container.resolve("replenishStockUseCase"),
        releaseReservationUseCase: container.resolve("releaseReservationUseCase"),
        listInventoryQuery: container.resolve("listInventoryQuery"),
        getReservationsByReservationIdQuery: container.resolve("getReservationsByReservationIdQuery"),
    } })
    app.register(integrationRouter, { deps: {
        handleReserveStockRequestedUseCase: container.resolve("handleReserveStockRequestedUseCase"),
    } })

    const publisher = container.resolve<OutboxRabbitPublisher>("outboxPublisher")
    await publisher.start({ intervalMs: 500 })

    const consumer = container.resolve<ReserveStockRequestedRabbitConsumer>("reserveStockRequestedConsumer")
    await consumer.start()

    const releaseConsumer =
      container.resolve<ReleaseReservationRequestedRabbitConsumer>("releaseReservationRequestedConsumer")
    await releaseConsumer.start()

    const grpcServer = container.resolve<InventoryGrpcServer>("grpcServer")
    await grpcServer.start()

    app.addHook("onClose", async () => {
        await consumer.stop()
        await releaseConsumer.stop()
        await publisher.stop()
        await grpcServer.stop()
        await otelSdk.shutdown()
        await dbClient.disconnect()
    })

    app.listen({ port: config.port, host: config.host }, (err, address) => {
        if (err) throw err
        app.log.info(`Server is running on ${address}`)
    })
}

start().catch((err) => {
    console.error(err)
    process.exit(1)
})
