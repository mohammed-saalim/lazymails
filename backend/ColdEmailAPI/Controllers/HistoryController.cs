using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ColdEmailAPI.Data;
using ColdEmailAPI.Models;
using ColdEmailAPI.Models.DTOs;

namespace ColdEmailAPI.Controllers;

/// <summary>
/// Controller for managing email generation history
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HistoryController> _logger;

    public HistoryController(
        ApplicationDbContext context,
        ILogger<HistoryController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gets all email history for the authenticated user
    /// </summary>
    /// <param name="status">Optional filter by worked status</param>
    /// <returns>List of email history entries</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmailHistoryResponse>>> GetHistory([FromQuery] WorkedStatus? status = null)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Query email history
            var query = _context.EmailHistories
                .Where(h => h.UserId == userId)
                .AsQueryable();

            // Apply status filter if provided
            if (status.HasValue)
            {
                query = query.Where(h => h.WorkedStatus == status.Value);
            }

            // Order by most recent first
            var history = await query
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new EmailHistoryResponse
                {
                    Id = h.Id,
                    LinkedInProfileData = h.LinkedInProfileData,
                    GeneratedEmail = h.GeneratedEmail,
                    WorkedStatus = h.WorkedStatus,
                    CreatedAt = h.CreatedAt,
                    UpdatedAt = h.UpdatedAt
                })
                .ToListAsync();

            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email history");
            return StatusCode(500, new { message = "An error occurred while retrieving history" });
        }
    }

    /// <summary>
    /// Gets a specific email history entry by ID
    /// </summary>
    /// <param name="id">The email history ID</param>
    /// <returns>The email history entry</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<EmailHistoryResponse>> GetHistoryById(int id)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Find the history entry
            var history = await _context.EmailHistories
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);

            if (history == null)
            {
                return NotFound(new { message = "Email history not found" });
            }

            return Ok(new EmailHistoryResponse
            {
                Id = history.Id,
                LinkedInProfileData = history.LinkedInProfileData,
                GeneratedEmail = history.GeneratedEmail,
                WorkedStatus = history.WorkedStatus,
                CreatedAt = history.CreatedAt,
                UpdatedAt = history.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email history by ID");
            return StatusCode(500, new { message = "An error occurred while retrieving history" });
        }
    }

    /// <summary>
    /// Updates the worked status of an email history entry
    /// </summary>
    /// <param name="id">The email history ID</param>
    /// <param name="request">The update request containing the new status</param>
    /// <returns>The updated email history entry</returns>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<EmailHistoryResponse>> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Find the history entry
            var history = await _context.EmailHistories
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);

            if (history == null)
            {
                return NotFound(new { message = "Email history not found" });
            }

            // Update the status
            history.WorkedStatus = request.WorkedStatus;
            history.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated email history {HistoryId} status to {Status}", id, request.WorkedStatus);

            return Ok(new EmailHistoryResponse
            {
                Id = history.Id,
                LinkedInProfileData = history.LinkedInProfileData,
                GeneratedEmail = history.GeneratedEmail,
                WorkedStatus = history.WorkedStatus,
                CreatedAt = history.CreatedAt,
                UpdatedAt = history.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email history status");
            return StatusCode(500, new { message = "An error occurred while updating status" });
        }
    }

    /// <summary>
    /// Updates an email history entry (email content)
    /// </summary>
    /// <param name="id">The email history ID</param>
    /// <param name="request">The update request containing the new email content</param>
    /// <returns>The updated email history entry</returns>
    [HttpPut("{id}")]
    public async Task<ActionResult<EmailHistoryResponse>> UpdateEmail(int id, [FromBody] UpdateEmailRequest request)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Find the history entry
            var history = await _context.EmailHistories
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);

            if (history == null)
            {
                return NotFound(new { message = "Email history not found" });
            }

            // Update the email content
            if (!string.IsNullOrWhiteSpace(request.GeneratedEmail))
            {
                history.GeneratedEmail = request.GeneratedEmail;
            }
            history.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated email history {HistoryId} content for user {UserId}", id, userId);

            return Ok(new EmailHistoryResponse
            {
                Id = history.Id,
                LinkedInProfileData = history.LinkedInProfileData,
                GeneratedEmail = history.GeneratedEmail,
                WorkedStatus = history.WorkedStatus,
                CreatedAt = history.CreatedAt,
                UpdatedAt = history.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email history content");
            return StatusCode(500, new { message = "An error occurred while updating email" });
        }
    }

    /// <summary>
    /// Deletes an email history entry
    /// </summary>
    /// <param name="id">The email history ID</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHistory(int id)
    {
        try
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            // Find the history entry
            var history = await _context.EmailHistories
                .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId);

            if (history == null)
            {
                return NotFound(new { message = "Email history not found" });
            }

            _context.EmailHistories.Remove(history);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted email history {HistoryId} for user {UserId}", id, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting email history");
            return StatusCode(500, new { message = "An error occurred while deleting history" });
        }
    }
}

