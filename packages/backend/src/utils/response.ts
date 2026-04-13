import type { APIGatewayProxyResult } from "aws-lambda";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface SuccessOptions {
  statusCode?: number;
  cacheControl?: string;
}

export function success(
  body: unknown,
  options: SuccessOptions | number = {}
): APIGatewayProxyResult {
  const { statusCode = 200, cacheControl } =
    typeof options === "number" ? { statusCode: options } : options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...CORS_HEADERS,
  };
  if (cacheControl) {
    headers["Cache-Control"] = cacheControl;
  }
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export function error(
  message: string,
  statusCode = 500
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify({ error: message }),
  };
}
