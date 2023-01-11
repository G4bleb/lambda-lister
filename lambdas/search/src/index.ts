import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  FunctionConfiguration,
  LambdaClient,
  ListFunctionsCommand,
  ListFunctionsCommandOutput,
  ListTagsCommand,
} from "@aws-sdk/client-lambda";
import { LambdaFunctionData } from "./types";
import { compareTags } from "./utils";

enum Filter {
  Runtime = "runtime",
  Tags = "tags",
  Region = "region",
}

const client = new LambdaClient({});
const command = new ListFunctionsCommand({});

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const filters = {
    [Filter.Runtime]: event.queryStringParameters?.["runtime"],
    [Filter.Tags]: event.queryStringParameters?.["tags"],
    [Filter.Region]: event.queryStringParameters?.["region"],
  };

  //Get all lambdas first
  let awsResponse: ListFunctionsCommandOutput;
  try {
    awsResponse = await client.send(command);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
    };
  }

  let responseBody: LambdaFunctionData[] = awsResponse.Functions ?? [];
  const tagFetchers = fetchTags(responseBody);
  extractRegions(responseBody);
  await tagFetchers;

  //Filter the body through all filters
  try {
    for (const key in filters) {
      const filter = key as keyof typeof filters;
      const value = filters[filter];
      if (value) {
        responseBody = doFiltering(responseBody, filter, value);
      }
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: (error as Error).message,
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(responseBody),
  };
}

function fetchTags(lambdas: LambdaFunctionData[]): Promise<void[]> {
  const tagFetchers: Promise<void>[] = [];
  for (const lambda of lambdas) {
    const tagCommand = new ListTagsCommand({ Resource: lambda.FunctionArn });
    tagFetchers.push(
      client.send(tagCommand).then((res) => {
        lambda.tags = res.Tags;
      })
    );
  }
  return Promise.all(tagFetchers);
}

function extractRegions(lambdas: LambdaFunctionData[]): void {
  for (const lambda of lambdas) {
    const arn = lambda.FunctionArn;
    if (!arn) {
      console.error("missing ARN of function " + JSON.stringify(lambda));
    } else {
      lambda.region = arn.split(":")[3];
    }
  }
}

function doFiltering(
  functions: LambdaFunctionData[],
  filterName: Filter,
  filterValue: string
): FunctionConfiguration[] {
  if (!functions) {
    return [];
  }
  switch (filterName) {
    case Filter.Runtime:
      return functions.filter((f) => f.Runtime === filterValue);
    case Filter.Tags:
      const splitTagPairs = decodeURIComponent(filterValue)
        .replace(/;$/, "") //Remove trailing ;
        .split(";");

      const tagPairs: Record<string, string> = {};
      for (const pair of splitTagPairs) {
        const [name, val] = pair.split("=");
        tagPairs[name] = val;
      }

      return functions.filter((f) => f.tags && compareTags(f.tags, tagPairs));
    case Filter.Region:
      return functions.filter((f) => f.region === filterValue);
    default:
      throw new Error("Specified filter is unknown.");
  }
}
