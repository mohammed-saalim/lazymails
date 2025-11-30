namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Response model for authentication operations
/// </summary>
public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int UserId { get; set; }
}

