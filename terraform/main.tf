locals {
  project_name = "lambda-lister"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.48.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "lambda-lister-tf"
    key    = "lambda-lister/.tfstate"
    region = "us-east-1"
  }
}

module "lambda_list" {
  source            = "./_modules/lambda"
  build_path        = "${path.root}/../lambdas/list/build.zip"
  project_name      = local.project_name
  function_name     = "list"
  additional_policy = <<EOF
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

module "lambda_search" {
  source            = "./_modules/lambda"
  build_path        = "${path.root}/../lambdas/search/build.zip"
  project_name      = local.project_name
  function_name     = "search"
  additional_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SearchResourceExplorer",
      "Effect": "Allow",
      "Action": "resource-explorer-2:Search",
      "Resource": "*"
    }
  ]
}
EOF
}

module "api" {
  source       = "./_modules/apigateway"
  project_name = local.project_name
  functions = [
    {
      invoke_arn    = module.lambda_list.func.invoke_arn
      function_name = module.lambda_list.func.function_name
      route         = "GET /list"
    },
    {
      invoke_arn    = module.lambda_search.func.invoke_arn
      function_name = module.lambda_search.func.function_name
      route         = "GET /search"
    }
  ]

}
