
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Data;


public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }


    /*add models here */
    public DbSet<User> Users => Set<User>();
    public DbSet<PrayerDay> PrayerDays => Set<PrayerDay>();
    public DbSet<Prayer> Prayers => Set<Prayer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Keep the table names aligned with the existing migrations.
        modelBuilder.Entity<PrayerDay>().ToTable("PrayerDay");
        modelBuilder.Entity<Prayer>().ToTable("Prayer");
    }
}
