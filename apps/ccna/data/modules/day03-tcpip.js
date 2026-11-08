/* Original CCNA Day 03 subsection extracted verbatim from legacy.html.
 * Original video/source and technical accuracy still require author review.
 * Runtime bridge reads this module without deleting/importing historical cards.
 */
(() => { 'use strict';
const payload = {
  "schemaVersion": 1,
  "sectionId": "model-tcp-ip",
  "subsectionId": "piec-warstw-tcp-ip",
  "origin": "existing-legacy-exact-snapshot",
  "sourceReview": "NOT_RUN_VIDEO",
  "data": {
    "id": "piec-warstw-tcp-ip",
    "title": "Pięciowarstwowy model TCP/IP",
    "description": "Zadania warstw od fizycznej do aplikacji oraz urządzenia i adresy działające na każdej z nich.",
    "type": "learning-subsection",
    "note": "<div class=\"study-note\"><div class=\"note-lead\"><strong>Model używany w kursie:</strong> 5. aplikacji, 4. transportowa, 3. internetowa/sieciowa, 2. sieci lokalnej/łącza danych, 1. fizyczna.</div>\n<h4>Warstwa 5 — aplikacji (Application layer)</h4><p>Tworzy, formatuje i interpretuje dane wymieniane między procesami aplikacji. Przykłady: HTTP/HTTPS, FTP, TFTP i protokoły poczty elektronicznej. Działa głównie na hostach końcowych.</p>\n<h4>Warstwa 4 — transportowa (Transport layer)</h4><p>Zapewnia komunikację proces–proces (process-to-process) lub usługa–usługa (service-to-service). Używa <strong>numerów portów (port numbers)</strong>, np. 80 dla serwera WWW oraz 21 dla serwera plików w przykładzie z przykładu. Najważniejsze protokoły: TCP i UDP.</p>\n<h4>Warstwa 3 — internetowa (Internet layer), często nazywana sieciową (Network layer)</h4><p>Zapewnia komunikację host–host (host-to-host) przez wiele sieci. Używa adresów IP (IP addresses), a routery kierują pakiety ku hostowi docelowemu. Protokoły: IPv4, IPv6 oraz ICMP.</p>\n<h4>Warstwa 2 — sieci lokalnej (Local Network layer), często nazywana łączem danych (Data Link layer)</h4><p>Zapewnia dostarczenie skok–skok (hop-to-hop) w obrębie lokalnego połączenia. Używa adresów MAC (MAC addresses), ramek i przełączników. Najważniejsze technologie: Ethernet i Wi-Fi.</p>\n<h4>Warstwa 1 — fizyczna (Physical layer)</h4><p>Przesyła bity jako sygnały elektryczne, optyczne albo radiowe. Obejmuje przewody, włókna, fale radiowe, złącza i nadajniki-odbiorniki (transceivers).</p>\n<div class=\"note-table-wrap\"><table class=\"note-table\"><thead><tr><th>Warstwa</th><th>Główna identyfikacja</th><th>Dostarczenie</th><th>Przykłady</th></tr></thead><tbody><tr><td>5 Aplikacji</td><td>dane aplikacji</td><td>aplikacja–aplikacja</td><td>HTTP, HTTPS, FTP</td></tr><tr><td>4 Transportowa</td><td>port</td><td>proces–proces</td><td>TCP, UDP</td></tr><tr><td>3 Internetowa</td><td>adres IP</td><td>host–host</td><td>IPv4, IPv6, ICMP</td></tr><tr><td>2 Sieci lokalnej</td><td>adres MAC</td><td>hop-to-hop</td><td>Ethernet, Wi-Fi</td></tr><tr><td>1 Fizyczna</td><td>sygnał i medium</td><td>bit przez łącze</td><td>UTP, światłowód, radio</td></tr></tbody></table></div></div>",
    "questions": [
      {
        "id": "tcp-07",
        "question": "Która warstwa odpowiada za formatowanie i interpretowanie danych aplikacji?",
        "answer": "Warstwa aplikacji.",
        "answers": [
          "Warstwa aplikacji.",
          "Warstwa fizyczna.",
          "Warstwa internetowa.",
          "Warstwa łącza danych."
        ]
      },
      {
        "id": "tcp-08",
        "question": "Która warstwa używa numerów portów do identyfikowania procesów?",
        "answer": "Warstwa transportowa.",
        "answers": [
          "Warstwa transportowa.",
          "Warstwa fizyczna.",
          "Warstwa internetowa.",
          "Warstwa sieci lokalnej."
        ]
      },
      {
        "id": "tcp-09",
        "question": "Która warstwa zapewnia komunikację host–host przy użyciu adresów IP?",
        "answer": "Warstwa internetowa, czyli warstwa 3.",
        "answers": [
          "Warstwa internetowa, czyli warstwa 3.",
          "Warstwa aplikacji.",
          "Warstwa transportowa.",
          "Warstwa fizyczna."
        ]
      },
      {
        "id": "tcp-10",
        "question": "Która warstwa zapewnia dostarczenie skok–skok (hop-to-hop) przy użyciu adresów MAC?",
        "answer": "Warstwa sieci lokalnej lub łącza danych, czyli warstwa 2.",
        "answers": [
          "Warstwa sieci lokalnej lub łącza danych, czyli warstwa 2.",
          "Warstwa 5.",
          "Warstwa 4.",
          "Warstwa 1."
        ]
      },
      {
        "id": "tcp-11",
        "question": "Która warstwa przesyła bity (bits) jako sygnały elektryczne, optyczne lub radiowe?",
        "answer": "Warstwa fizyczna.",
        "answers": [
          "Warstwa fizyczna.",
          "Warstwa aplikacji.",
          "Warstwa transportowa.",
          "Warstwa internetowa."
        ]
      },
      {
        "id": "tcp-12",
        "question": "Na której warstwie działają głównie routery podczas przekazywania pakietów?",
        "answer": "Na warstwie 3.",
        "answers": [
          "Na warstwie 3.",
          "Na warstwie 5.",
          "Na warstwie 4.",
          "Wyłącznie na warstwie 1."
        ]
      },
      {
        "id": "tcp-13",
        "question": "Które protokoły są najważniejszymi przykładami warstwy transportowej?",
        "answer": "TCP i UDP.",
        "answers": [
          "TCP i UDP.",
          "IP i ICMP.",
          "Ethernet i Wi-Fi.",
          "HTTP i DNS wyłącznie."
        ]
      },
      {
        "id": "tcp-14",
        "question": "Które technologie są przykładami warstwy 2?",
        "answer": "Ethernet i Wi-Fi.",
        "answers": [
          "Ethernet i Wi-Fi.",
          "TCP i UDP.",
          "IPv4 i IPv6.",
          "HTTP i FTP."
        ]
      }
    ]
  }
};
window.CCNALabLessonModules = (window.CCNALabLessonModules || []).concat([payload]);
})();
