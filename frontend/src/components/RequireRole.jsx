import { Navigate } from "react-router-dom";

function RequireRole({ user, role, children }) {
    if (!user || user.role !== role) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default RequireRole;
