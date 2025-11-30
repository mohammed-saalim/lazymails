using System.ComponentModel.DataAnnotations;

namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Request model for creating/updating user profile
/// </summary>
public class ProfileRequest
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string? CurrentRole { get; set; }
    
    [Required]
    [StringLength(500)]
    public string TargetRoles { get; set; } = string.Empty;
    
    [Required]
    [StringLength(2000)]
    public string AboutMe { get; set; } = string.Empty;
    
    [StringLength(200)]
    [Url]
    public string? LinkedInUrl { get; set; }
}

