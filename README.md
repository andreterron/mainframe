# Mainframe

Mainframe is a database to sync data from third-party services.

## Get started

#### Requirements

-   [Docker](https://docs.docker.com/get-docker/)

#### Setup

Run these commands to get started with Mainframe:

```sh
git clone https://github.com/andreterron/mainframe.git
cd mainframe
yarn install
yarn start
```

This will run 3 services:

1. A docker container with CouchDB
2. A sync server to pull your data from different sources
3. And a remix server to host the front-end dashboard

To open the dashboard, navigate to <http://localhost:8744>

## License

MIT
