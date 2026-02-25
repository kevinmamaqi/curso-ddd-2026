workspace "Curso DDD Hex Node" "C4 del proyecto del curso (project/)" {
  model {
    student = person "Cliente/Estudiante" "Dispara requests HTTP y sigue el flujo EDA con observabilidad."

    system = softwareSystem "Course Project" "API Gateway + Order Fulfillment + Inventory" {
      gateway = container "api-gateway" "BFF HTTP (y opcional gRPC) hacia los servicios." "Node.js + Fastify"
      fulfillment = container "order-fulfillment-service" "API + workers (Outbox/Inbox) para crear/cancelar pedidos." "Node.js + Fastify"
      inventory = container "inventory-service" "API + workers (Outbox/Inbox) para stock/reservas." "Node.js + Fastify"
    }

    postgres = softwareSystem "Postgres" "Persistencia por servicio (DBs: inventory, fulfillment)." { tags "database" }
    rabbit = softwareSystem "RabbitMQ" "Broker AMQP (exchange course.events.v1 + DLX course.dlx.v1)." { tags "broker" }
    obs = softwareSystem "Grafana Stack" "Grafana + Prometheus + Loki + Tempo." { tags "observability" }

    student -> system.gateway "HTTP"
    system.gateway -> system.fulfillment "HTTP/gRPC (downstream)"
    system.gateway -> system.inventory "HTTP/gRPC (downstream)"

    system.fulfillment -> postgres "SQL (fulfillment DB)"
    system.inventory -> postgres "SQL (inventory DB)"

    system.fulfillment -> rabbit "AMQP publish/consume (Outbox/Consumers)"
    system.inventory -> rabbit "AMQP publish/consume (Outbox/Consumers)"

    system.gateway -> obs "OTLP traces + /metrics + logs"
    system.fulfillment -> obs "OTLP traces + /metrics + logs"
    system.inventory -> obs "OTLP traces + /metrics + logs"
  }

  views {
    systemContext system "context" {
      include *
      autolayout lr
    }

    container system "containers" {
      include *
      autolayout lr
    }

    styles {
      element "database" { shape Cylinder background "#EEE" }
      element "broker" { shape Cylinder background "#DDEEFF" }
      element "observability" { background "#FFF4DD" }
    }
  }
}

