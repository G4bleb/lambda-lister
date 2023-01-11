import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  FunctionConfiguration,
  LambdaClient,
  ListFunctionsCommand,
  ListFunctionsCommandOutput,
} from "@aws-sdk/client-lambda";

const client = new LambdaClient({});
const command = new ListFunctionsCommand({});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  //Get all lambdas
  let awsResponse: ListFunctionsCommandOutput;
  try {
    awsResponse = await client.send(command);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
    };
  }
  const responseBody: FunctionConfiguration[] = awsResponse.Functions ?? [];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(responseBody),
  };
};
