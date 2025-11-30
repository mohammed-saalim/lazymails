using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ColdEmailAPI.Data;
using ColdEmailAPI.Models;
using ColdEmailAPI.Models.DTOs;
using ColdEmailAPI.Services;

namespace ColdEmailAPI.Controllers;

/// <summary>
/// Controller for generating cold emails from LinkedIn profile data
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly GeminiService _geminiService;
    private readonly ILogger<EmailController> _logger;

    public EmailController(
        ApplicationDbContext context,
        GeminiService geminiService,
        ILogger<EmailController> logger)
    {
        _context = context;
        _geminiService = geminiService;
        _logger = logger;
    }

    /// <summary>
    /// Generates a personalized cold email based on LinkedIn profile data
    /// </summary>
    /// <param name="request">The request containing LinkedIn profile data</param>
    /// <returns>The generated cold email</returns>
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateEmailResponse>> GenerateEmail([FromBody] GenerateEmailRequest request)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(request.LinkedInProfileData))
            {
                return BadRequest(new { message = "LinkedIn profile data is required" });
            }

            // Validate custom prompt if email type is Custom
            if (request.EmailType == EmailType.Custom && string.IsNullOrWhiteSpace(request.CustomPrompt))
            {
                return BadRequest(new { message = "Custom prompt is required when email type is 'Custom'" });
            }

            _logger.LogInformation("Email type requested: {EmailType}", request.EmailType);

            // Log the extracted profile data for debugging
            _logger.LogInformation("=== EXTRACTED LINKEDIN DATA ===");
            _logger.LogInformation($"Data length: {request.LinkedInProfileData.Length} characters");
            _logger.LogInformation($"First 500 characters: {request.LinkedInProfileData.Substring(0, Math.Min(500, request.LinkedInProfileData.Length))}");
            _logger.LogInformation("=== END OF EXTRACTED DATA ===");

            // Fetch user's profile for personalization
            var userProfile = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (userProfile != null)
            {
                _logger.LogInformation("Using user profile for personalization: {FullName}", userProfile.FullName);
            }
            else
            {
                _logger.LogInformation("No user profile found, using basic prompt");
            }

            // Generate email using Gemini API with user profile and email type
            string generatedEmail;
            try
            {
                generatedEmail = await _geminiService.GenerateColdEmailAsync(
                    request.LinkedInProfileData, 
                    userProfile,
                    request.EmailType,
                    request.CustomPrompt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating email with Gemini API");
                return StatusCode(500, new { message = "Failed to generate email. Please check your API configuration." });
            }

            // Save to database
            var emailHistory = new EmailHistory
            {
                UserId = userId,
                LinkedInProfileData = request.LinkedInProfileData,
                GeneratedEmail = generatedEmail,
                WorkedStatus = WorkedStatus.Unknown,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EmailHistories.Add(emailHistory);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Generated cold email for user {UserId}, saved as history ID {HistoryId}", userId, emailHistory.Id);

            return Ok(new GenerateEmailResponse
            {
                Id = emailHistory.Id,
                GeneratedEmail = generatedEmail,
                CreatedAt = emailHistory.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GenerateEmail endpoint");
            return StatusCode(500, new { message = "An error occurred while generating the email" });
        }
    }
}

