import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaRuntime from "aws-cdk-lib/aws-lambda";
import * as cr from "aws-cdk-lib/custom-resources";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import * as path from "path";

interface MigrationStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbCluster: rds.DatabaseCluster;
  dbSecret: secretsmanager.ISecret;
  lambdaSg: ec2.SecurityGroup;
}

export class MigrationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id, props);

    const { vpc, dbCluster, dbSecret, lambdaSg } = props;

    const migrationHandler = new lambda.NodejsFunction(
      this,
      "MigrationHandler",
      {
        runtime: lambdaRuntime.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../../database/src/migrate-lambda.ts"
        ),
        handler: "handler",
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSg],
        environment: {
          DATABASE_SECRET_ARN: dbSecret.secretArn,
          DATABASE_HOST: dbCluster.clusterEndpoint.hostname,
          DATABASE_NAME: "movie_theater",
        },
        bundling: {
          externalModules: ["pg-native", "@aws-sdk/*"],
          commandHooks: {
            beforeBundling() {
              return [];
            },
            afterBundling(inputDir: string, outputDir: string) {
              const migrationsDir = `${inputDir}/packages/database/migrations`;
              return [
                `mkdir -p ${outputDir}/migrations`,
                `for f in ${migrationsDir}/*.ts; do npx esbuild "$f" --outfile="${outputDir}/migrations/$(basename "\${f%.ts}.js")" --format=cjs --platform=node; done`,
              ];
            },
            beforeInstall() {
              return [];
            },
          },
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
      }
    );

    dbSecret.grantRead(migrationHandler);

    const provider = new cr.Provider(this, "MigrationProvider", {
      onEventHandler: migrationHandler,
    });

    const migration = new cdk.CustomResource(this, "MigrationResource", {
      serviceToken: provider.serviceToken,
      properties: {
        // Change this value to trigger a new migration run on deploy
        version: Date.now().toString(),
      },
    });

    migration.node.addDependency(dbCluster);
  }
}
