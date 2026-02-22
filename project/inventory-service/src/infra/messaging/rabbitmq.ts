import * as amqplib from "amqplib";

export type RabbitConfig = Readonly<{
  url: string;
  exchange: string;
  dlx: string;
}>;

export async function connectRabbit(config: RabbitConfig): Promise<amqplib.ChannelModel> {
  return await amqplib.connect(config.url);
}

export async function createConfirmChannel(conn: amqplib.ChannelModel): Promise<amqplib.ConfirmChannel> {
  const channel = await conn.createConfirmChannel();
  return channel;
}

export async function createChannel(conn: amqplib.ChannelModel): Promise<amqplib.Channel> {
  return await conn.createChannel();
}

export async function assertTopology(params: {
  channel: amqplib.Channel;
  exchange: string;
  dlx: string;
}): Promise<void> {
  const { channel, exchange, dlx } = params;
  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertExchange(dlx, "direct", { durable: true });
}
