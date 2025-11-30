namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Response model for email generation
/// </summary>
public class GenerateEmailResponse
{
    public int Id { get; set; }
    public string GeneratedEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

