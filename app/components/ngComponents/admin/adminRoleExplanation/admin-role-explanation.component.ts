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

  private decodeHtmlEntities(text: string): string {
    const decoded = new DOMParser().parseFromString(text, 'text/html').body.textContent;
    return decoded || text;
  }

  leftColumnItems: AccordionItem[] = [
    {
      title: this.decodeHtmlEntities('Was ist ein Mandant?'),
      content: `KomMonitor erlaubt das Anlegen unterschiedlicher Gruppen, um Verwaltungstrukturen
      abzubilden und Zugriffsrechte dediziert zu vergeben.
      <br>
      Eine KomMonitor Gruppe kann durch den KomMonitor Superadministrator als Mandant
      gekennzeichnet werden.

      Wie ein Wurzelknoten in einem Hierarchie-Baum dient dieser Mandant dazu, weitere Untergruppen
      abzubilden.

      <br>
      <br>
      In einer KomMonitor Instanz k&ouml;nnen mehrere Mandanten unabh&auml;ngig voneinander angelegt
      werden,
      um jeweils eigene, voneinander getrennte Untergruppenhierarchien, Raumebenen und Datens&auml;tze
      zu verwalten.`,
      expanded: false
    },
    {
      title: this.decodeHtmlEntities('Was sind Untergruppen eines Mandanten?'),
      content: `Innerhalb eines Mandanten k&ouml;nnen optional beliebig viele Untergruppen erzeugt werden,
      W&auml;hrend eine Mandantengruppe alleine bereits ausreicht, um Datens&auml;tze
      vollumf&auml;nglich in KomMonitor zu verwalten,
      erlaubt das Erstellen weiterer Untergruppen-Hierarchien eine feingranulare Aufteilung von
      Zust&auml;ndigkeiten und gezielteren Datensatzfreigaben innerhalb der Verwaltung.

      <br><br>
      Eine Untergruppe kann dabei auch von &uuml;bergeordneten Gruppen hinsichtlich Usern, Ressourcen
      und Themen mitadministriert werden - je nach gesetzten Rechten.`,
      expanded: false
    },
    {
      title: this.decodeHtmlEntities('Was ist die Eigent&uuml;merschaft an Datens&auml;tzen?'),
      content: `Bei der Erstellung neuer Raumeinheiten, Indikatoren und Georessourcen ist die Angabe
      erforderlich, welche Gruppe Eigent&uuml;mer der Ressource ist.
      <br>
      <br>
      Eine Ressource kann dabei nur genau einer Gruppe geh&ouml;ren. Nur Mitglieder der
      Eigent&uuml;mer-Gruppe einer Ressource besitzen das Recht, die Datenfreigabe des Datensatzes zu
      kontrollieren sowie eine Ressource zu l&ouml;schen.`,
      expanded: false
    },
    {
      title: this.decodeHtmlEntities('Wie erfolgt die gruppenspezifische Freigabe eines Datensatzes?'),
      content: `Mitglieder der Eigent&uuml;mer-Gruppe eines Datensatzes (Raumeinheit, Indikator oder
      Georessource) haben immer vollen Zugriff auf die Ressource (lesen, editieren, l&ouml;schen).

      <br>
      <br>
      Schon beim Anlegen einer Ressource legen Mitglieder der Eigent&uuml;mer-Gruppe in Schritt
      <code>Zugriffsschutz und Eigent&uuml;merschaft</code> fest, welchen
      anderen Gruppen Lese- und Editierrechte einger&auml;umt werden.
      In einer tabbellarischen Form werden dazu entsprechende H&auml;kchen bei den zutreffenden
      Gruppenzeilen gesetzt.

      <br>
      <br>
      Eine nachtr&auml;gliche &Auml;nderung ist jederzeit im jeweiligen Ressourcenverwaktungsmen&uuml;
      mit der Schaltfl&auml;che <code>Zugriffsschutz und Eigent&uuml;merschaft</code> und in den
      dortigen Untermen&uuml;s m&ouml;glich. Anpassungen sind erst g&uuml;ltig, wenn der
      <code>Aktualisieren</code> Button bet&auml;tigt wird.`,
      expanded: false
    },
    {
      title: this.decodeHtmlEntities('Wie funktioniert die Datenfreigabe von Indikatoren f&uuml;r bestimmte Raumeinheiten?'),
      content: `Bei der Freigabe (Lesen, Editieren) von Indikatoren gelten besondere Regeln.

						Grunds&auml;tzlich unterscheidet KomMonitor bei Indikatoren zwischen der <i>Freigabe ihrer
							Metadaten</i> und der <i>Freigabe konkreter Zeitreihen auf konkreten verkn&uuml;pften
							Raumeinheiten</i>. So ist es bspw. konfigurierbar, den Indikator bezogen auf dessen
						Metadaten sowie Zeitreihen ausgew&auml;hlter Raumeinheiten &ouml;ffentlich freizugeben,
						w&auml;hrend Zeitreihen sehr kleinr&auml;umiger Raumeinheiten nur der internen Verwaltung zur
						Verf&uuml;gung stehen sollen.

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
          title: this.decodeHtmlEntities('Szenario Indikator nicht &ouml;ffentlich'),
          content: `<table class="table">
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
											Schalter <code>&Ouml;ffentliche Lesefreigabe</code> deaktivieren
										</td>
										<td>
											<i>pro Raumeinheit:</i>
											<br>
											explizite Freigabe an relevante Gruppen (Lesen, Schreiben)

											<i>unterschiedliche Konfigurationen je nach Raumeinheit denkbar</i>
										</td>
										<td>
											Lesezugriff auf Raumeinheiten-Metadaten selbst muss analog f&uuml;r alle
											relevanten Gruppen freigegeben werden.
										</td>
									</tr>
								</table>`,
          expanded: false
        },
        {
          title: this.decodeHtmlEntities('Szenario Indikator teilweise &ouml;ffentlich'),
          content: `<table class="table">
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
											Schalter <code>&Ouml;ffentliche Lesefreigabe</code> aktivieren
										</td>
										<td>
											<i>pro Raumeinheit:</i>
											<br>
											<li>f&uuml;r alle Raumeinheiten mit &ouml;ffentlichem Zugriff aktivieren der
												<code>&Ouml;ffentliche Lesefreigabe</code> (weitere explizite Freigabe
												an Gruppen nur bei Bedarf zwecks Editierrechten)
											</li>
											<li>f&uuml;r interne Raumeinheiten
												<code>&Ouml;ffentliche Lesefreigabe</code> deaktivieren &dash;
												stattdessen nur explizite Freigabe an relevante Gruppen (Lesen,
												Schreiben)
											</li>

											<i>unterschiedliche Konfigurationen je nach Raumeinheit denkbar</i>
										</td>
										<td>
											<i><code>&ouml;ffentlicher Lesezugriff</code> f&uuml;r bestimmte
												Raumeinheiten-Metadaten aktivieren</i>
											<i>interner gesch&uuml;tzter Lesezugriff auf sonstige
												Raumeinheiten-Metadaten muss analog
												f&uuml;r alle
												relevanten Gruppen explizit freigegeben werden.
											</i>
										</td>
									</tr>
								</table>`,
          expanded: false
        },
        {
          title: this.decodeHtmlEntities('Szenario Indikator komplett &ouml;ffentlich'),
          content: `<table class="table">
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
											Schalter <code>&Ouml;ffentliche Lesefreigabe</code> aktivieren
										</td>
										<td>
											f&uuml;r alle Raumeinheiten aktivieren der
											<code>&Ouml;ffentliche Lesefreigabe</code> (weitere explizite Freigabe
											an Gruppen nur bei Bedarf zwecks Editierrechten)

											<i>unterschiedliche Konfigurationen je nach Raumeinheit denkbar</i>
										</td>
										<td>
											<code>&ouml;ffentlicher Lesezugriff</code> bei betreffenden
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
      title: this.decodeHtmlEntities('Wie werden neue Mandanten angelegt?'),
      content: `<i>
        <ol type="1">
          <li>
            Einloggen als User mit KomMonitor Superadministrator-Rechten (Rolle
            <code>kommonitor-creator</code>)
          </li>
          <li>
            Zu Menu Gruppenverwaltung navigieren und Schaltfl&auml;che <code>Erstellen</code>
            klicken
          </li>
          <li>
            Beim Anlegen der neuen Gruppe den Haken f&uuml;r die
            Mandanteneigenschaft
            setzen
          </li>
          <li>
            Restliche Metadaten angeben und Gruppe erstellen.
          </li>
          <li>
            Damit die neue Gruppe sich selbst (und ggf. Untergruppen) verwalten darf,
            m&uuml;ssen ihr noch entsprechende Rechte gegeben werden.
            dazu in der Gruppenverwaltung in der &Uuml;bersichtstabelle die Schaltfl&auml;che
            <code>Gruppenspezifische Rechte editieren</code> klicken. Im entsprechenden
            Men&uuml; in Schritt <code>2 - Rechte anderer</code> mindestens die Rechte zur
            Verwaltung von Usern, Ressourcen und Themen für <code>diese Gruppe</code> setzen.
            <br><br>
            Das Setzen eines <code>Untergruppen</code> H&auml;kchens erwirkt, dass diese Gruppe
            auch alle
            ihre Untergruppen bez&uuml;glich Usern, Themen oder Ressourcen mitadministrieren
            darf.
          </li>
          <li>
            Mandantenadministrator-User in Keycloak anlegen und der gleichnamigen Keycloak
            Gruppe zuweisen.
          </li>
        </ol>
      </i>
      <br>
      Ab diesem Zeitpunkt ist der neue Mandant handlungsf&auml;hig. Mandantenadministratoren haben
      die Rechte,
      innerhalb eines Mandanten weitere Untergruppen, User und Datens&auml;tze zu erzeugen.`,
      expanded: false
    },
    {
      title: this.decodeHtmlEntities('Wie werden neue Untergruppen erstellt?'),
      content: `<i>
        <ol type="1">
          <li>
            Einloggen als Mitglied-User einer Obergruppe mit User-Verwaltungsrechten
          </li>
          <li>
            Zu Menu Gruppenverwaltung navigieren und Schaltfl&auml;che <code>Erstellen</code>
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
            optional: Im Untermen&uuml; <code>2 - Rechte anderer</code> festlegen, ob bereits
            existierende andere Gruppen administrative Aufgaben f&uuml;r die neue Untergruppe
            &uuml;bernehmen sollen.

            <br><br>
            Wenn die Obergruppe all ihre Untergruppen mitverwalten darf, muss dies hier nicht
            noch einmal explizit gesetzt werden.
          </li>
          <li>
            optional:
            Wenn auch die Untergruppe ausgew&auml;hlte administrative Aufgaben für sich selbst
            (und ggf. weitere Untergruppen) &uuml;bernehmen soll,
            m&uuml;ssen ihr noch entsprechende Rechte gegeben werden.
            Dazu in der Gruppenverwaltung in der &Uuml;bersichtstabelle die Schaltfl&auml;che
            <code>Gruppenspezifische Rechte editieren</code> klicken. Im entsprechenden
            Men&uuml; in Schritt <code>2 - Rechte anderer</code> alle relevanten Rechte zur
            Verwaltung von Usern, Ressourcen oder Themen für <code>diese Gruppe</code> setzen.
            <br><br>
            Das Setzen eines <code>Untergruppen</code> H&auml;kchens erwirkt, dass diese Gruppe
            auch alle
            ihre Untergruppen bez&uuml;glich Usern, Themen oder Ressourcen mitadministrieren
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
      title: this.decodeHtmlEntities('Kann die Eigent&uuml;merschaft ver&auml;ndert werden?'),
      content: `Ja, Superadministratoren mit der Rolle <code>kommonitor-creator</code> sowie Mitgliedern der
      Eigent&uuml;mer-Gruppe ist es m&ouml;glich, die Eigent&uuml;merstellung an eine andere
      existierende Gruppe zu &uuml;bertragen.

      <i>
        <ol type="1">
          <li>
            Einloggen als Mitglied-User der Eigent&uuml;mer-Gruppe
          </li>
          <li>
            Zur Ressourcenverwaltung navigieren (Raumeinheiten, Indikatoren oder Georessourcen)
            und Schaltfl&auml;che
            <code>Zugriffsschutz und Eigent&uuml;merschaft editieren</code>
            klicken
          </li>
          <li>
            Im Untermen&uuml; <code>3 - Eigent&uuml;merschaft</code> die neue Gruppe selektieren
            und die Eigent&uuml;merschaft via Schaltfl&auml;che <code>Aktualisieren</code>
            unwiederuflich abtreten.
          </li>
        </ol>
      </i>`,
      expanded: false
    },
    {
      title: this.decodeHtmlEntities('Wie erfolgt die &ouml;ffentliche Freigabe von Datens&auml;tzen?'),
      content: `&Auml;hnlich wie bei der gruppenspezifischen Freigabe von Datens&auml;tzen ist es nur
      Mitgliedern der Eigent&uuml;mer-Gruppe eines Datensatzes (Raumeinheit, Indikator oder
      Georessource) gestattet, einen &ouml;ffentlichen Lesezugriff auf die Ressource einzurichten.

      <br>
      <br>
      Schon beim Anlegen einer Ressource legen Mitglieder der Eigent&uuml;mer-Gruppe in Schritt
      <code>Zugriffsschutz und Eigent&uuml;merschaft</code> durch den Schalter
      <code>&Ouml;ffentliche Lesefreigabe</code> explizit fest, ob der Datensatz auch ohne User-Login
      abgerufen werden darf.

      <br>
      <br>
      Eine nachtr&auml;gliche &Auml;nderung ist jederzeit im jeweiligen Ressourcenverwaktungsmen&uuml;
      mit der Schaltfl&auml;che <code>Zugriffsschutz und Eigent&uuml;merschaft</code> und in den
      dortigen Untermen&uuml;s m&ouml;glich. Anpassungen sind erst g&uuml;ltig, wenn der
      <code>Aktualisieren</code> Button bet&auml;tigt wird.`,
      expanded: false
    }
  ];

  constructor() {}

  toggleAccordion(item: AccordionItem): void {
    item.expanded = !item.expanded;
  }
} 