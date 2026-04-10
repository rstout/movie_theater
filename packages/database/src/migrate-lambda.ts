import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import runner from "node-pg-migrate";
import path from "path";

const smClient = new SecretsManagerClient({});

async function getDatabaseUrl(): Promise<string> {
  const secretArn = process.env.DATABASE_SECRET_ARN!;
  const host = process.env.DATABASE_HOST!;
  const dbName = process.env.DATABASE_NAME!;

  const { SecretString } = await smClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  const secret = JSON.parse(SecretString!);

  return `postgresql://${secret.username}:${encodeURIComponent(secret.password)}@${host}:5432/${dbName}?ssl=true`;
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

  const databaseUrl = await getDatabaseUrl();

  await runner({
    databaseUrl,
    dir: path.join(__dirname, "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    log: console.log,
  });

  return {
    PhysicalResourceId: "migration",
    Data: { status: "complete" },
  };
}
