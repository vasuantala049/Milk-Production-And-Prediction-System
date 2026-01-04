import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { Card, CardContent, Avatar } from '@mui/material';

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
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar sx={{ bgcolor: '#eef2ff', color: '#4f46e5' }}>{(user.name || '').charAt(0)}</Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <p className="mb-2"><strong>Role:</strong> {user.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
