namespace dotnet_backend.Services.Interfaces;

public interface IUserService
{
    Task<List<User>> GetAllAsync();

    Task<User?> GetByIdAsync(int id);

    Task<User?> LoginAsync(string email, string password);

    Task<User> CreateAsync(User user);

    Task<User?> UpdateAsync(int id, User user);

    Task<bool> DeleteAsync(int id);
}
