export const environment = {
    production: false,
    appTitle: "KomMonitor (Pilotversion)",
    localStoragePrefix: "kommonitor-develop",
    enableDebug: true,
    enableKeycloakSecurity: true,
    keycloakKomMonitorAdminRoleName: "kommonitor-creator",
    isAdvancedMode: true,
    showAdvancedModeSwitch: true,
    encryption: {
        enabled: false,
        password: "password",
        ivLength_byte: 16
    },
    /*
    PROPERTIES used within greetings window (infoModal component)
    to insert custom LOGO by URL with custom width
    and adjust individual information text
    as well as contact information
    */
    customLogoURL: "data:image/pngbase64,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::",
    customLogo_onClickURL: "https://www.hochschule-bochum.de/fbg/forschung-und-entwicklung/kommonitor/",
    customLogoWidth: "35px",
    customGreetingsContact_name: "Christian Danowski-Buhren",
    customGreetingsContact_organisation: "Hochschule Bochum, Fachbereich Geod&auml,sie",
    customGreetingsContact_mail: "christian.danowski-buhren@hs-bochum.de",
    customGreetingsTextInfoMessage: "",
    /*
    PROPERTIES used within special modal (spatialUnitNotification component)
    to show a customizable HTMLText only when user selects a certian spatial unit for any indicator
    */
    enableSpatialUnitNotificationSelection: false,
    enableSpatialUnitNotificationButton: false,
    spatialUnitNotificationSelection: ["Baublockebene"],
    spatialUnitNotificationTitle: "Informationsverlust auf kleinräumigen Ebenen (Bau- und Mittelblock)",
    spatialUnitNotificationMessage: "Alle Daten, die im KomMonitor dargestellt werden, halten die statistische Geheimhaltung ein. Das bedeutet, dass Angaben zu einzelnen Personen nicht offengelegt werden, insbesondere auch, wenn aus aggregierten Werten Rückschlüsse zu Einzelangaben ermöglicht werden. Aus diesem Grund werden Indikatorenwerte, die in einem räumlichen Aggregat eine absolute Fallzahl von < 3 Einwohnern aufweisen, so behandelt, als hätten diese 0 Einwohner.\
  Diese Methode der statistischen Geheimhaltung kann zu einem teilweise hohen Informationsverlust auf kleinräumigen Ebenen führen. Stark differenzierte Indikatoren auf kleinräumigen Ebenen, die insgesamt nur wenige Fallzahlen aufweisen, könnten so an vielen Stellen entsprechend bereinigt worden seien und somit keine validen Werte liefern. \
  Dies lässt sich daran erkennen, dass die Fallzahlen insgesamt niedrig sind und viele Gebiete 0-Werte haben. Eine flächendeckendes Bild ist somit nicht möglich. \
  Dennoch bieten diese Indikatoren trotz ungenauer Wertedie Möglichkeit, „Hot-Spots“ und „Cluster“ der jeweiligen Indikatoren zu ermitteln. \
  Zahlen auf kleinräumige Ebenen sollten vor diesem Hintergrund vorsichtig und sorgfältig interpretiert werden.",
    /*
    PROPERTIES used within extended info  modal (second tab) to show a customizable HTMLText
    */
    enableExtendedInfoModal: false,
    standardInfoModalTabTitle: "Informationen zu KomMonitor",
    extendedInfoModalTabTitle: "Weitere Informationen",
    extendedInfoModalHTMLMessage: "",
    // property names of feature id and name (relevant for all spatial features) - KomMonitor specific
    // DO NOT CHANGE THEM - ONLY IF YOU REALLY KNOW WHAT YOU ARE DOING
    FEATURE_ID_PROPERTY_NAME: "ID",
    FEATURE_NAME_PROPERTY_NAME: "NAME",
    VALID_START_DATE_PROPERTY_NAME: "validStartDate",
    VALID_END_DATE_PROPERTY_NAME: "validEndDate",
    indicatorDatePrefix: "DATE_",
};
//# sourceMappingURL=env_backup.js.map