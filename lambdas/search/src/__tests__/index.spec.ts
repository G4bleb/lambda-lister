const mockLambdaFoo = {
  FunctionName: "lambda-foo",
  FunctionArn: "arn:aws:lambda:us-east-1:533456499033:function:lambda-foo",
  Runtime: "nodejs16.x",
};
const expectedFoo = Object.assign({}, mockLambdaFoo, {
  region: "us-east-1",
  tags: { foo: "bar", baz: "" },
});
const mockLambdaBar = {
  FunctionName: "lambda-bar",
  FunctionArn: "arn:aws:lambda:us-west-1:533456499033:function:lambda-bar",
  Runtime: "nodejs14.x",
};
const expectedBar = Object.assign({}, mockLambdaFoo, {
  region: "us-west-1",
  tags: {},
});

const mockLambdas = [mockLambdaFoo, mockLambdaBar];

interface ListTagsCommand {
  input: {
    Resource: string;
  };
}
interface ListFunctionsCommand {
  input: {};
}

const mockSend = jest.fn(
  async (param: ListTagsCommand | ListFunctionsCommand) => {
    if ("Resource" in param.input) {
      switch (param.input.Resource) {
        case mockLambdaFoo.FunctionArn:
          return { Tags: expectedFoo.tags };
        case mockLambdaBar.FunctionArn:
          return { Tags: expectedBar.tags };
        default:
          throw Error("Unexpected params given to mockSend");
      }
    } else {
      //param instanceof ListFunctionsCommand
      return {
        Functions: mockLambdas,
      };
    }
  }
);

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
    ListTagsCommand: jest.fn((param) => ({ input: param })),
  }))
);

describe("successes", () => {
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
      body: JSON.stringify([expectedFoo]),
    });
  });

  test("region filter", async () => {
    const res = await handler({
      queryStringParameters: { region: "us-east-1" },
    } as unknown as APIGatewayProxyEventV2);
    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify([expectedFoo]),
    });
  });

  test("tag filter", async () => {
    const res = await handler({
      queryStringParameters: { tags: "foo%3Dbar;baz%3D" },
    } as unknown as APIGatewayProxyEventV2);
    expect(res).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify([expectedFoo]),
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
