using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ColdEmailAPI.Models;

/// <summary>
/// Represents the status of whether a cold email worked or not
/// </summary>
public enum WorkedStatus
{
    Unknown = 0,
    Worked = 1,
    DidntWork = 2
}

/// <summary>
/// Stores the history of generated cold emails
/// </summary>
public class EmailHistory
{
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public string LinkedInProfileData { get; set; } = string.Empty;

    [Required]
    public string GeneratedEmail { get; set; } = string.Empty;

    public WorkedStatus WorkedStatus { get; set; } = WorkedStatus.Unknown;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}

