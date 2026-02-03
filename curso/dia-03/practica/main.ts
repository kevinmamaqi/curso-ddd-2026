import Fastify from 'fastify'
import { asClass, asValue, createContainer, InjectionMode } from 'awilix'
import { AppConfig, loadConfig } from './src/config/config'
import { healthRoutes } from './src/infra/http/healthRoutes'
import { bookStockRouter } from './src/infra/http/bookStockRouter'
import { ReserveBookUseCase } from './src/application/ReserveBookUseCase'
import { BookRepositoryPostgres } from './src/infra/repository/BookRepositoryPostgres'
import { DBClient } from './src/infra/repository/pg'
import { BookEventsPublisher } from './src/infra/events/BookEventsPublisherAdapter'

function buildContainer() {
    const container = createContainer({injectionMode: InjectionMode.CLASSIC})
    const dbClient = new DBClient(loadConfig())

    container.register({
        config: asValue(loadConfig()),
        dbClient: asValue(dbClient),
        bookRepo: asClass(BookRepositoryPostgres).singleton(),
        bookEvents: asClass(BookEventsPublisher).singleton(),
        reserveBookUseCase: asClass(ReserveBookUseCase).singleton(),
    })

    return container;
}

const container = buildContainer()

const app = Fastify({ logger: true })
app.register(healthRoutes)
app.register(bookStockRouter, { deps: {
    reserveBookUseCase: container.resolve("reserveBookUseCase"),
} })


const config = container.resolve<AppConfig>("config")
app.listen({ port: config.port, host: config.host }, (err, address) => {
    if (err) throw err
    app.log.info(`Server is running on ${address}`)
  }
);
