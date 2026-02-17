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
    })

    await container.resolve<BookRepositoryPostgres>("bookRepo").initSchema()
    await container.resolve<InventoryViewRepositoryPostgres>("inventoryViewRepo").initSchema()

    const app = Fastify({ logger: true })
    app.register(healthRoutes)
    app.register(bookStockRouter, { deps: {
        reserveBookUseCase: container.resolve("reserveBookUseCase"),
        getInventoryBySkuQuery: container.resolve("getInventoryBySkuQuery"),
    } })

    app.addHook("onClose", async () => {
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
