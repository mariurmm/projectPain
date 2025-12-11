import { Navigate } from "react-router-dom";

export default function PrivateRoute({ role, children }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/" />;
  if (userRole !== role) return <Navigate to="/" />;

  return children;
}
