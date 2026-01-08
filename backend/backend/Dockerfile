# Stage 1 - build
FROM maven:3.9.9-eclipse-temurin-24 AS build
WORKDIR /workspace

# cache dependencies
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw
RUN mvn -B dependency:go-offline

# copy source and build
COPY src ./src
RUN mvn -B package -DskipTests

# Stage 2 - runtime
FROM eclipse-temurin:24-jre-jammy
ARG JAR_FILE=target/*.jar
WORKDIR /app

# copy built jar
COPY --from=build /workspace/${JAR_FILE} app.jar

# create a non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app

# recommended JVM options (override with env when needed)
ENV JAVA_OPTS="-Xms256m -Xmx512m -Dspring.profiles.active=prod"

EXPOSE 8080

# healthcheck (adjust if you use a custom actuator path)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget --quiet --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]