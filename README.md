# scalingo-community/setup-scalingo

The `scalingo-community/setup-scalingo` action is a composite action that sets up Scalingo CLI in your GitHub Actions workflow by:

- Downloading the latest or a specific version of Scalingo CLI and adding it to the PATH.
- Configuring the Scalingo CLI configuration file with your region, app name and Scalingo API token.

After you've used the action, subsequent steps in the same job can run arbitrary Scalingo commands using the GitHub Actions `run:` syntax. This allows most Scalingo commands to work exactly like they do on your local command line.


## Usage

This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners (both `x86_64` and `arm64` architectures are supported). Windows runners are not supported. Note that the `region` input is always required.

The default configuration installs the latest version of Scalingo CLI:
```yaml
steps:
- uses: scalingo-community/setup-scalingo@v0.1
  with:
    region: 'osc-fr1'
```

The examples below use the `@v0.1` moving tag, which is updated at each release. You can also use `@v0` to follow the latest minor version, or pin an exact version from the [releases page](https://github.com/scalingo-community/setup-scalingo/releases).

Subsequent steps can launch command with the configured and authenticated CLI (you can create API Token [in the Scalingo dashboard](https://dashboard.scalingo.com/account/tokens)):
```yaml
steps:
- uses: scalingo-community/setup-scalingo@v0.1
  with:
    region: 'osc-fr1'
    api_token: ${{ secrets.scalingo_api_token }}
    app_name: 'my_app'

- run: scalingo restart # will restart all the processes of the app "my_app" in region "osc-fr1"
```

See [Deploying with the SCM integration](#deploying-with-the-scm-integration-recommended) for the recommended way to deploy your app.


## Inputs
The action requires the following inputs:

- `region` - The region of your app.

The action also accepts the following optional inputs:

- `api_token` - The Scalingo API token to use. If not provided, the subsequent steps will try to use the `SCALINGO_API_TOKEN` environment variable. It is required to configure the Git remote (see the `git_remote` input).
- `version` - The version of Scalingo CLI to install. If not provided, the action will install the latest version.
- `app_name` - The name of the app to use. If not provided, the subsequent steps will try to use the `SCALINGO_APP` environment variable. It is required to configure the Git remote (see the `git_remote` input).
- `git_remote` - Choose the name of Git remote to allow git operations (requires the `api_token`, `region` and `app_name` inputs). The default value is `scalingo`.


For testing or debugging purpose, the following inputs can also be used:

- `scalingo_api_url` - The Scalingo API URL to use. If not provided, the action will use the default API URL for the given region.
- `scalingo_auth_url` - The Scalingo Auth URL to use. If not provided, the action will use the default Auth URL for the given region.
- `unsecure_ssl` - Disable SSL verification with APIs.
- `scalingo_db_url` - The Scalingo DB URL to use. If not provided, the action will use the default DB URL for the given region.
- `scalingo_ssh_host` - The Scalingo SSH Host to use. If not provided, the action will use the default SSH Host for the given region.


## Features

### Deploying with the SCM integration (recommended)

The recommended way to deploy on Scalingo is the [SCM integration](https://doc.scalingo.com/platform/app/scm-integration): link your app to its GitHub (or GitLab) repository from the *Deploy* → *Configuration* section of the app dashboard, and Scalingo takes care of the deployments. A push on the configured branch deploys the app, each pull/merge request can get its own review app, and Scalingo waits for the checks of your CI to succeed before deploying. No workflow, no SSH key and no Git remote is required.

The action is then useful to **drive** those deployments from a workflow, with nothing but an API token:

* `scalingo integration-link-manual-deploy` to deploy a branch on demand,
* `scalingo integration-link-manual-review-app` to create the review app of a pull/merge request,
* and any other Scalingo command to run around a deployment, a database backup for instance.

#### Deploy a branch on demand

```yaml
name: Deploy a branch

on:
  workflow_dispatch:
    inputs:
      branch:
        description: Branch to deploy
        required: true
        default: main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure Scalingo CLI
        uses: scalingo-community/setup-scalingo@v0.1
        with:
          region: 'osc-fr1'
          api_token: ${{ secrets.SCALINGO_API_TOKEN }}
          app_name: 'my_app'

      - name: Deploy the branch
        env:
          BRANCH: ${{ inputs.branch }}
        run: scalingo integration-link-manual-deploy "$BRANCH"
```

#### Back up a database before deploying

Any other Scalingo command can be run around the deployment. To back up a database before deploying a new version, for example (`--addon` accepts the addon type, `postgresql` or `redis`, or its ID):

```yaml
name: Back up and deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure Scalingo CLI
        uses: scalingo-community/setup-scalingo@v0.1
        with:
          region: 'osc-fr1'
          api_token: ${{ secrets.SCALINGO_API_TOKEN }}
          app_name: 'my_app'

      - name: Back up the database
        run: scalingo --addon postgresql backups-create

      - name: Deploy the main branch
        run: scalingo integration-link-manual-deploy main
```

`backups-create` waits for the backup to end before returning: it polls the backup status until it is `done` or `error` (which can take a while on a large database), so the deployment only starts once the backup is over. A backup ending in error does not make the command fail though: check its output if the deployment must be blocked in that case.

```yaml
      - name: Back up the database
        run: |
          scalingo --addon postgresql backups-create | tee /tmp/backup.log
          grep -q 'Backup successfully finished' /tmp/backup.log
```

#### Deploy a review app from a pull request comment

A review app can also be created (or refreshed) on demand, for example when a comment is posted on a pull request:

```yaml
name: Deploy review app

on:
  issue_comment:
    types: [created]

jobs:
  review-app:
    if: github.event.issue.pull_request && contains(github.event.comment.body, '/deploy')
    runs-on: ubuntu-latest
    steps:
      - name: Configure Scalingo CLI
        uses: scalingo-community/setup-scalingo@v0.1
        with:
          region: 'osc-fr1'
          api_token: ${{ secrets.SCALINGO_API_TOKEN }}
          app_name: 'my_parent_app'

      - name: Create the review app
        env:
          PULL_REQUEST_ID: ${{ github.event.issue.number }}
        run: scalingo integration-link-manual-review-app "$PULL_REQUEST_ID"
```

If your code is not hosted on GitHub or GitLab, a deployment can also be triggered from a gzipped archive: `scalingo --app my_app deploy archive.tar.gz` (see [Deploy directly from an archive](https://doc.scalingo.com/platform/deployment/deploy-from-archive)).

### Deploying with Git (advanced, SSH key required)

This path is only needed when the SCM integration above cannot be used: it deploys the Git repository of the runner instead of a branch hosted on the SCM, and it therefore requires an SSH key. If your code is not hosted on a supported SCM, deploying an archive (`scalingo --app my_app deploy archive.tar.gz`) is often simpler than maintaining an SSH key.

When you provide the `region`, `app_name` and `api_token` inputs, the action configures a Git remote named `scalingo` (the name can be changed with the `git_remote` input) pointing to the SSH URL of your app (`git@ssh.<region>.scalingo.com:<app_name>.git`): a deployment is then a single `git push scalingo main`. Without an `app_name`, the action skips this step with a warning.

The remote is configured by the action, but the push itself is authenticated by SSH: the Scalingo Git server only accepts SSH authentication, and the API token (used by the CLI and the API) cannot authenticate a `git push`. Without an SSH key, the push fails with:

```console
$ git push scalingo main
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

To deploy with Git from a workflow, add a deploy key:

1. Generate a dedicated key pair, without passphrase:

   ```bash
   ssh-keygen -t ed25519 -a 100 -C "github-actions" -f scalingo_deploy -N ''
   ```

2. Add the **public** key (`scalingo_deploy.pub`) to the Scalingo account which is allowed to deploy the app: [*SSH keys*](https://dashboard.scalingo.com/account/keys) in the dashboard.
3. Store the **private** key (`scalingo_deploy`) in a repository secret, for example `SCALINGO_SSH_PRIVATE_KEY`.
4. Load it in your job, alongside the action:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v7
        with:
          # Scalingo does not support pushing a shallow repository
          fetch-depth: 0

      # Load the private key into the ssh-agent
      - name: Load the SSH key
        uses: webfactory/ssh-agent@v0.10.0
        with:
          ssh-private-key: ${{ secrets.SCALINGO_SSH_PRIVATE_KEY }}

      # webfactory/ssh-agent does not manage known_hosts
      - name: Trust the Scalingo SSH host
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ssh.osc-fr1.scalingo.com >> ~/.ssh/known_hosts

      - name: Configure Scalingo CLI
        uses: scalingo-community/setup-scalingo@v0.1
        with:
          region: 'osc-fr1'
          api_token: ${{ secrets.SCALINGO_API_TOKEN }}
          app_name: 'my_app'

      - name: Deploy to Scalingo
        run: git push scalingo HEAD:main
```

`HEAD:main` deploys the checked out commit to the `main` ref, because Scalingo only accepts the `master` and `main` refs. To deploy another branch, push it explicitly: `git push scalingo mybranch:main`.

The SSH host depends on the region of your app (`ssh.osc-fr1.scalingo.com`, `ssh.osc-secnum-fr1.scalingo.com`, ...).


### Custom version of Scalingo CLI

You can install a specific version of Scalingo CLI:
```yaml
steps:
- uses: scalingo-community/setup-scalingo@v0.1
  with:
    region: 'osc-fr1'
    version: 1.33.0
```

## Troubleshooting

### `Please make sure you have the correct access rights` or `Permission denied (publickey)`

The push is not authenticated: `git push` to Scalingo requires an SSH key, an API token is not enough. See [Deploying with Git](#deploying-with-git-advanced-ssh-key-required).

### `shallow update not allowed`

Scalingo does not support pushing a shallow repository. With `actions/checkout`, set `fetch-depth: 0`.

### `Fail to configure git repository, 'scalingo' remote already exists`

`scalingo git-setup` does not overwrite an existing remote. Remove it (`git remote remove scalingo`) or pick another name with the `git_remote` input.

### `Unsupported OS: Windows`

The Scalingo CLI is only installed on Linux and macOS runners: Windows runners are not supported by this action.

### `Scalingo login failed`

Check that the `api_token` input holds a valid token with access to the app, and that the `region` input matches the region of your app (`osc-fr1`, `osc-secnum-fr1`, ...).

### Pushing tags or other refs

Scalingo only accepts the `master` and `main` refs, and its Git server does not support pushing tags.
