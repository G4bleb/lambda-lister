import { describe, expect, test, jest } from "@jest/globals";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "../index";
import { SearchCommand } from "@aws-sdk/client-resource-explorer-2";

const mockLambda = {
  Arn: "arn:aws:lambda:us-east-1:123456:function:lambda-foo",
  Region: "us-east-1",
  ResourceType: "lambda:function",
  Service: "lambda",
};

const mockLambdas = [
  mockLambda,
  {
    Arn: "arn:aws:lambda:us-east-1:123456:function:lambda-bar",
    Region: "us-east-1",
    ResourceType: "lambda:function",
    Service: "lambda",
  },
];

jest.mock("@aws-sdk/client-resource-explorer-2", () => ({
  ResourceExplorer2Client: jest.fn(() => ({
    send: jest.fn(async () => ({
      Resources: mockLambdas,
    })),
  })),
  SearchCommand: jest.fn(() => ({})),
}));

describe("list lambdas", () => {
  test("all", async () => {
    const res = await handler({} as APIGatewayProxyEventV2);
    expect(SearchCommand as unknown as jest.Mock).toHaveBeenCalledWith({
      QueryString: "resourcetype:lambda:function",
    });

    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(mockLambdas),
    });
  });

  test("region filter", async () => {
    const res = await handler({
      queryStringParameters: { region: "us-west-1" },
    } as unknown as APIGatewayProxyEventV2);
    expect(SearchCommand as unknown as jest.Mock).toHaveBeenCalledWith({
      QueryString: "resourcetype:lambda:function region:us-west-1",
    });

    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(mockLambdas),
    });
  });

  test("tag filter", async () => {
    const res = await handler({
      queryStringParameters: { tags: "foo%3Dbar;baz%3D" },
    } as unknown as APIGatewayProxyEventV2);

    expect(SearchCommand as unknown as jest.Mock).toHaveBeenCalledWith({
      QueryString: "resourcetype:lambda:function tag:foo=bar tag:baz=",
    });

    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(mockLambdas),
    });
  });
});
