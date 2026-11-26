import './Login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginUser, register as registerUser } from '../services/authService';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      if (isRegistering) {
        await registerUser({
          name: formData.get('name'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          password: formData.get('password')
        });
        const user = await loginUser(formData.get('email'), formData.get('password'));
        window.localStorage.setItem('salati-user-id', String(user.id));
      } else {
        const user = await loginUser(formData.get('email'), formData.get('password'));
        window.localStorage.setItem('salati-user-id', String(user.id));
      }
      navigate('/mainpage');
    } catch (requestError) {
      setError(requestError.message || `Unable to ${isRegistering ? 'register' : 'log in'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img className="login-logo" src="/salati.png" alt="Salati" />
        <h1>{isRegistering ? 'Create your account' : 'Welcome to Salati'}</h1>
        <p>{isRegistering ? 'Register to keep track of your daily prayers.' : 'Sign in to keep track of your daily prayers.'}</p>
        {error && <p className="login-error" role="alert">{error}</p>}
        {isRegistering && <>
          <label htmlFor="name">First name</label>
          <input id="name" name="name" type="text" autoComplete="given-name" required />
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" type="text" autoComplete="family-name" required />
        </>}
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} placeholder="Enter your password" required />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isRegistering ? 'Creating account…' : 'Logging in…') : (isRegistering ? 'Register' : 'Log in')}
        </button>
        <p className="login-switch">
          {isRegistering ? 'Already have an account?' : 'New to Salati?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
          >
            {isRegistering ? 'Log in' : 'Register'}
          </button>
        </p>
      </form>
    </main>
  );
}

export default Login;
