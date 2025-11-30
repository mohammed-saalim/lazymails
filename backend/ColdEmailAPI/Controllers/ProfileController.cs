using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ColdEmailAPI.Data;
using ColdEmailAPI.Models;
using ColdEmailAPI.Models.DTOs;

namespace ColdEmailAPI.Controllers;

/// <summary>
/// Controller for managing user profiles
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(
        ApplicationDbContext context,
        ILogger<ProfileController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current user's profile
    /// </summary>
    /// <returns>The user's profile or null if not created</returns>
    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> GetProfile()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var profile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                return Ok(new ProfileResponse
                {
                    Id = 0,
                    FullName = "",
                    CurrentRole = null,
                    TargetRoles = "",
                    AboutMe = "",
                    LinkedInUrl = null,
                    IsComplete = false
                });
            }

            return Ok(new ProfileResponse
            {
                Id = profile.Id,
                FullName = profile.FullName,
                CurrentRole = profile.CurrentRole,
                TargetRoles = profile.TargetRoles,
                AboutMe = profile.AboutMe,
                LinkedInUrl = profile.LinkedInUrl,
                IsComplete = IsProfileComplete(profile)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, new { message = "An error occurred while retrieving profile" });
        }
    }

    /// <summary>
    /// Creates or updates the current user's profile
    /// </summary>
    /// <param name="request">The profile data</param>
    /// <returns>The updated profile</returns>
    [HttpPost]
    public async Task<ActionResult<ProfileResponse>> SaveProfile([FromBody] ProfileRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { message = "Full name is required" });
            }
            if (string.IsNullOrWhiteSpace(request.TargetRoles))
            {
                return BadRequest(new { message = "Target roles is required" });
            }
            if (string.IsNullOrWhiteSpace(request.AboutMe))
            {
                return BadRequest(new { message = "About me is required" });
            }

            var existingProfile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            UserProfile profile;

            if (existingProfile == null)
            {
                // Create new profile
                profile = new UserProfile
                {
                    UserId = userId,
                    FullName = request.FullName.Trim(),
                    CurrentRole = request.CurrentRole?.Trim(),
                    TargetRoles = request.TargetRoles.Trim(),
                    AboutMe = request.AboutMe.Trim(),
                    LinkedInUrl = request.LinkedInUrl?.Trim()
                };
                _context.UserProfiles.Add(profile);
                _logger.LogInformation("Created new profile for user {UserId}", userId);
            }
            else
            {
                // Update existing profile
                existingProfile.FullName = request.FullName.Trim();
                existingProfile.CurrentRole = request.CurrentRole?.Trim();
                existingProfile.TargetRoles = request.TargetRoles.Trim();
                existingProfile.AboutMe = request.AboutMe.Trim();
                existingProfile.LinkedInUrl = request.LinkedInUrl?.Trim();
                profile = existingProfile;
                _logger.LogInformation("Updated profile for user {UserId}", userId);
            }

            await _context.SaveChangesAsync();

            return Ok(new ProfileResponse
            {
                Id = profile.Id,
                FullName = profile.FullName,
                CurrentRole = profile.CurrentRole,
                TargetRoles = profile.TargetRoles,
                AboutMe = profile.AboutMe,
                LinkedInUrl = profile.LinkedInUrl,
                IsComplete = IsProfileComplete(profile)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving user profile");
            return StatusCode(500, new { message = "An error occurred while saving profile" });
        }
    }

    /// <summary>
    /// Checks if a profile is complete
    /// </summary>
    private static bool IsProfileComplete(UserProfile profile)
    {
        return !string.IsNullOrWhiteSpace(profile.FullName) &&
               !string.IsNullOrWhiteSpace(profile.TargetRoles) &&
               !string.IsNullOrWhiteSpace(profile.AboutMe);
    }
}

