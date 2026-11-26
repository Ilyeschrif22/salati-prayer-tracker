dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Pomelo.EntityFrameworkCore.MySql
dotnet add package Microsoft.EntityFrameworkCore.Design

dotnet tool install --global dotnet-ef



dotnet add package Microsoft.EntityFrameworkCore.Design --version 9.0.0
dotnet ef migrations add InitialCreate
dotnet ef database update