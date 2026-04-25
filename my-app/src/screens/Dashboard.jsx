import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="page">
      <section className="content">
        <h1>Welcome to Landed</h1>
        <p>Logged in as {user?.email}</p>
        <button type="button" className="auth-submit-button" onClick={logout}>
          Log out
        </button>
      </section>
    </main>
  );
}
