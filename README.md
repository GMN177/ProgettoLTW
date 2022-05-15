# ProgettoLTW - Lyricfy

# Descrizione
Il progetto, svolto per il corso di "Linguaggi e Tecnologie per il Web", consiste in un’applicazione web chiamata "Lyricfy", che permette agli utenti di cercare testi di brani musicali.
L’applicazione prevede che l’utente possa visitare il sito anche senza essere registrato, tuttavia la creazione di un account può permettere all’utente di accedere ad ulteriori funzionalità, quali il salvataggio di un brano tra i preferiti, l’impostazione di un’immagine del profilo e la visualizzazione dell’elenco dei brani salvati.
L’applicazione permette, inoltre, conoscendo lo username di un altro utente, di cercarlo tra gli utenti registrati al sito, dando la possibilità di visualizzare il profilo e anche i brani salvati.
L’utente ha la possibilità di cercare il titolo di un brano nell’apposita barra di ricerca, presente in tutte le pagine dell’applicazione, indipendentemente dalla registrazione al sito.

# Tecnologie Utilizzate
Per la realizzazione del progetto sono state impiegate le seguenti tecnologie:
* HTML e CSS, utilizzati per la parte statica delle pagine web. In tale ambito, per mantenere consistente l’apparenza grafica delle pagine e per rendere il sito "responsive" è stato inoltre utilizzato il framework Bootstrap (Figura 2.1 e
Figura 2.2).
* Javascript è stato usato in vari aspetti dell’applicazione:
    * Lato Client, per rendere dinamiche le varie pagine dell’applicazione, variando così il contenuto, in base a condizioni specifiche. Nello specifico sono state utilizzate varie librerie fra cui JQuery, che permette una semplificata e immediata interazione con il DOM, ed Embedded Javascript, un linguaggio per il templating che consente la modifica del contenuto della pagina utilizzando dati recuperati da database lato server (riga 80 Figura 2.1).
    * Lato Server, grazie al runtime system Node.js, che consente appunto l’utilizzo di Javascript per la creazione di server, consentendo la produzione del contenuto delle pagine web dinamiche, prima che la pagina venga inviata al browser dell’utente.
* PostgreSQL, utilizzato come RDBMS per il progetto. È stato scelto un database relazionale considerata la presenza di dati correlati. PostgreSQL contiene i dati persistenti dell’applicazione (Figura 2.3).
* API, utilizzate per recuperare informazioni (testo, autori e immagini) dei brani, oggetto di ricerca all’interno dell’applicazione.