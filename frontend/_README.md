# {{Project name}}

{{Description}}

## Installation and Usage

The steps below will walk you through setting up your own instance of the project.

### Install Project Dependencies

To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) v22 (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [pnpm](https://pnpm.io/) Install using corepack (`corepack enable pnpm`)

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```
nvm install
```

Install Node modules:

```
pnpm install
```

## Usage

### Config files

Configuration is done using [dot.env](https://vite.dev/guide/env-and-mode#env-files) files.

These files are used to simplify the configuration of the app and should not contain sensitive information.

Run the project locally by copying the `.env` to `.env.local` and setting the following environment variables:

| --- | --- |
| `{{VARIABLE}}` | {{description}} |

### Starting the app

```
pnpm serve
```

Compiles the sass files, javascript, and launches the server making the site available at `http://localhost:9000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with livereload.

# Deployment

To prepare the app for deployment run:

```
pnpm build
```

or

```
pnpm stage
```

This will package the app and place all the contents in the `dist` directory.
The app can then be run by any web server.

**When building the site for deployment provide the base url through the `BASE_URL` environment variable. Omit the leading slash. (E.g. <https://example.com>)**
