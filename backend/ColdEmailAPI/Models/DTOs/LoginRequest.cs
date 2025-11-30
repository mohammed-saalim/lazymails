using System.ComponentModel.DataAnnotations;

namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

