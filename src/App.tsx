import { AuthProvider } from "./context/AuthContext";
import { ProtectedApp } from "./components/ProtectedApp";

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
