import type { APIGatewayProxyHandler } from "aws-lambda";
import { listUsers } from "../services/userService";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const users = await listUsers();
    return success(users);
  } catch (err: any) {
    console.error("getUsers error:", err);
    return error(err.message);
  }
};
