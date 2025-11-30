namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Response model for user profile
/// </summary>
public class ProfileResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? CurrentRole { get; set; }
    public string TargetRoles { get; set; } = string.Empty;
    public string AboutMe { get; set; } = string.Empty;
    public string? LinkedInUrl { get; set; }
    public bool IsComplete { get; set; }
}

