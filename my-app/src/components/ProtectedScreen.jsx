import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedScreen({ children, onUnauthenticated }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) onUnauthenticated();
  }, [user]);

  if (!user) return null;
  return children;
}
