import { Component } from '@angular/core';

interface AccordionItem {
  title: string;
  content: string;
  expanded: boolean;
  nestedItems?: AccordionItem[];
}

@Component({
  selector: 'app-admin-role-explanation-new',
  templateUrl: './admin-role-explanation.template.html',
  styleUrls: ['./admin-role-explanation.component.css']
})
export class AdminRoleExplanationComponent {
  loadingData = false;

  leftColumnItems: AccordionItem[] = [
    {
      title: $localize`:@@admin.role.explanation.what.is.mandant:Was ist ein Mandant?`,
      content: $localize`:@@admin.role.explanation.mandant.content:KomMonitor erlaubt das Anlegen unterschiedlicher Gruppen, um Verwaltungstrukturen
      abzubilden und Zugriffsrechte dediziert zu vergeben.
      <br>
      Eine KomMonitor Gruppe kann durch den KomMonitor Superadministrator als Mandant
      gekennzeichnet werden.

      Wie ein Wurzelknoten in einem Hierarchie-Baum dient dieser Mandant dazu, weitere Untergruppen
      abzubilden.

      <br>
      <br>
      In einer KomMonitor Instanz können mehrere Mandanten unabhängig voneinander angelegt
      werden,
      um jeweils eigene, voneinander getrennte Untergruppenhierarchien, Raumebenen und Datensätze
      zu verwalten.`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.what.are.subgroups:Was sind Untergruppen eines Mandanten?`,
      content: $localize`:@@admin.role.explanation.subgroups.content:Innerhalb eines Mandanten können optional beliebig viele Untergruppen erzeugt werden,
      Während eine Mandantengruppe alleine bereits ausreicht, um Datensätze
      vollumfänglich in KomMonitor zu verwalten,
      erlaubt das Erstellen weiterer Untergruppen-Hierarchien eine feingranulare Aufteilung von
      Zuständigkeiten und gezielteren Datensatzfreigaben innerhalb der Verwaltung.

      <br><br>
      Eine Untergruppe kann dabei auch von übergeordneten Gruppen hinsichtlich Usern, Ressourcen
      und Themen mitadministriert werden - je nach gesetzten Rechten.`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.ownership:Was ist die Eigentümerschaft an Datensätzen?`,
      content: $localize`:@@admin.role.explanation.ownership.content:Bei der Erstellung neuer Raumeinheiten, Indikatoren und Georessourcen ist die Angabe
      erforderlich, welche Gruppe Eigentümer der Ressource ist.
      <br>
      <br>
      Eine Ressource kann dabei nur genau einer Gruppe gehören. Nur Mitglieder der
      Eigentümer-Gruppe einer Ressource besitzen das Recht, die Datenfreigabe des Datensatzes zu
      kontrollieren sowie eine Ressource zu löschen.`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.group.specific.sharing:Wie erfolgt die gruppenspezifische Freigabe eines Datensatzes?`,
      content: $localize`:@@admin.role.explanation.group.sharing.content:Mitglieder der Eigentümer-Gruppe eines Datensatzes (Raumeinheit, Indikator oder
      Georessource) haben immer vollen Zugriff auf die Ressource (lesen, editieren, löschen).

      <br>
      <br>
      Schon beim Anlegen einer Ressource legen Mitglieder der Eigentümer-Gruppe in Schritt
      <code>Zugriffsschutz und Eigentümerschaft</code> fest, welchen
      anderen Gruppen Lese- und Editierrechte eingeräumt werden.
      In einer tabbellarischen Form werden dazu entsprechende Häkchen bei den zutreffenden
      Gruppenzeilen gesetzt.

      <br>
      <br>
      Eine nachträgliche Änderung ist jederzeit im jeweiligen Ressourcenverwaktungsmenü
      mit der Schaltfläche <code>Zugriffsschutz und Eigentümerschaft</code> und in den
      dortigen Untermenüs möglich. Anpassungen sind erst gültig, wenn der
      <code>Aktualisieren</code> Button betätigt wird.`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.indicator.sharing:Wie funktioniert die Datenfreigabe von Indikatoren für bestimmte Raumeinheiten?`,
      content: $localize`:@@admin.role.explanation.indicator.sharing.content:Bei der Freigabe (Lesen, Editieren) von Indikatoren gelten besondere Regeln.

						Grundsätzlich unterscheidet KomMonitor bei Indikatoren zwischen der <i>Freigabe ihrer
							Metadaten</i> und der <i>Freigabe konkreter Zeitreihen auf konkreten verknüpften
							Raumeinheiten</i>. So ist es bspw. konfigurierbar, den Indikator bezogen auf dessen
						Metadaten sowie Zeitreihen ausgewählter Raumeinheiten öffentlich freizugeben,
						während Zeitreihen sehr kleinräumiger Raumeinheiten nur der internen Verwaltung zur
						Verfügung stehen sollen.

						<br>
						<br>
						Weiterhin ist neben der Freigabe der Indikatoren auch eine passgenaue Freigabe der Raumeinheiten
						zu setzen.

						Im Folgenden werden einige Beispielszenarien unteschieden und durch Einstellhinweise
						verdeutlicht:

						<br>
						<br>`,
      expanded: false,
      nestedItems: [
        {
          title: $localize`:@@admin.role.explanation.scenario.private:Szenario Indikator nicht öffentlich`,
          content: $localize`:@@admin.role.explanation.scenario.private.content:<table class="table">
									<tr>
										<th>
											Indikatoren-Metadaten
										</th>
										<th>
											Indikatoren-Zeitreihe pro Raumebene
										</th>
										<th>
											Raumeinheiten-Metadaten
										</th>
									</tr>
									<tr>
										<td>
											Schalter <code>Öffentliche Lesefreigabe</code> deaktivieren
										</td>
										<td>
											<i>pro Raumeinheit:</i>
											<br>
											explizite Freigabe an relevante Gruppen (Lesen, Schreiben)

											<i>unterschiedliche Konfigurationen je nach Raumeinheit denkbar</i>
										</td>
										<td>
											Lesezugriff auf Raumeinheiten-Metadaten selbst muss analog für alle
											relevanten Gruppen freigegeben werden.
										</td>
									</tr>
								</table>`,
          expanded: false
        },
        {
          title: $localize`:@@admin.role.explanation.scenario.partial:Szenario Indikator teilweise öffentlich`,
          content: $localize`:@@admin.role.explanation.scenario.partial.content:<table class="table">
									<tr>
										<th>
											Indikatoren-Metadaten
										</th>
										<th>
											Indikatoren-Zeitreihe pro Raumebene
										</th>
										<th>
											Raumeinheiten-Metadaten
										</th>
									</tr>
									<tr>
										<td>
											Schalter <code>Öffentliche Lesefreigabe</code> aktivieren
										</td>
										<td>
											<i>pro Raumeinheit:</i>
											<br>
											<li>für alle Raumeinheiten mit öffentlichem Zugriff aktivieren der
												<code>Öffentliche Lesefreigabe</code> (weitere explizite Freigabe
												an Gruppen nur bei Bedarf zwecks Editierrechten)
											</li>
											<li>für interne Raumeinheiten
												<code>Öffentliche Lesefreigabe</code> deaktivieren –
												stattdessen nur explizite Freigabe an relevante Gruppen (Lesen,
												Schreiben)
											</li>

											<i>unterschiedliche Konfigurationen je nach Raumeinheit denkbar</i>
										</td>
										<td>
											<i><code>öffentlicher Lesezugriff</code> für bestimmte
												Raumeinheiten-Metadaten aktivieren</i>
											<i>interner geschützter Lesezugriff auf sonstige
												Raumeinheiten-Metadaten muss analog
												für alle
												relevanten Gruppen explizit freigegeben werden.
											</i>
										</td>
									</tr>
								</table>`,
          expanded: false
        },
        {
          title: $localize`:@@admin.role.explanation.scenario.public:Szenario Indikator komplett öffentlich`,
          content: $localize`:@@admin.role.explanation.scenario.public.content:<table class="table">
									<tr>
										<th>
											Indikatoren-Metadaten
										</th>
										<th>
											Indikatoren-Zeitreihe pro Raumebene
										</th>
										<th>
											Raumeinheiten-Metadaten
										</th>
									</tr>
									<tr>
										<td>
											Schalter <code>Öffentliche Lesefreigabe</code> aktivieren
										</td>
										<td>
											für alle Raumeinheiten aktivieren der
											<code>Öffentliche Lesefreigabe</code> (weitere explizite Freigabe
											an Gruppen nur bei Bedarf zwecks Editierrechten)

											<i>unterschiedliche Konfigurationen je nach Raumeinheit denkbar</i>
										</td>
										<td>
											<code>öffentlicher Lesezugriff</code> bei betreffenden
											Raumeinheiten-Metadaten selbst aktivieren
										</td>
									</tr>
								</table>`,
          expanded: false
        }
      ]
    }
  ];

  rightColumnItems: AccordionItem[] = [
    {
      title: $localize`:@@admin.role.explanation.how.new.mandants.created:Wie werden neue Mandanten angelegt?`,
      content: $localize`:@@admin.role.explanation.how.new.mandants.content:<i>
        <ol type="1">
          <li>
            Einloggen als User mit KomMonitor Superadministrator-Rechten (Rolle
            <code>kommonitor-creator</code>)
          </li>
          <li>
            Zu Menu Gruppenverwaltung navigieren und Schaltfläche <code>Erstellen</code>
            klicken
          </li>
          <li>
            Beim Anlegen der neuen Gruppe den Haken für die
            Mandanteneigenschaft
            setzen
          </li>
          <li>
            Restliche Metadaten angeben und Gruppe erstellen.
          </li>
          <li>
            Damit die neue Gruppe sich selbst (und ggf. Untergruppen) verwalten darf,
            müssen ihr noch entsprechende Rechte gegeben werden.
            dazu in der Gruppenverwaltung in der Übersichtstabelle die Schaltfläche
            <code>Gruppenspezifische Rechte editieren</code> klicken. Im entsprechenden
            Menü in Schritt <code>2 - Rechte anderer</code> mindestens die Rechte zur
            Verwaltung von Usern, Ressourcen und Themen für <code>diese Gruppe</code> setzen.
            <br><br>
            Das Setzen eines <code>Untergruppen</code> Häkchens erwirkt, dass diese Gruppe
            auch alle
            ihre Untergruppen bezüglich Usern, Themen oder Ressourcen mitadministrieren
            darf.
          </li>
          <li>
            Mandantenadministrator-User in Keycloak anlegen und der gleichnamigen Keycloak
            Gruppe zuweisen.
          </li>
        </ol>
      </i>
      <br>
      Ab diesem Zeitpunkt ist der neue Mandant handlungsfähig. Mandantenadministratoren haben
      die Rechte,
      innerhalb eines Mandanten weitere Untergruppen, User und Datensätze zu erzeugen.`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.how.new.subgroups.created:Wie werden neue Untergruppen erstellt?`,
      content: $localize`:@@admin.role.explanation.how.new.subgroups.content:<i>
        <ol type="1">
          <li>
            Einloggen als Mitglied-User einer Obergruppe mit User-Verwaltungsrechten
          </li>
          <li>
            Zu Menu Gruppenverwaltung navigieren und Schaltfläche <code>Erstellen</code>
            klicken
          </li>
          <li>
            Beim Anlegen der neuen Untergruppe die entsprechende Obergruppe (Elterngruppe)
            selektieren
          </li>
          <li>
            Restliche Metadaten angeben und Untergruppe erstellen.
          </li>
          <li>
            optional: Im Untermenü <code>2 - Rechte anderer</code> festlegen, ob bereits
            existierende andere Gruppen administrative Aufgaben für die neue Untergruppe
            übernehmen sollen.

            <br><br>
            Wenn die Obergruppe all ihre Untergruppen mitverwalten darf, muss dies hier nicht
            noch einmal explizit gesetzt werden.
          </li>
          <li>
            optional:
            Wenn auch die Untergruppe ausgewählte administrative Aufgaben für sich selbst
            (und ggf. weitere Untergruppen) übernehmen soll,
            müssen ihr noch entsprechende Rechte gegeben werden.
            Dazu in der Gruppenverwaltung in der Übersichtstabelle die Schaltfläche
            <code>Gruppenspezifische Rechte editieren</code> klicken. Im entsprechenden
            Menü in Schritt <code>2 - Rechte anderer</code> alle relevanten Rechte zur
            Verwaltung von Usern, Ressourcen oder Themen für <code>diese Gruppe</code> setzen.
            <br><br>
            Das Setzen eines <code>Untergruppen</code> Häkchens erwirkt, dass diese Gruppe
            auch alle
            ihre Untergruppen bezüglich Usern, Themen oder Ressourcen mitadministrieren
            darf.
          </li>
          <li>
            Entsprechende User in Keycloak anlegen oder finden und der gleichnamigen Keycloak
            Untergruppe zuweisen.
          </li>
        </ol>
      </i>`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.can.ownership.change:Kann die Eigentümerschaft verändert werden?`,
      content: $localize`:@@admin.role.explanation.can.ownership.change.content:Ja, Superadministratoren mit der Rolle <code>kommonitor-creator</code> sowie Mitgliedern der
      Eigentümer-Gruppe ist es möglich, die Eigentümerstellung an eine andere
      existierende Gruppe zu übertragen.

      <i>
        <ol type="1">
          <li>
            Einloggen als Mitglied-User der Eigentümer-Gruppe
          </li>
          <li>
            Zur Ressourcenverwaltung navigieren (Raumeinheiten, Indikatoren oder Georessourcen)
            und Schaltfläche
            <code>Zugriffsschutz und Eigentümerschaft editieren</code>
            klicken
          </li>
          <li>
            Im Untermenü <code>3 - Eigentümerschaft</code> die neue Gruppe selektieren
            und die Eigentümerschaft via Schaltfläche <code>Aktualisieren</code>
            unwiederuflich abtreten.
          </li>
        </ol>
      </i>`,
      expanded: false
    },
    {
      title: $localize`:@@admin.role.explanation.public.sharing:Wie erfolgt die öffentliche Freigabe von Datensätzen?`,
      content: $localize`:@@admin.role.explanation.public.sharing.content:Ähnlich wie bei der gruppenspezifischen Freigabe von Datensätzen ist es nur
      Mitgliedern der Eigentümer-Gruppe eines Datensatzes (Raumeinheit, Indikator oder
      Georessource) gestattet, einen öffentlichen Lesezugriff auf die Ressource einzurichten.

      <br>
      <br>
      Schon beim Anlegen einer Ressource legen Mitglieder der Eigentümer-Gruppe in Schritt
      <code>Zugriffsschutz und Eigentümerschaft</code> durch den Schalter
      <code>Öffentliche Lesefreigabe</code> explizit fest, ob der Datensatz auch ohne User-Login
      abgerufen werden darf.

      <br>
      <br>
      Eine nachträgliche Änderung ist jederzeit im jeweiligen Ressourcenverwaktungsmenü
      mit der Schaltfläche <code>Zugriffsschutz und Eigentümerschaft</code> und in den
      dortigen Untermenüs möglich. Anpassungen sind erst gültig, wenn der
      <code>Aktualisieren</code> Button betätigt wird.`,
      expanded: false
    }
  ];

  constructor() {}

  toggleAccordion(item: AccordionItem): void {
    item.expanded = !item.expanded;
  }
} 