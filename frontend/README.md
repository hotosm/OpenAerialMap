# OpenAerialMap

## Vite for building

[Vite](https://vite.dev/) is used to bundle all the needed assets for the application.
There are two commands, both run via `pnpm`

- `pnpm build` - clean & build everything and put it into dist folder
- `pnpm serve` - serve the pages and utilize live reload on changes to fonts, images, scripts and HTML.

### Configurations and environment variables

At times, it may be necessary to include options/variables specific to `production`, `staging` or `local` in the code. To handle this, there you can use `.env` files.
See Vite's documentation on [env variables](https://vite.dev/guide/env-and-mode.html#env-variables-and-modes).

## Github Actions for CI

Testing and deployment is taken care of by Github Actions. It is set up to:

1. build and deploy the application to Github Pages on pushes to the `frontend-prototype` branch

To make sure that the site deploys, make sure that the `pnpm-lock.yaml` file is up to date with `package.json`.

## Linting

Our [ESLint rules](.eslintrc) are based on `eslint:recommended` rules, with some custom options. To check linting errors run:

    npm run lint

## Tests

Tests are setup using [Jest](https://jestjs.io/), and can be run with

```
npm run test
```

## Coding style

File [.editorconfig](.editorconfig) defines basic code styling rules, like indent sizes.

[Prettier](https://prettier.io) is the recommended code formatter. Atom and VSCode have extensions supporting Prettier-ESLint integration, which will help maintain style consistency while following linting rules.

## Path alias

Path alias allow you to define aliases for commonly used folders and avoid having very long file paths like `../../../component`. This also allows you to more easily move files around without worrying the imports will break.

Paths are defined in the [package.json](./package.json) under `alias`. They start with a `$` and point to a folder.

The following paths are predefined, but feel free to change them to whatever is convenient to your project needs.

```json
"alias": {
    "$components": "~/app/scripts/components",
    "$styles": "~/app/scripts/styles",
    "$utils": "~/app/scripts/utils",
    "$test": "~/test"
  }
```

For example, to import a component from a file called `page-header` in the `"~/app/scripts/components"` folder, you'd just need to do `import Component from '$components/page-header'`.

## Pull Request templates

Project seed comes with pull request templates to simplify and standardize the pull requests in the project. This [issue on the how repo](https://github.com/developmentseed/how/issues/360#issuecomment-1041292591) provides some context to how this works.

To add more templates create them in the `.github/PULL_REQUEST_TEMPLATE` folder and link them in the [PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) file.
