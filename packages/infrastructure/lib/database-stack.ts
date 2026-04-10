import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly proxy: rds.DatabaseProxy;
  public readonly lambdaSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Security groups
    const dbSg = new ec2.SecurityGroup(this, "DatabaseSg", {
      vpc,
      description: "Aurora Serverless v2 security group",
    });

    this.lambdaSg = new ec2.SecurityGroup(this, "LambdaSg", {
      vpc,
      description: "Lambda functions security group",
    });

    dbSg.addIngressRule(
      this.lambdaSg,
      ec2.Port.tcp(5432),
      "Allow Lambda access to Aurora"
    );

    // Aurora Serverless v2
    this.cluster = new rds.DatabaseCluster(this, "AuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 16,
      writer: rds.ClusterInstance.serverlessV2("Writer"),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      defaultDatabaseName: "movie_theater",
      storageEncrypted: true,
    });

    // RDS Proxy
    this.proxy = this.cluster.addProxy("RdsProxy", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      secrets: [this.cluster.secret!],
      securityGroups: [dbSg],
      requireTLS: true,
    });

    // Outputs
    new cdk.CfnOutput(this, "ClusterEndpoint", {
      value: this.cluster.clusterEndpoint.hostname,
    });

    new cdk.CfnOutput(this, "ProxyEndpoint", {
      value: this.proxy.endpoint,
    });

    new cdk.CfnOutput(this, "SecretArn", {
      value: this.cluster.secret!.secretArn,
    });
  }
}
