using Microsoft.EntityFrameworkCore;
using ColdEmailAPI.Models;

namespace ColdEmailAPI.Data;

/// <summary>
/// Database context for the Cold Email application
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<EmailHistory> EmailHistories { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure EmailHistory entity
        modelBuilder.Entity<EmailHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LinkedInProfileData).IsRequired();
            entity.Property(e => e.GeneratedEmail).IsRequired();
            entity.Property(e => e.WorkedStatus).HasDefaultValue(WorkedStatus.Unknown);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configure relationship with User
            entity.HasOne(e => e.User)
                  .WithMany(u => u.EmailHistories)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure UserProfile entity
        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CurrentRole).HasMaxLength(100);
            entity.Property(e => e.TargetRoles).IsRequired().HasMaxLength(500);
            entity.Property(e => e.AboutMe).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.LinkedInUrl).HasMaxLength(200);

            // Configure one-to-one relationship with User
            entity.HasOne(e => e.User)
                  .WithOne(u => u.Profile)
                  .HasForeignKey<UserProfile>(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

