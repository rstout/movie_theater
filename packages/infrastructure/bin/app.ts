#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/vpc-stack";
import { DatabaseStack } from "../lib/database-stack";
import { BackendStack } from "../lib/backend-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { MigrationStack } from "../lib/migration-stack";

const app = new cdk.App();

const vpc = new VpcStack(app, "MovieTheaterVpc");

const database = new DatabaseStack(app, "MovieTheaterDatabase", {
  vpc: vpc.vpc,
});

const migration = new MigrationStack(app, "MovieTheaterMigration", {
  vpc: vpc.vpc,
  dbCluster: database.cluster,
  dbSecret: database.cluster.secret!,
  lambdaSg: database.lambdaSg,
});

const backend = new BackendStack(app, "MovieTheaterBackend", {
  vpc: vpc.vpc,
  dbProxy: database.proxy,
  dbSecret: database.cluster.secret!,
  lambdaSg: database.lambdaSg,
});

new FrontendStack(app, "MovieTheaterFrontend", {
  apiUrl: backend.apiUrl,
});
