using System.ComponentModel.DataAnnotations;

namespace ColdEmailAPI.Models;

/// <summary>
/// Represents a user in the system
/// </summary>
public class User
{
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<EmailHistory> EmailHistories { get; set; } = new List<EmailHistory>();
    public UserProfile? Profile { get; set; }
}

