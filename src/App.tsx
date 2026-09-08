import { useCallback, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BerichteApp } from "./components/BerichteApp";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { ProtectedApp } from "./components/ProtectedApp";
import { WeberfassungApp } from "./components/WeberfassungApp";
import type { AppModule, KennzahlenLaunchContext } from "./types/app";
import { KernContextProvider } from "./ui/kern";

function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [module, setModule] = useState<AppModule>("landing");
  const [kennzahlenLaunch, setKennzahlenLaunch] = useState<KennzahlenLaunchContext | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    setModule("landing");
    setKennzahlenLaunch(null);
  }, [logout]);

  const handleLaunchReport = useCallback((context: KennzahlenLaunchContext) => {
    setKennzahlenLaunch(context);
    setModule("kennzahlen");
  }, []);

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  if (module === "landing") {
    return (
      <LandingPage
        user={user}
        onSelectModule={(next) => setModule(next)}
        onLogout={handleLogout}
      />
    );
  }

  if (module === "berichte") {
    return (
      <BerichteApp
        onBackToLanding={() => setModule("landing")}
        onLogout={handleLogout}
        onLaunchReport={handleLaunchReport}
      />
    );
  }

  if (module === "kennzahlen") {
    return (
      <ProtectedApp
        launchContext={kennzahlenLaunch}
        onLaunchContextConsumed={() => setKennzahlenLaunch(null)}
        onBackToLanding={() => setModule("landing")}
        onLogout={handleLogout}
      />
    );
  }

  return <WeberfassungApp onBackToLanding={() => setModule("landing")} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <KernContextProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </KernContextProvider>
  );
}
