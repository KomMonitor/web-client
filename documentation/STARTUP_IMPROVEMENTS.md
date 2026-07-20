# Verbesserungspotential in der Initialisierungsphase

Analyse der Startphase des Web-Clients (Stand: 2026-07-20, Branch `feature/migration-bootstrap`).
**Fortschritt:** 2 von 12 Punkten erledigt (Punkte 1–2, 2026-07-20).
Betrachteter Pfad: `main.ts` → `APP_INITIALIZER` (`StartupService.initApp()`) → `AuthService` /
`KeycloakHelperService` → `MainComponent` → Routing → `UserInterfaceComponent.ngOnInit()`.

Sortierung innerhalb der Kategorien nach Relevanz. Die lohnendsten Punkte sind **1, 2 und 5**
(echtes Fehlverhalten bzw. irreführendes Verhalten, nicht nur Stil).

---

## Robustheit / Fehlerpfade

### 1. Kein Fallback beim allerersten Fetch

`StartupService.loadAllConfigs()` holt `./config/config-storage-server.json` ohne `try/catch`
(`app/services/startup-service/startup.service.ts:22`). Schlägt dieser Fetch fehl, rejected der
`APP_INITIALIZER` und die App bootet gar nicht — weißer Bildschirm ohne Fehlermeldung. Alle
*nachfolgenden* Configs sind fehlertolerant (`Promise.allSettled`), ausgerechnet die erste nicht.

- [x] `try/catch` um den initialen Fetch + sinnvolle Fehlerbehandlung (Hinweisseite statt weißem Bildschirm)

> **Status (2026-07-20, erledigt):** Der initiale Fetch (inkl. non-ok-HTTP-Status, z. B. 404) ist
> jetzt abgesichert. Im Fehlerfall rendert `showStartupErrorPage()` eine statische Hinweisseite mit
> Reload-Button direkt ins DOM (Angular hat zu diesem Zeitpunkt noch nichts gerendert) und der
> Fehler wird bewusst weitergeworfen, damit die App nicht mit leerer Konfiguration weiterbootet.
> Abgedeckt durch zwei neue Tests in `startup.service.spec.ts` (Netzwerkfehler + non-ok-Status).

### 2. Der beworbene Config-Fallback existiert nicht

Bei Fehlern loggt der `StartupService` „Using local backup defaults“, lädt aber tatsächlich nichts
nach: `env_backup.js` wird zur Laufzeit nie geladen (nur vom Admin-Config-Editor in
`admin-app-config.component.ts` referenziert). `window.__env` bleibt dann schlicht leer.
`PROPOSED_CHANGES.md` (Z. 155) dokumentiert das bereits für Filter-/Controls-Config — für `env.js`
gilt es genauso. Nur `keycloak_backup.json` hat einen echten Fallback (in
`keycloak-helper.service.ts`).

- [x] Entweder den Fallback wirklich implementieren (Backup-Dateien im `catch`/`onerror` nachladen)
      oder die irreführenden Log-Meldungen korrigieren

> **Status (2026-07-20, erledigt):** Beides umgesetzt, je nachdem, ob ein Backup existiert:
> Für die **App-Config** gibt es jetzt einen echten Fallback — schlägt das Laden von `env.js` vom
> Config-Server fehl, lädt `loadAppConfigScript()` das lokal ausgelieferte
> `./config/env_backup.js` nach (Asset in `angular.json`, befüllt `window.__env` vollständig).
> Für **Keycloak-/Controls-/Filter-Config** existieren keine lokalen Backups (die
> `*_backup.json`-Dateien wurden laut `PROPOSED_CHANGES.md` gelöscht bzw. gab es nie als
> Runtime-Fallback) — dort wurde die irreführende Meldung „Using local backup defaults" durch ein
> ehrliches `console.warn` ersetzt; `keycloak_backup.json` greift weiterhin separat im
> `KeycloakHelperService`. Abgedeckt durch einen neuen Test in `startup.service.spec.ts`
> (Fallback-Kette der Script-Tags).

### 3. `KeycloakHelperService.init()` als floating Promise

In `startup.service.ts:18` wird die async-Methode nicht awaited, und sie wirft bei Fehlern
(`throw error`) → unhandled rejection. Bewusst nicht-blockierend ist okay, aber dann mit `.catch()`.

- [ ] `.catch()` ergänzen oder bewusst awaiten

### 4. `alert()` bei Keycloak-Fehler + totes `try/catch`

`auth.service.ts:50` nutzt ein blockierendes `alert()`, obwohl der `NotificationService` existiert
und im selben Service injiziert ist. Direkt daneben (Z. 39–44) liegt ein totes `try/catch` um ein
`console.debug` — Migrations-Überbleibsel.

- [ ] `alert()` durch `NotificationService` ersetzen
- [ ] Totes `try/catch` entfernen

---

## Totes / überflüssiges Laden

### 5. `ConfigStorageService.getConfigs()` ist zu zwei Dritteln wirkungslos

`getAppConfig()` und `getKeycloakConfig()` geben kalte Observables zurück, die nie subscribed
werden; nur `getControlsConfig()` feuert tatsächlich. Der Aufruf in
`UserInterfaceComponent.ngOnInit()` lädt also nur die Controls-Config doppelt — und legt sie in
`configStorageService.controlsConfig` ab, während der Startup sie bereits nach
`window.__env.controlsConfig` geschrieben hat: **zwei Quellen für dieselbe Config**, die
auseinanderlaufen können.

- [ ] Wirkungslose Aufrufe entfernen oder `getConfigs()` ganz streichen
- [ ] Eine einzige Quelle für die Controls-Config festlegen (idealerweise via `EnvConfigService`)

### 6. Keycloak-Config wird bis zu dreimal geholt

1. `StartupService.fetchJsonConfig()` → `window.__env.keycloakConfig`
2. `new Keycloak(url)` in `auth.service.ts:22` lässt keycloak-js dieselbe URL nochmal fetchen
3. ggf. `KeycloakHelperService.init()`

Dem Keycloak-Konstruktor kann direkt das bereits geladene Config-Objekt übergeben werden — spart
einen Netzwerk-Roundtrip in der blockierenden Startphase.

- [ ] Geladenes Config-Objekt an den Keycloak-Konstruktor übergeben

### 7. Obsoleter Browser-Check

`MainComponent.checkBrowser()` warnt vor IE 9/10/11 und Legacy-Edge. Angular 21 läuft auf keinem
davon; der Code ist toter Ballast.

- [ ] `checkBrowser()` entfernen

---

## Modernisierung / Cleanup

### 8. `APP_INITIALIZER` ist deprecated

Seit Angular 19 wird `provideAppInitializer()` empfohlen. Kleiner, sauberer Umbau in
`app.module.ts` (inkl. Wegfall der Factory-Funktion `initializeApp`).

- [ ] Auf `provideAppInitializer()` umstellen

### 9. Globales `console.log`-Patching

`initEnvVariables()` ersetzt `window.console.log` durch eine No-op, wenn `enableDebug` fehlt. Das
unterdrückt auch Logs von Drittbibliotheken und erschwert Support-Fälle.

- [ ] Schmalen Logger-Service einführen statt `window.console` zu patchen

### 10. Auskommentierter Code in `UserInterfaceComponent.ngOnInit()`

`kommonitorShareHelperService.init()`, `openInfoModal()`, `openReportingModal()` liegen als
Kommentar-Leichen herum.

- [ ] Ticket anlegen oder löschen

### 11. Direkte `window.__env`-Zugriffe

Bereits in `PROPOSED_CHANGES.md` (Z. 277) erfasst: verbleibende direkte Zugriffe auf
`EnvConfigService` umstellen, damit Config-Zugriffe typisiert und testbar sind.

- [ ] Direkte `window.__env`-Reads migrieren (siehe `PROPOSED_CHANGES.md`)

---

## Wahrnehmung / UX

### 12. Kein Splash-Screen

`index.html` enthält nur `<app-main>`. Während der gesamten blockierenden Kette
(Config-Storage-JSON → 4 Configs → Keycloak `check-sso`) sieht der Nutzer eine leere Seite. Ein
statischer Lade-Hinweis direkt im `index.html` (den Angular beim Bootstrap ersetzt) wäre billig und
würde die gefühlte Startzeit deutlich verbessern.

- [ ] Statischen Splash-Screen in `index.html` ergänzen
