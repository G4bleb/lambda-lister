const mockLambdas = [
  {
    FunctionName: "lambda-foo",
    Runtime: "nodejs16.x",
  },
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
    ListFunctionsCommand: jest.fn((param) => ({ input: param })),
  }))
);

describe("successes", () => {
  test("list lambdas", async () => {
    const res = await handler({} as APIGatewayProxyEventV2);
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

    expect(res).toEqual({
      statusCode: 500,
    });
  });
});
