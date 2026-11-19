document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = '';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = '/groups';
    } else {
      const data = await res.json();
      errorDiv.textContent = data.error || 'Login failed';
    }
  } catch (err) {
    errorDiv.textContent = 'An error occurred. Please try again.';
  }
});
