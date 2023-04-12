# scalingo-community/setup-scalingo

The `scalingo-community/setup-scalingo` action is a composite action that sets up Scalingo CLI in your GitHub Actions workflow by:

- Downloading the latest or a specific version of Scalingo CLI and adding it to the PATH.
- Configuring the Scalingo CLI configuration file with your region, app name and Scalingo API token.

After you've used the action, subsequent steps in the same job can run arbitrary Scalingo commands using the GitHub Actions `run:` syntax. This allows most Scalingo commands to work exactly like they do on your local command line

## Usage

This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners. Note that the `region` input is always required.

The default configuration installs the latest version of Scalingo CLI:
```
steps:
- uses: scalingo-community/setup-scalingo@v1
  with:
    region: 'osc-fr1'
```

Subsequent steps can launch command with the configured and authenticated CLI (you can create API Token [in the Scalingo dashboard](https://dashboard.scalingo.com/account/tokens)):
```
steps:
- uses: scalingo-community/setup-scalingo@v1
  with:
    region: 'osc-fr1'
    api_token: '${{ secrets.scalingo_api_token }}
    app_name: 'my_app'

- run: scalingo restart # will restart all the processes of the app "my_app" in region "osc-fr1"
```

A specific version of Scalingo CLI can be installed:
```
steps:
- uses: scalingo-community/setup-scalingo@v1
  with:
    region: 'osc-fr1'
    version: 1.28.2
```

## Inputs
The action requires the following inputs:

- `region` - The region of your app.

The action also accepts the following optional inputs:

- `api_token` - The Scalingo API token to use. If not provided, the subsequent steps  will try to use the `SCALINGO_API_TOKEN` environment variable.
- `version` - The version of Scalingo CLI to install. If not provided, the action will install the latest version.
- `app_name` - The name of the app to use. If not provided, the subsequent steps will try to use the `SCALINGO_APP` environment variable.

For testing or debugging purpose, the following inputs can also be used:

- `scalingo_api_url` - The Scalingo API URL to use. If not provided, the action will use the default API URL for the given region.
- `scalingo_auth_url` - The Scalingo Auth URL to use. If not provided, the action will use the default Auth URL for the given region.
- `unsecure_ssl` - Disable SSL verification with APIs.
- `scalingo_db_url` - The Scalingo DB URL to use. If not provided, the action will use the default DB URL for the given region.
- `scalingo_ssh_host` - The Scalingo SSH Host to use. If not provided, the action will use the default SSH Host for the given region.

TODO:

- [ ] `git_setup` (not implemented) - Add a Git remote to allow git operations (requires the `region` and `app_name` inputs). If not provided, the action will not add a Git remote.
