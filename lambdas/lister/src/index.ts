import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({});
const command = new ListFunctionsCommand({});

export const handler = async (
  _: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const response = await client.send(command);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(response.Functions),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
    };
  }
};
