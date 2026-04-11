import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

interface DbSecret {
  username: string;
  password: string;
}

const client = new SecretsManagerClient({});
let cached: DbSecret | null = null;

export async function getDbSecret(): Promise<DbSecret> {
  if (cached) return cached;

  const { SecretString } = await client.send(
    new GetSecretValueCommand({
      SecretId: process.env.DATABASE_SECRET_ARN!,
    })
  );

  cached = JSON.parse(SecretString!) as DbSecret;
  return cached;
}
