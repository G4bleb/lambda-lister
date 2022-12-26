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

module "lambda-lister" {
  source = "./_modules/lambda"
}

module "api" {
  source          = "./_modules/apigateway"
  lister_function = module.lambda-lister.func
}
