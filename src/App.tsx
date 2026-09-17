import { useCallback, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppPortalView } from "./components/AppPortalView";
import { BerichteApp } from "./components/BerichteApp";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { ProtectedApp } from "./components/ProtectedApp";
import { WeberfassungApp } from "./components/WeberfassungApp";
import type { MainAppArea } from "./data/appAreas";
import type { AppModule, KennzahlenLaunchContext } from "./types/app";
import { AppShellLayout } from "./ui/AppShellLayout";
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

  const handleSelectArea = useCallback((area: MainAppArea) => {
    setModule(area);
  }, []);

  const handleSelectModule = useCallback((next: Exclude<AppModule, "landing">) => {
    setModule(next);
  }, []);

  const handleBackToLanding = useCallback(() => {
    setModule("landing");
  }, []);

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  if (module === "landing") {
    return (
      <LandingPage
        user={user}
        onSelectModule={handleSelectModule}
        onSelectArea={handleSelectArea}
        onLogout={handleLogout}
      />
    );
  }

  if (module === "beschaeftigungsportal" || module === "bildungsangebote") {
    return (
      <AppPortalView
        portalId={module}
        userName={user.displayName}
        onBackToLanding={handleBackToLanding}
        onLogout={handleLogout}
        onSelectArea={handleSelectArea}
      />
    );
  }

  if (module === "berichte") {
    return (
      <AppShellLayout active="berichte" onSelectArea={handleSelectArea}>
        <BerichteApp
          onBackToLanding={handleBackToLanding}
          onLogout={handleLogout}
          onLaunchReport={handleLaunchReport}
        />
      </AppShellLayout>
    );
  }

  if (module === "kennzahlen") {
    return (
      <AppShellLayout active="kennzahlen" onSelectArea={handleSelectArea}>
        <ProtectedApp
          launchContext={kennzahlenLaunch}
          onLaunchContextConsumed={() => setKennzahlenLaunch(null)}
          onBackToLanding={handleBackToLanding}
          onLogout={handleLogout}
        />
      </AppShellLayout>
    );
  }

  return (
    <AppShellLayout active="weberfassung" onSelectArea={handleSelectArea}>
      <WeberfassungApp onBackToLanding={handleBackToLanding} onLogout={handleLogout} />
    </AppShellLayout>
  );
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
