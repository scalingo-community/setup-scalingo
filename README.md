# scalingo-community/setup-scalingo

The `scalingo-community/setup-scalingo` action is a composite action that sets up Scalingo CLI in your GitHub Actions workflow by:

- Downloading the latest or a specific version of Scalingo CLI and adding it to the PATH.
- Configuring the Scalingo CLI configuration file with your region, app name and Scalingo API token.

After you've used the action, subsequent steps in the same job can run arbitrary Scalingo commands using the GitHub Actions `run:` syntax. This allows most Scalingo commands to work exactly like they do on your local command line


## Usage

This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners. Note that the `region` input is always required.

The default configuration installs the latest version of Scalingo CLI:
<!-- x-release-please-start-version -->
```yaml
steps:
- uses: scalingo-community/setup-scalingo@v0.1.1
  with:
    region: 'osc-fr1'
```
<!-- x-release-please-end -->

Subsequent steps can launch command with the configured and authenticated CLI (you can create API Token [in the Scalingo dashboard](https://dashboard.scalingo.com/account/tokens)):
<!-- x-release-please-start-version -->
```yaml
steps:
- uses: scalingo-community/setup-scalingo@v0.1.1
  with:
    region: 'osc-fr1'
    api_token: ${{ secrets.scalingo_api_token }}
    app_name: 'my_app'

- run: scalingo restart # will restart all the processes of the app "my_app" in region "osc-fr1"
```
<!-- x-release-please-end -->


## Inputs
The action requires the following inputs:

- `region` - The region of your app.

The action also accepts the following optional inputs:

- `api_token` - The Scalingo API token to use. If not provided, the subsequent steps  will try to use the `SCALINGO_API_TOKEN` environment variable.
- `version` - The version of Scalingo CLI to install. If not provided, the action will install the latest version.
- `app_name` - The name of the app to use. If not provided, the subsequent steps will try to use the `SCALINGO_APP` environment variable.
- `git_remote` - Choose the name of Git remote to allow git operations (requires the `region` and `app_name` inputs). The default value is `scalingo`.


For testing or debugging purpose, the following inputs can also be used:

- `scalingo_api_url` - The Scalingo API URL to use. If not provided, the action will use the default API URL for the given region.
- `scalingo_auth_url` - The Scalingo Auth URL to use. If not provided, the action will use the default Auth URL for the given region.
- `unsecure_ssl` - Disable SSL verification with APIs.
- `scalingo_db_url` - The Scalingo DB URL to use. If not provided, the action will use the default DB URL for the given region.
- `scalingo_ssh_host` - The Scalingo SSH Host to use. If not provided, the action will use the default SSH Host for the given region.


## Features

### Git remote auto-configuration

If the code  you provide the `region` and `app_name` inputs, the action will automatically configure a Git remote named `scalingo` to allow git operations on your app. This is useful if you want to run `git push scalingo master` in your workflow.
<!-- x-release-please-start-version -->
```yaml
steps:
- name: Checkout code
  uses: actions/checkout@v3
- name: Configure Scalingo CLI
  uses: scalingo-community/setup-scalingo@v0.1.1
  with:
    region: 'osc-fr1'
    app_name: 'my_app'
- name: Deploy to Scalingo with Git
  run: git push scalingo main
```
<!-- x-release-please-end -->


### Custom version of Scalingo CLI

You can install a specific version of Scalingo CLI:
<!-- x-release-please-start-version -->
```yaml
steps:
- uses: scalingo-community/setup-scalingo@v0.1.1
  with:
    region: 'osc-fr1'
    version: 1.33.0
```
<!-- x-release-please-end -->
