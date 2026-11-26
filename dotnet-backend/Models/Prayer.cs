public class Prayer
{
    public int Id { get; set; }

    public PrayerType Type { get; set; }
    public PrayerStatus Status { get; set; }

    public int PrayerDayId { get; set; }
    public PrayerDay PrayerDay { get; set; }
}