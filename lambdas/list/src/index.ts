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
  const filters = {
    runtime: event.queryStringParameters?.["runtime"],
    tags: event.queryStringParameters?.["tags"],
    region: event.queryStringParameters?.["region"],
  };

  let awsResponse: ListFunctionsCommandOutput;
  try {
    awsResponse = await client.send(command);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
    };
  }

  let responseBody: FunctionConfiguration[] = awsResponse.Functions ?? [];
  try {
    for (const key in filters) {
      const filter = key as keyof typeof filters;
      const value = filters[filter];
      if (value) {
        responseBody = doFiltering(responseBody, filter, value);
      } else {
        responseBody = responseBody ?? [];
      }
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

function doFiltering(
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
