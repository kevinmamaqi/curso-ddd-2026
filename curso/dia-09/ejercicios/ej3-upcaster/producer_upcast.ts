import amqplib from "amqplib";

(async () => {
  const conn = await amqplib.connect("amqp://localhost:5672");
  const channel = await conn.createChannel();

  const QUEUE = "task_assigned_queue";
  await channel.assertQueue(QUEUE, { durable: true });

  const v1 = { taskId: "task-1", assignedTo: "alice", version: 1 };
  const v2 = {
    taskId: "task-2",
    assignedTo: "bob",
    priority: "high",
    version: 2,
  };

  for (const event of [v1, v2]) {
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });
    console.log("Published TaskAssigned:", event);
  }

  await channel.close();
  await conn.close();
})();

