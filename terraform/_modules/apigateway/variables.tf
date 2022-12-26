variable "project_name" {
  type = string
}
variable "functions" {
  type = list(object({
    invoke_arn    = string
    function_name = string
    route          = string
  }))
}
