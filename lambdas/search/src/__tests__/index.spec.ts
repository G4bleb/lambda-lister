const mockSend = jest.fn(async () => ({
  Resources: mockLambdas,
}));
const mockSearch = jest.fn(() => ({}));

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

import { describe, expect, test, jest } from "@jest/globals";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "../index";

jest.mock("@aws-sdk/client-resource-explorer-2", () => ({
  ResourceExplorer2Client: jest.fn(() => ({
    send: mockSend,
  })),
  SearchCommand: mockSearch,
}));

describe("list lambdas", () => {
  test("all", async () => {
    const res = await handler({} as APIGatewayProxyEventV2);
    expect(mockSearch).toHaveBeenCalledWith({
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
    expect(mockSearch).toHaveBeenCalledWith({
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

    expect(mockSearch).toHaveBeenCalledWith({
      QueryString: "resourcetype:lambda:function tag:foo=bar tag:baz=",
    });

    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(mockLambdas),
    });
  });
});

describe("failures", () => {
  test("aws request fails", async () => {
    jest.spyOn(console, "error").mockImplementationOnce(() => {});
    mockSend.mockRejectedValueOnce(new Error("Mock Error"));
    const res = await handler({} as APIGatewayProxyEventV2);
    expect(mockSearch).toHaveBeenCalledWith({
      QueryString: "resourcetype:lambda:function",
    });

    expect(res).toEqual({
      statusCode: 500,
    });
  });
  test("illegal char in filters", async () => {
    const res = await handler({
      queryStringParameters: { tags: "foo%3Dbar ;baz%3D" },
    } as unknown as APIGatewayProxyEventV2);

    expect(res).toEqual({
      body: "Illegal char in filters",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      statusCode: 400,
    });
  });
});
