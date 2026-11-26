<img src="https://github.com/user-attachments/assets/0f41b696-bac9-4401-be43-9644a8a92d5a" width="30%" />
<img src="https://github.com/user-attachments/assets/db2e879c-67a7-43a6-ad05-37ab92953bf2" width="30%" />
<img src="https://github.com/user-attachments/assets/c25019c4-f888-44ff-a99c-58cb486b96ca" width="30%" />

# Salati

Salati is a prayer-tracking app. Create an account, mark each of the five daily prayers as on time, late, or missed, and review your progress in a calendar. The calendar shows daily progress with colors, while the dashboard tracks prayer activity, monthly averages, and streaks. Gym activity can also affect a day's color.

## Tech stack

- React frontend in `react-frontend/`
- ASP.NET Core API in `dotnet-backend/`
- MySQL database managed with Entity Framework Core migrations

## Run locally

Make sure MySQL is running and set the connection string in your shell. Apply the migrations, then start the API:

```bash
export ConnectionStrings__DefaultConnection="Server=localhost;Port=3306;Database=salati;User=YOUR_DB_USER;Password=YOUR_DB_PASSWORD;"
cd dotnet-backend
dotnet ef database update
dotnet run
```

In another terminal, start the frontend:

```bash
cd react-frontend
npm install
npm start -- --host 0.0.0.0
```

Open `http://localhost:3000` on your computer. To use a phone on the same Wi-Fi network, open `http://<computer-LAN-IP>:3000` on the phone; the frontend uses that host to reach the API on port `5220`.
