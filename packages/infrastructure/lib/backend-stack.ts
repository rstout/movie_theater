import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaRuntime from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import * as path from "path";

interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbProxy: rds.DatabaseProxy;
  dbSecret: secretsmanager.ISecret;
  lambdaSg: ec2.SecurityGroup;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { vpc, dbProxy, dbSecret, lambdaSg } = props;

    const handlersDir = path.join(__dirname, "../../backend/src/handlers");

    const commonLambdaProps: Partial<lambda.NodejsFunctionProps> = {
      runtime: lambdaRuntime.Runtime.NODEJS_20_X,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      environment: {
        DATABASE_SECRET_ARN: dbSecret.secretArn,
        DATABASE_HOST: dbProxy.endpoint,
        DATABASE_NAME: "movie_theater",
        NODE_OPTIONS: "--enable-source-maps",
      },
      bundling: {
        externalModules: ["pg-native", "@aws-sdk/*"],
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 1024,
    };

    // Helper to create a Lambda function
    const createHandler = (name: string) =>
      new lambda.NodejsFunction(this, name, {
        ...commonLambdaProps,
        entry: path.join(handlersDir, `${name}.ts`),
        handler: "handler",
      } as lambda.NodejsFunctionProps);

    const getUsers = createHandler("getUsers");
    const getMovies = createHandler("getMovies");
    const getShowtimes = createHandler("getShowtimes");
    const getSeats = createHandler("getSeats");
    const createBooking = createHandler("createBooking");
    const confirmBooking = createHandler("confirmBooking");
    const getBooking = createHandler("getBooking");
    const expireStaleBookings = createHandler("expireStaleBookings");

    // Grant Secrets Manager access
    const allFunctions = [
      getUsers,
      getMovies,
      getShowtimes,
      getSeats,
      createBooking,
      confirmBooking,
      getBooking,
      expireStaleBookings,
    ];

    for (const fn of allFunctions) {
      dbSecret.grantRead(fn);
      dbProxy.grantConnect(fn);
    }

    // API Gateway
    const api = new apigateway.RestApi(this, "MovieTheaterApi", {
      restApiName: "Movie Theater API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type"],
      },
    });

    // Routes
    const usersResource = api.root.addResource("users");
    usersResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUsers)
    );

    const moviesResource = api.root.addResource("movies");
    moviesResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getMovies)
    );

    const movieShowtimes = moviesResource
      .addResource("{movieId}")
      .addResource("showtimes");
    movieShowtimes.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getShowtimes)
    );

    const showtimesResource = api.root.addResource("showtimes");
    const showtimeSeats = showtimesResource
      .addResource("{showId}")
      .addResource("seats");
    showtimeSeats.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getSeats)
    );

    const bookingsResource = api.root.addResource("bookings");
    bookingsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createBooking)
    );

    const bookingById = bookingsResource.addResource("{id}");
    bookingById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getBooking)
    );
    bookingById
      .addResource("confirm")
      .addMethod("PATCH", new apigateway.LambdaIntegration(confirmBooking));

    // EventBridge rule: expire stale bookings every 1 minute
    new events.Rule(this, "ExpireBookingsRule", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new targets.LambdaFunction(expireStaleBookings)],
    });

    this.apiUrl = api.url;

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
  }
}
