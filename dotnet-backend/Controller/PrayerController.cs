
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Data;

namespace dotnet_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrayerController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PrayerController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{userId:int}/{date}")]
    public async Task<IActionResult> GetDay(int userId, DateOnly date)
    {
        var day = await _context.PrayerDays
            .Include(d => d.Prayers)
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Date == date);

        if (day == null)
            return NotFound("Prayer day not found.");

        return Ok(ToDayResponse(day));
    }

    [HttpGet("{userId:int}/month/{year:int}/{month:int}")]
    public async Task<IActionResult> GetMonth(int userId, int year, int month)
    {
        if (month < 1 || month > 12)
            return BadRequest("Invalid month.");

        var days = await _context.PrayerDays
            .Where(d => d.UserId == userId &&
                        d.Date.Year == year &&
                        d.Date.Month == month)
            .Include(d => d.Prayers)
            .OrderBy(d => d.Date)
            .ToListAsync();

        return Ok(days.Select(ToDayResponse));
    }

    [HttpGet("{userId:int}/stats/streak")]
    public async Task<IActionResult> GetStreak(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var days = await _context.PrayerDays
            .Where(day => day.UserId == userId && day.Date <= today)
            .Include(day => day.Prayers)
            .ToListAsync();

        var completedDates = days
            .Where(day => day.Prayers.Any(prayer =>
                prayer.Status == PrayerStatus.Completed || prayer.Status == PrayerStatus.Late))
            .Select(day => day.Date)
            .ToHashSet();

        var date = completedDates.Contains(today) ? today : today.AddDays(-1);
        var streak = 0;
        while (completedDates.Contains(date))
        {
            streak++;
            date = date.AddDays(-1);
        }

        return Ok(new { streak });
    }

    [HttpPost("{userId:int}/{date}")]
    public async Task<IActionResult> CreateDay(int userId, DateOnly date)
    {
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == userId);

        if (!userExists)
            return NotFound("User not found.");

        var existingDay = await _context.PrayerDays
            .AnyAsync(d => d.UserId == userId && d.Date == date);

        if (existingDay)
            return Conflict("This day already exists.");

        var day = new PrayerDay
        {
            UserId = userId,
            Date = date,
            Prayers = Enum.GetValues<PrayerType>()
                .Select(type => new Prayer
                {
                    Type = type,
                    Status = PrayerStatus.Pending
                })
                .ToList()
        };

        _context.PrayerDays.Add(day);
        await _context.SaveChangesAsync();

        return Ok(ToDayResponse(day));
    }

    [HttpPut("{userId:int}/{date}")]
    public async Task<IActionResult> UpdateDay(
        int userId,
        DateOnly date,
        [FromBody] UpdatePrayerDayRequest request)
    {
        var prayerTypes = Enum.GetValues<PrayerType>();
        if (request.Prayers == null ||
            request.Prayers.Count != prayerTypes.Length ||
            request.Prayers.Select(p => p.Type).Distinct().Count() != prayerTypes.Length ||
            request.Prayers.Any(p =>
                !Enum.IsDefined(typeof(PrayerType), p.Type) ||
                !Enum.IsDefined(typeof(PrayerStatus), p.Status)))
        {
            return BadRequest("Provide a valid status for each prayer.");
        }

        var day = await _context.PrayerDays
            .Include(d => d.Prayers)
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Date == date);

        if (day == null)
            return NotFound("Prayer day not found.");

        foreach (var update in request.Prayers)
        {
            var prayer = day.Prayers.First(p => p.Type == update.Type);
            prayer.Status = update.Status;
        }

        await _context.SaveChangesAsync();
        return Ok(ToDayResponse(day));
    }

    [HttpPut("{userId:int}/{date}/{type}")]
    public async Task<IActionResult> UpdateStatus(
        int userId,
        DateOnly date,
        PrayerType type,
        [FromBody] UpdatePrayerStatusRequest request)
    {
        if (!Enum.IsDefined(typeof(PrayerType), type))
            return BadRequest("Invalid prayer type.");

        if (!Enum.IsDefined(typeof(PrayerStatus), request.Status))
            return BadRequest("Invalid prayer status.");

        var prayer = await _context.Prayers
            .Include(p => p.PrayerDay)
            .FirstOrDefaultAsync(p =>
                p.PrayerDay.UserId == userId &&
                p.PrayerDay.Date == date &&
                p.Type == type);

        if (prayer == null)
            return NotFound("Prayer not found.");

        prayer.Status = request.Status;

        await _context.SaveChangesAsync();

        return Ok(new { prayer.Id, prayer.Type, prayer.Status, prayer.PrayerDayId });
    }

    private static object ToDayResponse(PrayerDay day) => new
    {
        day.Id,
        day.UserId,
        day.Date,
        Prayers = day.Prayers.Select(prayer => new
        {
            prayer.Id,
            prayer.Type,
            prayer.Status,
            prayer.PrayerDayId
        })
    };
}

public class UpdatePrayerStatusRequest
{
    public PrayerStatus Status { get; set; }
}

public class UpdatePrayerDayRequest
{
    public List<PrayerUpdate> Prayers { get; set; } = new();
}

public class PrayerUpdate
{
    public PrayerType Type { get; set; }
    public PrayerStatus Status { get; set; }
}
