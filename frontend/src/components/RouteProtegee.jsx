import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RouteProtegee({ children }) {
    const { estConnecte, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!estConnecte) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}