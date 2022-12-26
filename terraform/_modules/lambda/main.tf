locals {
  name = "${var.project_name}-${var.function_name}"
}
resource "aws_iam_role" "iam_for_lambda" {
  name = "${local.name}-iam"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "attach_basicrole" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "policy_for_lambda" {
  name   = "${local.name}-policy"
  policy = var.additional_policy
}

resource "aws_iam_role_policy_attachment" "attach_role_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.policy_for_lambda.arn
}

resource "aws_lambda_function" "func" {
  function_name = local.name

  filename = var.build_path

  runtime = "nodejs16.x"
  handler = "index.handler"

  source_code_hash = filebase64sha256(var.build_path)

  role = aws_iam_role.iam_for_lambda.arn
}
