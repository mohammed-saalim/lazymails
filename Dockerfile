# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY backend/ColdEmailAPI/*.csproj ./backend/ColdEmailAPI/
WORKDIR /src/backend/ColdEmailAPI
RUN dotnet restore

# Copy everything else and build
WORKDIR /src
COPY backend/ColdEmailAPI/. ./backend/ColdEmailAPI/
WORKDIR /src/backend/ColdEmailAPI
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Expose port (Railway will set PORT env variable)
EXPOSE 8080

# Set ASP.NET Core to listen on Railway's PORT
ENV ASPNETCORE_URLS=http://+:8080

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

ENTRYPOINT ["dotnet", "ColdEmailAPI.dll"]


