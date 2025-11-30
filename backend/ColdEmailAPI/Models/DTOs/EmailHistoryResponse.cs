namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Response model for email history
/// </summary>
public class EmailHistoryResponse
{
    public int Id { get; set; }
    public string LinkedInProfileData { get; set; } = string.Empty;
    public string GeneratedEmail { get; set; } = string.Empty;
    public WorkedStatus WorkedStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

