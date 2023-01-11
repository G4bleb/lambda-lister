import { FunctionConfiguration } from "@aws-sdk/client-lambda";

export interface LambdaFunctionData extends FunctionConfiguration {
  tags?: Record<string, string>;
  region?: string;
}
