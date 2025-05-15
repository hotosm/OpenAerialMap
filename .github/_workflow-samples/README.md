# `deploy-s3-yml`
A workflow that builds the site and deploys it to S3.

This workflow gets triggered with every push to the main branch, and doesn't verify if the checks were successful. It relies on branch protection to do so.

## First-time setup
- create a bucket on S3 and enable 'Static website hosting' with both the Index and Error document set to `index.html`. To do this programmatically:
  ```
  aws s3 mb [BUCKET NAME]
  aws s3 website [BUCKET NAME] --index-document index.html --error-document index.html
  aws s3api put-bucket-tagging --bucket [BUCKET NAME] --tagging 'TagSet=[{Key=Project,Value=[PROJECT TAG]}]'
  ```
- create an IAM with a policy that provides it with programmatic access to the bucket
- add the AWS Access Key and Secret from the IAM [as encrypted secrets to the project repository](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository). Use `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`
- add the bucket name as an environment variable (`DEPLOY_BUCKET`) to the deploy workflow. Omit `s3://` from the bucket name.

## Serving site from sub-path
This workflow assumes that the site is served from the root of the URL (eg. devseed.com). To support a URL served from a sub-path (eg. devseed.com/explorer), add the following step:

```
      - name: Serve site from subpath
        run: |
          cd dist
          mkdir <subfolder>
          mv assets <subfolder>/assets
          cp index.html <subfolder>
```

# `deploy-gh-yml`
A workflow that builds the site and deploys it to Github pages.

This workflow gets triggered with every push to the main branch, and doesn't verify if the checks were successful. It relies on branch protection to do so.

# S3 previews
Check the [Implementing S3 deploy previews](https://github.com/developmentseed/how/issues/423) guide to set up S3 previews for feature branches.
