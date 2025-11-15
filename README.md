# Setting Up the Application with Docker Compose

Follow these steps to build and run the application using Docker Compose.

## Prerequisite: Install Docker and Docker Compose

Before you begin, make sure Docker and Docker Compose are installed on your system. You can follow the official installation guides:

- [Docker installation guide](https://docs.docker.com/get-docker/)
- [Docker Compose installation guide](https://docs.docker.com/compose/install/)

Once Docker is installed, proceed with the steps below.

## 0. Go to the proyect folder
  Enter the folder where the docker-compose.yaml file is

## 1. Build the Docker Images

First, run the following command to build the Docker images for the application:

```bash
docker compose build
```

> Wait for the build process to complete.

## 2. Start the Services

Once the build is complete, start the services in detached mode by running:

```bash
docker compose up -d
```

> This will start all the services in the background.

## 3. Verify the Services Are Running

Wait a few moments for the services to become active, the movies service will take a while to start because it copies 20k movies to the db so no random movies can be seen or search for them until it finishes copying them.
To verify they're running, you can check their status:

```bash
docker compose ps
```

## 4. Access the Application

Once everything is up and running, open your web browser and navigate to:

[http://localhost/](http://localhost/)

You should see the application running.

---

### Troubleshooting

* If you encounter any issues, check the logs with:

  ```bash
  docker-compose logs
  ```

* To stop all services:

  ```bash
  docker-compose down
  ```

### Recomendation System
* It has two modes, cold start where it recommends the same top 10 movies for everyone and pesonalised where it uses the consine similarity to compute movies you might like


  

Enjoy using the application! 🚀
