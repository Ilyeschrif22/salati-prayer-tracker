
using Microsoft.EntityFrameworkCore;
using dotnet_backend.Data;
using dotnet_backend.Services.Interfaces;

namespace dotnet_backend.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users.ToListAsync();
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> LoginAsync(string email, string password)
    {
        return await _context.Users
            .FirstOrDefaultAsync(user => user.Email == email && user.Password == password);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
            return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return true;
    }

    public Task<User?> UpdateAsync(int id, User user)
    {
        throw new NotImplementedException();
    }
}
