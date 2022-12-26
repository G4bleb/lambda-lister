locals {
  build_path = "${path.root}/../lambdas/lister/build.zip"
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "lambda-lister-lister-iam"

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

resource "aws_iam_policy" "lambda_lister_policy" {
  name   = "lambda-lister-policy"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListLambdaFunctions",
      "Effect": "Allow",
      "Action": "lambda:ListFunctions",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_lister_policy" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.lambda_lister_policy.arn
}

resource "aws_lambda_function" "func" {
  function_name = "lambda-lister-lister"

  filename = local.build_path

  runtime = "nodejs16.x"
  handler = "index.handler"

  source_code_hash = filebase64sha256(local.build_path)

  role = aws_iam_role.iam_for_lambda.arn
}
