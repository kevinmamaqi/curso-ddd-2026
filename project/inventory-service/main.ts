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
import { OutboxRepositoryPostgres } from './src/infra/repository/OutboxRepositoryPostgres'
import { InboxRepositoryPostgres } from './src/infra/repository/InboxRepositoryPostgres'
import { OutboxHttpPublisher } from './src/infra/events/OutboxHttpPublisher'
import { InventoryIntegrationEventsPublisher } from './src/infra/events/InventoryIntegrationEventsPublisher'
import { integrationRouter } from './src/infra/http/integrationRouter'
import { HandleReserveStockRequestedUseCase } from './src/application/HandleReserveStockRequestedUseCase'

async function start() {
    const config = loadConfig()
    const dbClient = new DBClient(config)
    await dbClient.connect()

    const container = createContainer({ injectionMode: InjectionMode.CLASSIC })
    container.register({
        config: asValue(config),
        dbClient: asValue(dbClient),
        bookRepo: asClass(BookRepositoryPostgres).singleton(),
        inventoryViewRepo: asClass(InventoryViewRepositoryPostgres).singleton(),
        inventoryViewProjector: asClass(InventoryViewProjector).singleton(),
        bookEvents: asClass(BookEventsPublisher).singleton(),
        reserveBookUseCase: asClass(ReserveBookUseCase).singleton(),
        getInventoryBySkuQuery: asClass(GetInventoryBySkuQuery).singleton(),
        outboxRepo: asClass(OutboxRepositoryPostgres).singleton(),
        inboxRepo: asClass(InboxRepositoryPostgres).singleton(),
        outboxPublisher: asClass(OutboxHttpPublisher).singleton(),
        integrationEvents: asClass(InventoryIntegrationEventsPublisher).singleton(),
        handleReserveStockRequestedUseCase: asClass(HandleReserveStockRequestedUseCase).singleton(),
    })

    await container.resolve<BookRepositoryPostgres>("bookRepo").initSchema()
    await container.resolve<InventoryViewRepositoryPostgres>("inventoryViewRepo").initSchema()
    await container.resolve<OutboxRepositoryPostgres>("outboxRepo").initSchema()
    await container.resolve<InboxRepositoryPostgres>("inboxRepo").initSchema()

    const app = Fastify({ logger: true })
    app.register(healthRoutes)
    app.register(bookStockRouter, { deps: {
        reserveBookUseCase: container.resolve("reserveBookUseCase"),
        getInventoryBySkuQuery: container.resolve("getInventoryBySkuQuery"),
    } })
    app.register(integrationRouter, { deps: {
        handleReserveStockRequestedUseCase: container.resolve("handleReserveStockRequestedUseCase"),
    } })

    const publisher = container.resolve<OutboxHttpPublisher>("outboxPublisher")
    publisher.start({ intervalMs: 500 })

    app.addHook("onClose", async () => {
        publisher.stop()
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
