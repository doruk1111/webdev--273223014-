
const errorDiv = document.getElementById('error-message');

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  errorDiv.textContent = '';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

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

function initializeGoogleSignIn() {
  if (!window.GOOGLE_CLIENT_ID) {
    errorDiv.textContent = 'Google sign-in is not configured yet.';
    return;
  }

  google.accounts.id.initialize({
    client_id: window.GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
  });

  google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    { theme: 'outline', size: 'large', text: 'signin_with' }
  );
}

async function handleGoogleCredential(response) {
  errorDiv.textContent = '';

  try {
    const res = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    });

    if (res.ok) {
      window.location.href = '/groups';
    } else {
      const data = await res.json();
      errorDiv.textContent = data.error || 'Google sign-in failed';
    }
  } catch (err) {
    errorDiv.textContent = 'Google sign-in failed. Please try again.';
  }
}

const googleScript = document.createElement('script');
googleScript.src = 'https://accounts.google.com/gsi/client';
googleScript.async = true;
googleScript.defer = true;
googleScript.onload = initializeGoogleSignIn;
document.head.appendChild(googleScript);
