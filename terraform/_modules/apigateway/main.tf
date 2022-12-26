locals {
  lambdas = {
    for _, lambda in var.functions :
    lambda.function_name => lambda
  }
  name = "${var.project_name}-api"
}

resource "aws_apigatewayv2_api" "api" {
  name          = local.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id = aws_apigatewayv2_api.api.id

  name        = local.name
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "integrations" {
  for_each           = local.lambdas
  api_id             = aws_apigatewayv2_api.api.id
  integration_uri    = each.value.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.lambdas
  api_id   = aws_apigatewayv2_api.api.id

  route_key = each.value.route
  target    = "integrations/${aws_apigatewayv2_integration.integrations[each.key].id}"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.api.name}"

  retention_in_days = 14
}

resource "aws_lambda_permission" "api_gw" {
  for_each      = local.lambdas
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
