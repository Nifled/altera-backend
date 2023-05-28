<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Description

Alter Backend built using [Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Setup

Before starting, rename `.env.sample` to `.env` and update the corresponding variables to real values in order to run the environment.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### Note on e2e testing

In order to get e2e tests running, the corresponding environment variables must be set in `.env.test` (for reference, see `.env.test.sample`). You can also just use the dev database 🤷 if its not too important.

## Database Model Changes

Any time a model in the schema file is modified in any way, you must run `npx prisma generate`. This command must be run after every change to Prisma models to update the generated Prisma Client.

**Note: The prisma generate command reads the Prisma schema and updates the generated Prisma Client library inside node_modules/@prisma/client.**
