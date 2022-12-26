import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  ResourceExplorer2Client,
  SearchCommand,
  SearchCommandOutput,
} from "@aws-sdk/client-resource-explorer-2";

const client = new ResourceExplorer2Client({});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const filters = {
    tags: event.queryStringParameters?.["tags"],
    region: event.queryStringParameters?.["region"],
  };

  let querystring = "resourcetype:lambda:function";

  try {
    for (const key in filters) {
      const filter = key as keyof typeof filters;
      const value = filters[filter];
      if (value) {
        querystring = addFilteringToQueryString(querystring, filter, value);
      }
    }
  } catch (_) {
    return {
      statusCode: 400,
    };
  }

  const command = new SearchCommand({
    QueryString: querystring,
  });

  let awsResponse: SearchCommandOutput;
  try {
    awsResponse = await client.send(command);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(awsResponse.Resources),
  };
};

function addFilteringToQueryString(
  querystring: string,
  filterName: string,
  filterValue: string
): string {
  if (!filterName) {
    return querystring;
  }
  if (filterValue.includes(" ")) {
    throw new Error("Illegal char filters");
  }
  switch (filterName) {
    case "tags":
      const tagpairs = filterValue.replace(/;$/, "").split(";");
      for (const pair of tagpairs) {
        querystring += ` tag:${pair}`;
      }
      break;
    case "region":
      querystring += ` region:${filterValue}`;
      break;
    default:
      throw new Error("Specified filter is unknown.");
  }
  return querystring;
}
