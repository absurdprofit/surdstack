To get the API running you'll need to:
1. Install [Deno](https://docs.deno.com/runtime/fundamentals/installation/).
2. Make sure the db is up by running `docker-compose up db -d --build` in the root of the repo. You'll only need to do this once. Subsequently just make sure docker engine is running.
3. Generate the Prisma types and update the DB with Prisma by running `npx nx run prisma:db-push` in the root of the repo. You can also use the [Nx Console VSCode extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) to run the `prisma > db-push` task.

Once that's done you're all set. Just run `npx nx run api:dev` or use the [Nx Console VSCode extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) to run the `api > dev` task.

Once the application is running via the dev task you can attach the VSCode debugger with the `Debug API` profile. Or you can attach the [Chrome debugger](chrome://inspect) on port 9229.