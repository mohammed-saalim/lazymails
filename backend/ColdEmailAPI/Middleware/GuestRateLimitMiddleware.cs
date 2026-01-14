using Microsoft.Extensions.Caching.Memory;

namespace ColdEmailAPI.Middleware;

/// <summary>
/// Middleware to rate limit guest email generation requests by IP address
/// </summary>
public class GuestRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GuestRateLimitMiddleware> _logger;
    private const int DailyLimit = 5;

    public GuestRateLimitMiddleware(
        RequestDelegate next,
        IMemoryCache cache,
        ILogger<GuestRateLimitMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only apply rate limiting to guest endpoint
        if (context.Request.Path.StartsWithSegments("/api/email/generate/guest"))
        {
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var cacheKey = $"guest_{ipAddress}_{DateTime.UtcNow:yyyyMMdd}";

            // Get or create counter for this IP address today
            var count = _cache.GetOrCreate(cacheKey, entry =>
            {
                // Expire at end of day
                var now = DateTime.UtcNow;
                var endOfDay = now.Date.AddDays(1);
                entry.AbsoluteExpiration = endOfDay;
                
                _logger.LogInformation("Created new rate limit counter for IP: {IP}", ipAddress);
                return 0;
            });

            _logger.LogInformation("Guest request from IP: {IP}, current count: {Count}/{Limit}", 
                ipAddress, count, DailyLimit);

            // Store count in HttpContext for the controller to use
            context.Items["GuestRequestCount"] = count;

            // Increment the counter
            _cache.Set(cacheKey, count + 1, new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = DateTime.UtcNow.Date.AddDays(1)
            });
        }

        await _next(context);
    }
}

/// <summary>
/// Extension method to register the middleware
/// </summary>
public static class GuestRateLimitMiddlewareExtensions
{
    public static IApplicationBuilder UseGuestRateLimit(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<GuestRateLimitMiddleware>();
    }
}
