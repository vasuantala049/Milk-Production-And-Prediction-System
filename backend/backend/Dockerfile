# =========================
# Stage 1 — Build (Java 24)
# =========================
FROM maven:3.9.9-eclipse-temurin-24 AS build

WORKDIR /workspace

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw

RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp package -DskipTests


# =========================
# Stage 2 — Runtime (Java 24)
# =========================
FROM eclipse-temurin:24-jdk

WORKDIR /app

COPY --from=build /workspace/target/*.jar app.jar

RUN addgroup --system app && adduser --system --ingroup app app
USER app

ENV JAVA_TOOL_OPTIONS="\
-XX:MaxRAMPercentage=75.0 \
-XX:InitialRAMPercentage=50.0 \
-XX:+UseG1GC \
-Dspring.profiles.active=prod"

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
