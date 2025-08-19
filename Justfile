# Copyright (c) Humanitarian OpenStreetMap Team
#
# This file is part of OpenAerialMap.
#
#     OpenAerialMap is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     OpenAerialMap is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
#
#     You should have received a copy of the GNU General Public License
#     along with OpenAerialMap.  If not, see <https:#www.gnu.org/licenses/>.
#

set dotenv-load

mod prep 'recipes/prep/Justfile'

# List available commands
[private]
default:
  just help

# List available commands
help:
  just --justfile {{justfile()}} --list

# Generate the .env file from scratch, using .env.example and substitutions
[no-cd]
generate-dotenv branch="main":
  #!/usr/bin/env sh
  set -e

  # By default we deploy from 'main' branch, but can be overridden

  cd {{justfile_directory()}}

  # Re-export .env to the environment, with cleaned variables
  if [ -f .env ]; then
    just _echo-yellow "'.env' file already exists. Skipping dotenv generation."
    exit 0
  fi

  just manage _install_envsubst

  # Generate a .env file from .env.example, substituting values from environment
  ./envsubst -i .env.example | grep -vE '^\s*#|^\s*$' > .env

# Build the frontend container image
build-frontend branch="main":
  #!/usr/bin/env bash
  set -euo pipefail

  just generate-dotenv
  source .env

  GIT_BRANCH="{{ branch }}"
  docker build ./frontend --tag "ghcr.io/hotosm/openaerialmap/frontend:${GIT_BRANCH}" \
    --build-arg VITE_STAC_API_URL=${VITE_STAC_API_URL} \
    --build-arg VITE_STAC_API_PATHNAME=${VITE_STAC_API_PATHNAME} \
    --build-arg VITE_STAC_TILER_PATHNAME=${VITE_STAC_TILER_PATHNAME} \
    --build-arg VITE_STAC_ITEMS_LIMIT=${VITE_STAC_ITEMS_LIMIT}

# Get temp AWS credentials using CI/CD OIDC
get-aws-creds:
  #!/usr/bin/env bash
  # NOTE this should be moved into a generic remote justfile
  # https://just.systems/man/en/remote-justfiles.html
  # It essentially just replicates aws-actions/configure-aws-credentials@v4

  set -euo pipefail

  just prep _curl

  # NOTE this part is specific to Github
  # Gitlab has a slightly simpler config:
  # https://docs.gitlab.com/ci/cloud_services/aws/
  echo "Requesting GitHub OIDC token..."
  OIDC_TOKEN=$(curl -s -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
    "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com" \
    | sed -E 's/.*"value":"([^"]+)".*/\1/')
  export OIDC_TOKEN

  echo "Requesting AWS credentials..."
  aws_sts_output=$(aws sts assume-role-with-web-identity \
    --role-arn "$AWS_OIDC_ROLE_ARN" \
    --role-session-name "GH-Actions-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-0}" \
    --web-identity-token ${OIDC_TOKEN} \
    --duration-seconds 3600 \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
    --output text)

  # NOTE that env vars cannot be read in future recipes, so this is required.
  # NOTE also consider we cannot use multiline heredoc syntax here
  export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" $aws_sts_output)
  echo "Writing credentials to .aws.env file for future recipes"
  echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" > .aws.env
  echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> .aws.env
  echo "AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN" >> .aws.env

# Deploy the frontend to S3 and CDN
deploy-frontend:
  #!/usr/bin/env bash
  set -euo pipefail

  export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "Current branch: ${GIT_BRANCH}"

  just build-frontend ${GIT_BRANCH}
  just get-aws-creds

  docker run --rm \
    --entrypoint /bin/sh \
    --env-file .aws.env \
    ghcr.io/hotosm/openaerialmap/frontend:${GIT_BRANCH} \
    -c "rclone config create aws s3 \
          provider=AWS \
          region=${AWS_REGION} \
        && rclone sync ./ aws:oam-frontend/${GIT_BRANCH}"

  docker run --rm \
    --entrypoint /bin/sh \
    --env-file .aws.env \
    public.ecr.aws/aws-cli/aws-cli:2.28.11 \
    -c "aws s3 ls oam-frontend"

# Echo to terminal with blue colour
[no-cd]
_echo-blue text:
  #!/usr/bin/env sh
  printf "\033[0;34m%s\033[0m\n" "{{ text }}"

# Echo to terminal with yellow colour
[no-cd]
_echo-yellow text:
  #!/usr/bin/env sh
  printf "\033[0;33m%s\033[0m\n" "{{ text }}"

# Echo to terminal with red colour
[no-cd]
_echo-red text:
  #!/usr/bin/env sh
  printf "\033[0;41m%s\033[0m\n" "{{ text }}"
