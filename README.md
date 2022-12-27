# Lambda lister

API to fetch AWS lambda functions from an AWS account

## How to build & deploy

### Requirements

- An AWS account
- Terraform >= 1.3.6
- Node 16 LTS
- yarn classic

### Building the lambdas

```
$ yarn --cwd lambdas/lister build
```

### Deploying

1. Prepare the terraform backend. Default config uses an S3 bucket, feel free to adapt [terraform/main.tf](./terraform/main.tf) to suit your terraform backend needs.

   - Create an S3 bucket which will hold your backend, and make sure your terraform runtime's identity will be able to read/write the state from that backend as well as deploying the app. Precise IAM policy is TBD.
   - In [terraform/main.tf](./terraform/main.tf), set the following fields for your use:
     - In backend "s3": `bucket` (default `"lambda-lister-tf"`)
     - In backend "s3": `key` (default `"lambda-lister/.tfstate"`)
     - In backend "s3": `region` (default `"us-east-1"`)

2. In [terraform/main.tf](./terraform/main.tf), set the `region` field from provider `aws` for your use. Default value is `"us-east-1"`
3.

```
$ terraform -chdir=terraform init
$ terraform -chdir=terraform apply
```

4. Terraform outputs the URL of your API. Enjoy

## Available endpoints

- `/list`
  - Returns all lambda functions on the AWS account where the app is hosted.
- `/list?runtime=:a`
  - Returns all lambda functions on the AWS account which are based on the ':a' runtime
- `/search?tags=:a=:b;:c=:d`
  - Returns all lambda functions on the AWS account based on tags (can be combined with ?region)
- `/search?region=:a`
  - Returns all lambda functions on the AWS account based on region (can be combined with ?tags)

## Planned improvements:

- Split "list all" endpoint and "filter" endpoints (with two seperate functions for these endpoints)
- ~~Use more parameters on Terraform modules to create the lambdas easily~~
- ~~Add filtering by tags ([resource explorer doc](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-resource-explorer-2/index.html))~~
- ~~Add filtering by region~~
- Standardize values returned by all filters (if distinct APIs were used to make the filters)
- Split filtering between multiple lambda functions if needed
- If those multiple lambda functions have common dependencies, use lambda layers
- ~~Have a CI/CD pipeline that deploys~~
- ~~Unit tests (successes and errors) (ran by the CI/CD pipeline)~~
- ~~Endpoint tests on API URL returned by terraform (ran by the CI/CD pipeline)~~
- split CI/CD pipeline jobs between testing/building/deploying
- Create an OpenAPI doc to be mapped to the terraform API gateway
- Handle pagination
- Consider having abstraction between the runtime environment and the aws account queried
- Handle backend config with more elegance (user-specific config should be provisioned more smoothly)
