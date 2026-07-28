# Verbesserungspotential in der Initialisierungsphase

Analyse der Startphase des Web-Clients (Stand: 2026-07-20, Branch `feature/migration-bootstrap`).
**Fortschritt:** 11 von 13 Punkten erledigt (Punkte 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 13, 2026-07-20).
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
_nachfolgenden_ Configs sind fehlertolerant (`Promise.allSettled`), ausgerechnet die erste nicht.

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

- [x] `.catch()` ergänzen oder bewusst awaiten

> **Status (2026-07-20, erledigt):** Der Aufruf bleibt bewusst nicht-blockierend (das Laden der
> Rollen soll den App-Start nicht aufhalten), hat jetzt aber ein `.catch()`, das den Fehler loggt.
> Damit taucht der `throw` aus `KeycloakHelperService.init()` nicht mehr als unhandled promise
> rejection auf.

### 4. `alert()` bei Keycloak-Fehler + totes `try/catch`

`auth.service.ts:50` nutzt ein blockierendes `alert()`, obwohl der `NotificationService` existiert
und im selben Service injiziert ist. Direkt daneben (Z. 39–44) liegt ein totes `try/catch` um ein
`console.debug` — Migrations-Überbleibsel.

- [x] `alert()` durch `NotificationService` ersetzen
- [x] Totes `try/catch` entfernen

> **Status (2026-07-20, erledigt):** Das blockierende `alert()` im `.catch()` von `initKeycloak()`
> ist durch `notificationSrvc.showError(...)` ersetzt (deutsche Meldung, `autohide: false`); der
> `.catch(function () {...})` wurde dafür zur Arrow-Function, damit `this` gebunden ist. Das tote
> `try/catch` um das `console.debug('Trying to bootstrap application.')` ist entfernt.

---

## Totes / überflüssiges Laden

### 5. `ConfigStorageService.getConfigs()` ist zu zwei Dritteln wirkungslos

`getAppConfig()` und `getKeycloakConfig()` geben kalte Observables zurück, die nie subscribed
werden; nur `getControlsConfig()` feuert tatsächlich. Der Aufruf in
`UserInterfaceComponent.ngOnInit()` lädt also nur die Controls-Config doppelt — und legt sie in
`configStorageService.controlsConfig` ab, während der Startup sie bereits nach
`window.__env.controlsConfig` geschrieben hat: **zwei Quellen für dieselbe Config**, die
auseinanderlaufen können.

- [x] Wirkungslose Aufrufe entfernen oder `getConfigs()` ganz streichen
- [x] Eine einzige Quelle für die Controls-Config festlegen (idealerweise via `EnvConfigService`)

> **Status (2026-07-20, erledigt):** `ConfigStorageService.getConfigs()` und die
> `controlsConfig`-Instanzvariable sind entfernt; der wirkungslose Aufruf in
> `UserInterfaceComponent.ngOnInit()` ist gestrichen. `ElementVisibilityHelperService` liest
> Controls-Config jetzt ausschließlich über `EnvConfigService.controlsConfig`
> (`window.__env.controlsConfig`, von `StartupService` befüllt) statt über die separate, nie
> aktuell gehaltene Service-Property — es gibt jetzt nur noch eine Quelle. `getControlsConfig()`
> ist zu einem reinen `Observable`-Getter geworden (analog zu `getAppConfig()` /
> `getKeycloakConfig()`); die einzige verbliebene Aufruferin, `admin-controls-config.component.ts`,
> subscribed jetzt explizit über `firstValueFrom(...)`, statt sich auf eine implizite
> Service-Property zu verlassen.

### 6. Keycloak-Config wird bis zu dreimal geholt

1. `StartupService.fetchJsonConfig()` → `window.__env.keycloakConfig`
2. `new Keycloak(url)` in `auth.service.ts:22` lässt keycloak-js dieselbe URL nochmal fetchen
3. ggf. `KeycloakHelperService.init()`

Dem Keycloak-Konstruktor kann direkt das bereits geladene Config-Objekt übergeben werden — spart
einen Netzwerk-Roundtrip in der blockierenden Startphase.

- [x] Geladenes Config-Objekt an den Keycloak-Konstruktor übergeben

> **Status (2026-07-20, erledigt):** `AuthService.initKeycloak()` erzeugt den Adapter jetzt über
> `createKeycloakAdapter()`: Ist `window.__env.keycloakConfig` bereits vom `StartupService` geladen,
> wird ein `KeycloakConfig`-Objekt (`{ url, realm, clientId }`) aus dem Installation-Format
> (`auth-server-url` / `realm` / `resource`) gebaut und an `new Keycloak(...)` übergeben — damit
> entfällt der zweite Fetch derselben `keycloak.json` durch `keycloak-js` in der blockierenden
> Startphase. Fehlt die Config (Fetch fehlgeschlagen), bleibt der bisherige URL-Fallback erhalten,
> bei dem `keycloak-js` die Config selbst lädt. (Der `KeycloakHelperService.init()`-Aufruf holt
> ohnehin nur Rollen, nicht die Config, und nutzt bei vorhandener Config keinen weiteren Fetch.)

### 7. Obsoleter Browser-Check

`MainComponent.checkBrowser()` warnt vor IE 9/10/11 und Legacy-Edge. Angular 21 läuft auf keinem
davon; der Code ist toter Ballast.

- [x] `checkBrowser()` entfernen

> **Status (2026-07-20, erledigt):** `checkBrowser()` samt der IE-/Legacy-Edge-Warnungen entfernt.
> Da `ngOnInit()` dadurch leer wurde, ist auch das `OnInit`-Implement und der Import weggefallen —
> `MainComponent` ist jetzt eine reine Shell mit `<router-outlet>`.

---

## Modernisierung / Cleanup

### 8. `APP_INITIALIZER` ist deprecated

Seit Angular 19 wird `provideAppInitializer()` empfohlen. Kleiner, sauberer Umbau in
`app.module.ts` (inkl. Wegfall der Factory-Funktion `initializeApp`).

- [x] Auf `provideAppInitializer()` umstellen

> **Status (2026-07-20, erledigt, zusammen mit Punkt 13):** Das `APP_INITIALIZER`-Multi-Provider-
> Objekt und die Factory `initializeApp` sind entfallen. In der neuen `app.config.ts` steht
> stattdessen `provideAppInitializer(() => inject(StartupService).initApp())`. Das Verhalten
> (Rendering blockiert bis `initApp()` fertig) bleibt identisch.

### 9. Globales `console.log`-Patching

`initEnvVariables()` ersetzt `window.console.log` durch eine No-op, wenn `enableDebug` fehlt. Das
unterdrückt auch Logs von Drittbibliotheken und erschwert Support-Fälle.

- [ ] Schmalen Logger-Service einführen statt `window.console` zu patchen

### 10. Auskommentierter Code in `UserInterfaceComponent.ngOnInit()`

`kommonitorShareHelperService.init()`, `openInfoModal()`, `openReportingModal()` liegen als
Kommentar-Leichen herum.

- [x] Ticket anlegen oder löschen

> **Status (2026-07-20, erledigt):** Die auskommentierten Zeilen (`kommonitorShareHelperService.init()`,
> der `openInfoModal()`-Block und `openReportingModal()`) in `UserInterfaceComponent.ngOnInit()`
> sind gelöscht. Die Methoden `openInfoModal()` / `openReportingModal()` selbst bleiben unangetastet.

### 11. Direkte `window.__env`-Zugriffe

Bereits in `PROPOSED_CHANGES.md` (Z. 277) erfasst: verbleibende direkte Zugriffe auf
`EnvConfigService` umstellen, damit Config-Zugriffe typisiert und testbar sind.

- [ ] Direkte `window.__env`-Reads migrieren (siehe `PROPOSED_CHANGES.md`)

### 13. `MainComponent` / `AppModule` → Standalone-Bootstrap

`MainComponent` ist inzwischen eine reine Shell: Ihr Template enthält nur noch `<router-outlet>`
(nach Entfernen von `checkBrowser()`, Punkt 7). Sie existiert nur noch, weil das NgModule-Setup
eine Root-Komponente braucht — `app.module.ts` referenziert sie in `bootstrap: [MainComponent]`,
`index.html` in `<app-main>`. Weil sie zudem in `declarations: [...]` deklariert ist, muss sie
explizit `standalone: false` tragen (seit Angular 19 ist `standalone: true` der Default) — der
Kommentar `// TODO:_ resolve this later` markiert genau das.

Fernziel wäre die vollständige Standalone-Migration: weg von `AppModule` hin zu
`bootstrapApplication(...)` + `provideRouter(...)`. Dann entfielen sowohl das explizite
`standalone: false` als auch die `MainComponent` als eigene Shell (der Router-Outlet würde direkt
in der gebooteten Wurzel sitzen). Das ist ein größerer, eigenständiger Strang und hängt mit
Punkt 8 (`provideAppInitializer()`) zusammen, der ohnehin Teil eines Standalone-Umbaus wäre.

- [x] `MainComponent` + `AppModule` auf Standalone-Bootstrap umstellen (gekoppelt an Punkt 8)

> **Status (2026-07-20, erledigt):** `AppModule` (`app.module.ts`) ist gelöscht. `main.ts`
> bootstrapped jetzt via `bootstrapApplication(MainComponent, appConfig)`; die Provider liegen in
> der neuen `app.config.ts` (`provideRouter(routes)` statt `RouterModule.forRoot`,
> `provideAppInitializer(...)` statt `APP_INITIALIZER`, `provideHttpClient` + `AuthInterceptor`,
> `provideZoneChangeDetection`, und `importProvidersFrom(TranslateModule.forRoot({...}))`).
> `MainComponent` ist jetzt standalone (`imports: [RouterOutlet]`, kein `standalone: false` mehr,
> `// TODO:_ resolve this later` entfernt). Der `MainComponent`-Spec nutzt jetzt `imports` +
> `provideRouter([])` statt `declarations`.
>
> Die zahlreichen wirkungslosen Komponenten-Imports des alten `AppModule` (Sidebar, Legend,
> UserLogin, Color-/Date-/Line-Pattern-Picker, ag-grid, DragDrop, Ngb-Accordion usw.) wurden dabei
> **nicht** übernommen — die routing-geladenen Feature-Komponenten (`UserInterfaceComponent`,
> `AdminComponent`) sind standalone und importieren ihre Abhängigkeiten selbst. Ebenso ist
> `OrderByPipe` nicht übernommen: Er wurde in `AppModule` deklariert, aber in keinem lebenden
> Template genutzt (nur in HTML-Kommentaren / legacy `ng-options`-Attributen). Build, Tests (243)
> und Lint bleiben grün.
>
> **Nachtrag (2026-07-20):** Die dadurch verwaiste Datei `app/pipes/order-by.pipe.ts` wurde
> gelöscht (Build/Tests/Lint weiterhin grün).

---

## Wahrnehmung / UX

### 12. Kein Splash-Screen

`index.html` enthält nur `<app-main>`. Während der gesamten blockierenden Kette
(Config-Storage-JSON → 4 Configs → Keycloak `check-sso`) sieht der Nutzer eine leere Seite. Ein
statischer Lade-Hinweis direkt im `index.html` (den Angular beim Bootstrap ersetzt) wäre billig und
würde die gefühlte Startzeit deutlich verbessern.

- [x] Statischen Splash-Screen in `index.html` ergänzen

> **Status (2026-07-20, erledigt):** `index.html` zeigt jetzt einen statischen Splash (Spinner +
> „KomMonitor" + „Anwendung wird geladen …") zwischen `<app-main>…</app-main>`. Angular ersetzt
> den Host-Inhalt beim Bootstrap, der Splash räumt sich also selbst weg; scheitert der Start, greift
> die Fehlerseite aus Punkt 1 (überschreibt den Body). Reines Inline-CSS/HTML ohne externe
> Ressourcen (läuft vor dem Bootstrap), Spinner-Stil an der `loading-overlay`-Komponente
> orientiert, mit `prefers-reduced-motion`-Fallback.
