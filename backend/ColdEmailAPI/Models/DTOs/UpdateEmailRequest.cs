namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Request model for updating an email's content
/// </summary>
public class UpdateEmailRequest
{
    /// <summary>
    /// The updated email content
    /// </summary>
    public string GeneratedEmail { get; set; } = string.Empty;
}

