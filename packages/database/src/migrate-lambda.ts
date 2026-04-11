import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import runner from "node-pg-migrate";
import { Client } from "pg";
import path from "path";
import { runSeed } from "../seeds/seed-fn";

const smClient = new SecretsManagerClient({});

async function getDbConfig() {
  const secretArn = process.env.DATABASE_SECRET_ARN!;
  const host = process.env.DATABASE_HOST!;
  const dbName = process.env.DATABASE_NAME!;

  const { SecretString } = await smClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  const secret = JSON.parse(SecretString!);

  return {
    host,
    port: 5432,
    database: dbName,
    user: secret.username,
    password: secret.password,
    ssl: { rejectUnauthorized: false },
  };
}

export async function handler(
  event: { RequestType?: string } & Record<string, unknown>
): Promise<{ PhysicalResourceId: string; Data: Record<string, string> }> {
  // Only run on Create/Update, not Delete
  if (event.RequestType === "Delete") {
    return {
      PhysicalResourceId: "migration",
      Data: { status: "skipped" },
    };
  }

  const config = await getDbConfig();
  const client = new Client(config);
  await client.connect();

  try {
    await runner({
      dbClient: client,
      dir: path.join(__dirname, "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      log: console.log,
    });

    // Seed data after migrations
    console.log("Running seed...");
    await runSeed(client);
  } finally {
    await client.end();
  }

  return {
    PhysicalResourceId: "migration",
    Data: { status: "complete" },
  };
}
