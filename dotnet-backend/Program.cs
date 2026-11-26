
using dotnet_backend.Configuration;
using dotnet_backend.Services;
using dotnet_backend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDatabaseConfiguration(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

/* user services */
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

app.UseCors("ReactPolicy");

app.MapControllers();

app.Run();
