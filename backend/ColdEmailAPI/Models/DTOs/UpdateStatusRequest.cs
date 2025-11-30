using System.ComponentModel.DataAnnotations;

namespace ColdEmailAPI.Models.DTOs;

/// <summary>
/// Request model for updating email worked status
/// </summary>
public class UpdateStatusRequest
{
    [Required]
    public WorkedStatus WorkedStatus { get; set; }
}

