import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RouteProtegee from './components/RouteProtegee';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MesDemandes from './pages/MesDemandes';
import NouvelleDemande from './pages/NouvelleDemande';
import DemandesAValider from './pages/DemandesAValider';
import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';
import Calendrier from './pages/Calendrier';
import Rapports from './pages/Rapports';
import Parametres from './pages/Parametres';
import APropos from './pages/APropos';

const Page = ({ children }) => (
    <RouteProtegee><Layout>{children}</Layout></RouteProtegee>
);

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
                    <Route path="/demandes" element={<Page><MesDemandes /></Page>} />
                    <Route path="/demandes/nouvelle" element={<Page><NouvelleDemande /></Page>} />
                    <Route path="/demandes/valider" element={<Page><DemandesAValider /></Page>} />
                    <Route path="/employes" element={<Page><Employees /></Page>} />
                    <Route path="/employes/nouveau" element={<Page><EmployeeForm /></Page>} />
                    <Route path="/employes/:id/modifier" element={<Page><EmployeeForm /></Page>} />
                    <Route path="/calendrier" element={<Page><Calendrier /></Page>} />
                    <Route path="/rapports" element={<Page><Rapports /></Page>} />
                    <Route path="/parametres" element={<Page><Parametres /></Page>} />
                    <Route path="/apropos" element={<Page><APropos /></Page>} />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;