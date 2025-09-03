# 🔐 Konfiguration und Sicherheit

## Environment-Konfiguration

### Verfügbare Environments

1. **Development** (`environment.ts`)
   - Für allgemeine Entwicklung ohne echte API-Keys
   - API-Keys sollten leer bleiben
   - Verwendet Mock-Daten

2. **Local** (`environment.local.ts`) 
   - Für lokale Entwicklung mit echten API-Keys
   - **NICHT in Git committen!**
   - Enthält deine persönlichen API-Keys

3. **Production** (`environment.prod.ts`)
   - Für Produktionsumgebung
   - Sollte Backend-Proxy verwenden
   - Keine direkten API-Keys

### Setup für lokale Entwicklung

1. **API-Key in lokaler Umgebung setzen:**
   ```bash
   # Bearbeite src/environments/environment.local.ts
   # Füge deinen API-Key hinzu
   ```

2. **Mit lokaler Konfiguration starten:**
   ```bash
   npm run start:local
   ```

3. **Build mit lokaler Konfiguration:**
   ```bash
   npm run build:local
   ```

## Sicherheitshinweise

### ⚠️ **Wichtige Sicherheitswarnung**

**Frontend-Limitationen:**
- Alle Werte in Angular Environment-Files sind im Browser sichtbar
- API-Keys können von Benutzern eingesehen werden
- Dies ist **NICHT sicher für Produktionsumgebungen**

### 🛡️ **Empfohlene Produktionslösung**

Für echte Sicherheit solltest du:

1. **Backend-Proxy erstellen:**
   ```
   Frontend → Backend API → Azure Document Intelligence
   ```

2. **API-Keys nur im Backend speichern:**
   - Environment-Variablen auf dem Server
   - Azure Key Vault
   - Andere sichere Speicherlösungen

3. **Frontend konfigurieren:**
   ```typescript
   // environment.prod.ts
   azure: {
     endpoint: '/api/azure-proxy', // Dein Backend
     apiKey: '', // Leer lassen
     apiVersion: '2024-02-29-preview'
   }
   ```

## Dateien und Git

### Geschützte Dateien (in .gitignore)
- `src/environments/environment.local.ts`
- `src/environments/*.local.ts`
- `.env*` Dateien

### Commitbare Dateien
- `src/environments/environment.ts` (ohne API-Keys)
- `src/environments/environment.prod.ts` (Backend-Konfiguration)

## Verwendung

### Development (ohne echte API-Keys)
```bash
npm start
```

### Local Development (mit echten API-Keys)
```bash
npm run start:local
```

### Production Build
```bash
npm run build
```

## Troubleshooting

### Problem: "Service not configured"
- Überprüfe, ob API-Key in der entsprechenden environment-Datei gesetzt ist
- Stelle sicher, dass du die richtige Konfiguration verwendest (`npm run start:local`)

### Problem: API-Fehler
- Überprüfe die Gültigkeit deines API-Keys
- Stelle sicher, dass der Endpoint korrekt ist
- Prüfe die Azure-Ressource-Konfiguration