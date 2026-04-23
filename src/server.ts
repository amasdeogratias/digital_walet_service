// console.log("Api is running...");
import { buildApplication } from './container';
import { env } from './config/env';
import { connectMongo, closeMongo } from './database/mongo';
import { closePostgres } from './database/postgres';

const start = async (): Promise<void> => {
  await connectMongo();
  const app = buildApplication();
  const server = app.listen(env.port, () => {
    console.log(`Wallet service listening on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await Promise.all([closeMongo(), closePostgres()]);
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((error) => {
  console.error('Failed to start wallet service', error);
  process.exit(1);
});
