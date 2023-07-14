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

## Pagination

This API uses **cursor-based pagination** and works similar to other conventions with cursor-based pagination.

On listing endpoints (e.g. `GET /api/posts`), there's a few query params you can attach to the request URL that can help with this.

- `limit` : The **maximum** number of items you want the response to provide.
- `cursor`: An `id` string that points to the next portion of the results.

  - If you don't pass a cursor parameter, but do pass a limit parameter, the default value retrieves the first portion (or "page") of results.

Listing endpoints return a paginated response, which looks like this:

```
{
  // Array collection of returned items (# of items === `limit` param passed in request)
  "data": [{ item1 }, { item2 }, { item3 }],

  // "Page" metadata containing data that ca be used for subsequent paginated requests
  "meta": {
    "next_cursor": "someRandomeId", // `id` string that points to the next portion of the results.
  }
}
```

- An empty, `null`, or non-existent `next_cursor` in the response indicates no further results.

- On your next call to the same method (e.g. `GET /api/posts`), set the cursor parameter equal to the `next_cursor` value you received on the last request to retrieve the next portion of the collection.

## Misc

### Database Model Changes

Any time a model in the schema file is modified in any way, you must run `npx prisma generate`. This command must be run after every change to Prisma models to update the generated Prisma Client.

**Note: The prisma generate command reads the Prisma schema and updates the generated Prisma Client library inside node_modules/@prisma/client.**
