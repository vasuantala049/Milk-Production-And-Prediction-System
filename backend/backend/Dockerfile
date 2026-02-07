# =========================
# Stage 1 — Build (Java 24)
# =========================
FROM maven:3.9.9-eclipse-temurin-24 AS build

WORKDIR /workspace

# Copy Maven wrapper & pom first (cache-friendly)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Download dependencies
RUN mvn -B -ntp dependency:go-offline

# Copy source code
COPY src src

# Build application
RUN mvn -B -ntp clean package -Dmaven.test.skip=true


# =========================
# Stage 2 — Runtime (Java 24)
# =========================
FROM eclipse-temurin:24-jdk

WORKDIR /app

# Copy jar from build stage
COPY --from=build /workspace/target/*.jar app.jar

# Run as non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app

# JVM options
ENV JAVA_TOOL_OPTIONS="\
-XX:MaxRAMPercentage=75.0 \
-XX:InitialRAMPercentage=50.0 \
-XX:+UseG1GC \
-Dspring.profiles.active=prod"

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
