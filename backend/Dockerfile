# ---- build ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
# BuildKit cache keeps downloaded dependencies between builds (Docker Compose v2 uses BuildKit by default)
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package

# ---- run ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 --home /app app \
 && mkdir -p /data/resumes && chown -R app:app /data /app
COPY --from=build /workspace/target/app.jar /app/app.jar
USER app
ENV STORAGE_DIR=/data/resumes \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
