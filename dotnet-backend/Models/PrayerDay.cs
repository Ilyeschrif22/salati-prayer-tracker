public class PrayerDay
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }

    public ICollection<Prayer> Prayers { get; set; } = new List<Prayer>();
}