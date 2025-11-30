namespace ColdEmailAPI.Models;

/// <summary>
/// Enum representing different cold email styles
/// </summary>
public enum EmailType
{
    /// <summary>
    /// Comprehensive style with connection finding (default)
    /// </summary>
    Default = 0,

    /// <summary>
    /// Short, direct referral request (~80 words)
    /// </summary>
    Minimal = 1,

    /// <summary>
    /// Focus entirely on learning from the recipient (~120 words)
    /// </summary>
    AboutThem = 2,

    /// <summary>
    /// User provides their own prompt instructions
    /// </summary>
    Custom = 3
}

