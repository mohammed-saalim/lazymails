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

# Expose port (Railway will set PORT env variable)
EXPOSE 8080

# Set ASP.NET Core to listen on Railway's PORT
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "ColdEmailAPI.dll"]


