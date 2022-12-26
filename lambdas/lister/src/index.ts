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
  const filterName = event.queryStringParameters?.["filterName"];
  const filterValue = event.queryStringParameters?.["filterValue"];

  let awsResponse: ListFunctionsCommandOutput;
  try {
    awsResponse = await client.send(command);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
    };
  }

  let responseBody: FunctionConfiguration[];
  try {
    if (filterName && filterValue) {
      responseBody = filter(awsResponse.Functions, filterName, filterValue);
    } else {
      responseBody = awsResponse.Functions ?? [];
    }
  } catch (_) {
    return {
      statusCode: 400,
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(responseBody),
  };
};

function filter(
  functions: FunctionConfiguration[] | undefined,
  filterName: string,
  filterValue: string
): FunctionConfiguration[] {
  if (!functions) {
    return [];
  }
  switch (filterName) {
    case "runtime":
      return functions.filter((f) => f.Runtime === filterValue);
    case "tags":
      break;
    case "region":
      break;
    default:
      throw new Error("Specified filter is unknown.");
  }
  return functions;
}
