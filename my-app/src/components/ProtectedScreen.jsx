import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProtectedScreen({ children, redirectTo = "/" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  if (!user) return null;
  return children;
}
