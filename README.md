# Home-LLC Server

Server side code for the Home-LLC assignment.

# Installation

Use the package manager [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to install the dependencies.

```bash
npm install
```

# Configuring Environment Variable

_A basic .env file have been included._
Open the **.env** file with a text editor and change the Environment Variables values respectivily:

- PORT
- ORIGIN
- JWT_PRIVATE_KEY
- JWT_PUBLIC_KEY
- JWT_ISSUER
- PGUSER
- PGPASSWORD
- PGHOST
- PGPORT
- PGDATABASE

```
PORT=8000
ORIGIN="http://localhost:3000"
...
```

# Usage

1. Starting Dev Server

```bash
npm run dev
```

2. Starting the production server.

```bash
npm run start
```

# Note

- _Home-LLC Client is the GUI for this server_

* If you wish to change the Postgresql server make sure the it is configured with a **table** of name **users** and with following columns.

| Column Name | Data Type   |
| ----------- | ----------- |
| id          | serial      |
| first_name  | varChar(50) |
| last_name   | varChar(50) |
| email       | varChar(50) |
| password    | text        |
