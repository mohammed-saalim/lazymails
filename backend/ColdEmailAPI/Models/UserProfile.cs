namespace ColdEmailAPI.Models;

/// <summary>
/// User profile for personalizing cold email generation
/// </summary>
public class UserProfile
{
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    /// <summary>
    /// User's full name
    /// </summary>
    public string FullName { get; set; } = string.Empty;
    
    /// <summary>
    /// Current job role/title
    /// </summary>
    public string? CurrentRole { get; set; }
    
    /// <summary>
    /// Target roles the user is looking for
    /// </summary>
    public string TargetRoles { get; set; } = string.Empty;
    
    /// <summary>
    /// Free-form about section: work experience, education, achievements, skills
    /// </summary>
    public string AboutMe { get; set; } = string.Empty;
    
    /// <summary>
    /// User's own LinkedIn profile URL
    /// </summary>
    public string? LinkedInUrl { get; set; }
    
    /// <summary>
    /// Navigation property to User
    /// </summary>
    public User User { get; set; } = null!;
}

