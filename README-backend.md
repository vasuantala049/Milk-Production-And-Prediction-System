# Running the backend from the repository root

This file explains how to run the Spring Boot backend from the repository root on Windows and Unix-like environments.

Prerequisites
- Java 17+ installed and on `PATH`.
- Maven or the included Maven Wrapper (`mvnw` / `mvnw.cmd`) is present in `backend/backend` (it is in this repo).

Windows (PowerShell)
1. Open PowerShell in the repository root.
2. Run:

```
.\run-backend.ps1
```

Unix / WSL / Git Bash
1. Open a shell in the repository root.
2. Make sure `run-backend.sh` is executable (optional):

```
chmod +x run-backend.sh
```
3. Run:

```
./run-backend.sh
```

Notes
- Scripts change directory into `backend/backend` and invoke the Maven wrapper which executes `spring-boot:run`.
- If you prefer to build the jar and run it directly, run in `backend/backend`:

```
./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

If you'd like, I can also:
- Add a VS Code launch configuration to run/debug the backend.
- Wire the backend into `docker-compose.yml` for local Docker-based runs.
