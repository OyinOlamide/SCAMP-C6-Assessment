# SCAMP-C6-Assessment
NodeJS backend assessment for She Code Africa cohort 6

# PAYMENT REMINDER APPLICATION
This API infrastructure handles payment reminders automatically.


To test and set up and test this infrastructure, follow the steps below.

- Clone project

- Run

```
npm install
```

- Update the .env.example file with real values

- Create an empty database

- To setup the database, run

```
node ./sequelize/sychronize.js
```

- To start up the app, run:

```
npm run nodemon
```

- Run the code below to start crontab that will send emails for overdue invoices

```
node ./utils/cron.js
```

## Postman Endpoints

You can access the Postman endpoints for this project via these links:

- [Authentication](https://documenter.getpostman.com/view/21532622/UzBmPTV8#b816cc1c-da6c-4d92-a385-d4a12f8a6bc3)
- [Invoices](https://documenter.getpostman.com/view/21532622/UzBmPTV8#bccfe1c6-6a39-4bcc-abed-14b2c8c6b187)
- [Users](https://documenter.getpostman.com/view/21532622/UzBmPTV8#e5e58d2e-7cab-42bf-b9eb-de55b3945391)
