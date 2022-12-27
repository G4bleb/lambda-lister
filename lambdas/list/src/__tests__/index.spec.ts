const mockLambda = {
  FunctionName: "lambda-foo",
  Runtime: "nodejs16.x",
};

const mockLambdas = [
  mockLambda,
  {
    FunctionName: "lambda-bar",
    Runtime: "nodejs14.x",
  },
];

const mockSend = jest.fn(async () => ({
  Functions: mockLambdas,
}));

import { describe, expect, test, jest } from "@jest/globals";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "../index";

jest.mock(
  "@aws-sdk/client-lambda",
  jest.fn(() => ({
    LambdaClient: jest.fn(() => ({
      send: mockSend,
    })),
    ListFunctionsCommand: jest.fn(() => ({})),
  }))
);

describe("list lambdas", () => {
  test("all", async () => {
    const res = await handler({} as APIGatewayProxyEventV2);
    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(mockLambdas),
    });
  });

  test("runtime filter", async () => {
    const res = await handler({
      queryStringParameters: { runtime: "nodejs16.x" },
    } as unknown as APIGatewayProxyEventV2);
    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify([mockLambda]),
    });
  });
});

describe("failures", () => {
  test("aws request fails", async () => {
    jest.spyOn(console, "error").mockImplementationOnce(() => {});
    mockSend.mockRejectedValueOnce(new Error("Mock Error"));
    const res = await handler({} as APIGatewayProxyEventV2);

    expect(res).toEqual({
      statusCode: 500,
    });
  });
});
