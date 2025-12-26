import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
      setLoading(false);
      return;
    }

    // fallback: try to fetch current user if token present
    apiFetch("/users/me")
      .then((data) => setUser(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No user found.</p>;

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>

        <p className="mb-2"><strong>Name:</strong> {user.name}</p>
        <p className="mb-2"><strong>Email:</strong> {user.email}</p>
        <p className="mb-2"><strong>Role:</strong> {user.role}</p>

        {/* Worker code feature removed — owners should create/assign workers from their UI */}
      </div>
    </div>
  );
}
