import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDemoCredentials } from '../data/users';
import { KernAppChrome } from '../ui/KernAppChrome';
import {
  KernAlert,
  KernButton,
  KernCard,
  KernContainer,
  KernDescriptionList,
  KernForm,
  KernInput,
  KernSpace,
} from '../ui/kern';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!login(username, password)) {
      setError('Ungültige Zugangsdaten.');
    }
  }

  const demoDetails = Object.fromEntries(
    getDemoCredentials().map((credential) => [
      credential.role,
      `${credential.username} / ${credential.password}`,
    ]),
  );

  return (
    <KernAppChrome>
      <KernContainer>
        <KernSpace size="x-large" />
        <KernCard title="Anmeldung" subline="Justiz NRW · Kennzahlensystem schulische Bildung">
          <KernForm onSubmit={handleSubmit}>
            <KernInput
              id="username"
              name="username"
              label="Benutzername"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <KernSpace size="default" />
            <KernInput
              id="password"
              name="password"
              type="password"
              label="Passwort"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error ? (
              <>
                <KernSpace size="default" />
                <KernAlert title="Anmeldung fehlgeschlagen" variant="danger">
                  {error}
                </KernAlert>
              </>
            ) : null}
            <KernSpace size="large" />
            <KernButton type="submit" variant="primary" label="Anmelden" block />
            <KernSpace size="small" />
            <KernButton
              type="button"
              variant="tertiary"
              label={showHelp ? 'Demo-Zugänge ausblenden' : 'Demo-Zugänge anzeigen'}
              onClick={() => setShowHelp((current) => !current)}
              block
            />
            {showHelp ? (
              <>
                <KernSpace size="default" />
                <KernDescriptionList details={demoDetails} />
              </>
            ) : null}
          </KernForm>
        </KernCard>
        <KernSpace size="x-large" />
      </KernContainer>
    </KernAppChrome>
  );
}
