using System.ComponentModel.DataAnnotations;
using ColdEmailAPI.Models;

namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Request model for generating a cold email
/// </summary>
public class GenerateEmailRequest
{
    /// <summary>
    /// The extracted LinkedIn profile data of the recipient
    /// </summary>
    [Required]
    public string LinkedInProfileData { get; set; } = string.Empty;

    /// <summary>
    /// The type of email to generate (Default, Minimal, AboutThem, Custom)
    /// </summary>
    public EmailType EmailType { get; set; } = EmailType.Default;

    /// <summary>
    /// Custom prompt instructions (required when EmailType is Custom)
    /// </summary>
    public string? CustomPrompt { get; set; }
}
