/* CCNA: Polish explanations, English technical names. See ../TERMINOLOGY.md. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CcnaVocabulary = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const glossary = [
    ['miedziany przewód prosty|miedzianego przewodu prostego|miedzianym przewodem prostym|miedziany kabel prosty', 'copper straight-through cable'],
    ['miedziany przewód krosowany|miedzianego przewodu krosowanego|miedzianym przewodem krosowanym|miedziany kabel krosowany', 'copper crossover cable'],
    ['przewód odwrócony|przewodu odwróconego|przewodem odwróconym|kabel odwrócony|kabla odwróconego', 'rollover cable'],
    ['przewód Ethernet|przewodu Ethernet|przewodem Ethernet|kabel Ethernet|kabla Ethernet', 'Ethernet cable'],
    ['przewód prosty|przewodu prostego|przewodem prostym|przewody proste|przewodów prostych|kabel prosty|kabla prostego|kable proste', 'straight-through cable'],
    ['przewód krosowany|przewodu krosowanego|przewodem krosowanym|przewody krosowane|przewodów krosowanych|kabel krosowany|kabla krosowanego|kable krosowane', 'crossover cable'],
    ['przewód konsolowy|przewodu konsolowego|przewodem konsolowym|kabel konsolowy|kabla konsolowego', 'console cable'],
    ['światłowód jednomodowy|światłowodu jednomodowego|jednomodowy światłowód', 'single-mode fiber (SMF)'],
    ['światłowód wielomodowy|światłowodu wielomodowego|wielomodowy światłowód', 'multimode fiber (MMF)'],
    ['przewód światłowodowy|przewodu światłowodowego|kabel światłowodowy|kabla światłowodowego', 'fiber-optic cable'],
    ['łącze światłowodowe|łącza światłowodowego|połączenie światłowodowe|połączenia światłowodowego', 'fiber-optic link'],
    ['przewód miedziany|przewodu miedzianego|przewodem miedzianym|kabel miedziany', 'copper cable'],
    ['kabel koncentryczny|kabla koncentrycznego|przewód koncentryczny', 'coaxial cable'],
    ['transceivery|transceiverów|transceiverami', 'transceivers'],
    ['światłowodowy|światłowodowe|światłowodowych', 'fiber-optic'],
    ['nieekranowana skrętka|nieekranowaną skrętkę|skrętka nieekranowana|skrętkę nieekranowaną', 'Unshielded Twisted Pair (UTP)'],
    ['ekranowana skrętka|ekranowaną skrętkę|skrętka ekranowana|skrętkę ekranowaną', 'Shielded Twisted Pair (STP)'],
    ['pełny dupleks|pełnego dupleksu|pełnym dupleksie|pełnym dupleksem', 'full-duplex'],
    ['półdupleks|półdupleksu|półdupleksie|półdupleksem', 'half-duplex'],
    ['interfejs wiersza poleceń|interfejsu wiersza poleceń|interfejsem wiersza poleceń', 'command-line interface (CLI)'],
    ['graficzny interfejs użytkownika|graficznego interfejsu użytkownika', 'graphical user interface (GUI)'],
    ['port konsolowy|portu konsolowego|portem konsolowym|porcie konsolowym', 'console port'],
    ['porty konsolowe|portów konsolowych', 'console ports'],
    ['Pula DHCP serwera', 'DHCP pool'],
    ['karta sieciowa|karty sieciowej|kartę sieciową', 'network interface card (NIC)'],
    ['interfejs wyjściowy|interfejsu wyjściowego|interfejsem wyjściowym|interfejsie wyjściowym', 'exit interface'],
    ['interfejs wejściowy|interfejsu wejściowego|interfejsem wejściowym|interfejsie wejściowym', 'incoming interface'],
    ['ramka Ethernet|ramki Ethernet|ramkę Ethernet|ramką Ethernet|ramce Ethernet', 'Ethernet frame'],
    ['ramki Ethernetu|ramka Ethernetu|ramkę Ethernetu', 'Ethernet frame'],
    ['pakiet IP|pakietu IP|pakietem IP|pakiecie IP', 'IP packet'],
    ['pakiet IPv4|pakietu IPv4|pakietem IPv4|pakiecie IPv4', 'IPv4 packet'],
    ['nagłówek Ethernet II|nagłówka Ethernet II|nagłówku Ethernet II', 'Ethernet II header'],
    ['nagłówek Ethernet|nagłówka Ethernet|nagłówku Ethernet|nagłówek Ethernetu', 'Ethernet header'],
    ['nagłówek IPv4|nagłówka IPv4|nagłówku IPv4|nagłówkiem IPv4', 'IPv4 header'],
    ['nagłówek IP|nagłówka IP|nagłówku IP', 'IP header'],
    ['nagłówek TCP|nagłówka TCP|nagłówku TCP', 'TCP header'],
    ['nagłówek transportowy|nagłówka transportowego|nagłówku transportowym', 'transport header'],
    ['punkt dostępowy|punktu dostępowego|punktem dostępowym|punkcie dostępowym', 'access point (AP)'],
    ['punkty dostępowe|punktów dostępowych|punktami dostępowymi', 'access points (APs)'],
    ['kontroler bezprzewodowy|kontrolera bezprzewodowego|kontroler sieci bezprzewodowej|kontrolera sieci bezprzewodowej', 'wireless LAN controller (WLC)'],
    ['przełącznik warstwy 2|przełącznika warstwy 2|przełącznik L2|przełącznika L2', 'Layer 2 switch'],
    ['przełącznik warstwy 3|przełącznika warstwy 3|przełącznik L3|przełącznika L3', 'Layer 3 switch'],
    ['switch warstwy dostępowej|przełącznik dostępowy|przełącznika dostępowego', 'access switch'],
    ['przełącznik wielowarstwowy|przełącznika wielowarstwowego', 'multilayer switch'],
    ['urządzenia końcowe|urządzeń końcowych|urządzeniami końcowymi', 'end devices'],
    ['urządzenie końcowe|urządzenia końcowego|urządzeniu końcowym|urządzeniem końcowym', 'end device'],
    ['adres źródłowy MAC|źródłowy adres MAC|źródłowego adresu MAC|źródłowym adresie MAC', 'source MAC address'],
    ['adres docelowy MAC|docelowy adres MAC|docelowego adresu MAC|docelowym adresie MAC', 'destination MAC address'],
    ['adres źródłowy IP|źródłowy adres IP|źródłowego adresu IP|źródłowym adresie IP', 'source IP address'],
    ['adres docelowy IP|docelowy adres IP|docelowego adresu IP|docelowym adresie IP', 'destination IP address'],
    ['adres MAC źródłowy|adres MAC nadawcy', 'source MAC address'],
    ['adres MAC docelowy|adres MAC odbiorcy', 'destination MAC address'],
    ['adres IP źródłowy|adres IP nadawcy', 'source IP address'],
    ['adres IP docelowy|adres IP odbiorcy', 'destination IP address'],
    ['adres źródłowy|adresu źródłowego|adresem źródłowym|adresie źródłowym', 'source address'],
    ['adres docelowy|adresu docelowego|adresem docelowym|adresie docelowym', 'destination address'],
    ['port źródłowy|portu źródłowego|portem źródłowym', 'source port'],
    ['port docelowy|portu docelowego|portem docelowym', 'destination port'],
    ['porty źródłowy i docelowy|portami źródłowym i docelowym', 'source port i destination port'],
    ['źródłowy i docelowy adres IP|adresy IP źródłowy i docelowy|źródłowy i docelowy adres IPv4', 'source IP address i destination IP address'],
    ['źródłowy i docelowy adres MAC|adresy MAC źródłowy i docelowy', 'source MAC address i destination MAC address'],
    ['tablica adresów MAC|tablicy adresów MAC|tablicę adresów MAC|tablicą adresów MAC|tablice adresów MAC|tablic adresów MAC|tablicach adresów MAC|tablica MAC|tablicy MAC|tablicę MAC|tablicą MAC|tablice MAC|tablic MAC|tablicach MAC', 'MAC address table'],
    ['tablica routingu|tablicy routingu|tablicę routingu|tablicą routingu|tablice routingu|tablic routingu|tablicach routingu|tablicą routingową|tablica tras|tablicy tras|tablicę tras', 'routing table'],
    ['tablica ARP|tablicy ARP|tablicę ARP|tablicą ARP|tablice ARP|tablic ARP|tablicach ARP', 'ARP table'],
    ['brama domyślna|bramy domyślnej|bramę domyślną|bramą domyślną|bramie domyślnej|domyślna brama|domyślnej bramy', 'default gateway'],
    ['trasa domyślna|trasy domyślnej|trasę domyślną|trasą domyślną|trasie domyślnej|trasy domyślne|tras domyślnych', 'default route'],
    ['trasa statyczna|trasy statycznej|trasę statyczną|trasą statyczną|trasie statycznej', 'static route'],
    ['trasy statyczne|tras statycznych|trasach statycznych|trasami statycznymi', 'static routes'],
    ['trasa połączona|trasy połączonej|trasę połączoną|trasa connected', 'connected route'],
    ['trasa lokalna|trasy lokalnej|trasę lokalną', 'local route'],
    ['routing statyczny|routingu statycznego|routingiem statycznym', 'static routing'],
    ['routing dynamiczny|routingu dynamicznego|routingiem dynamicznym', 'dynamic routing'],
    ['następny skok|następnego skoku|następnym skokiem|kolejny skok|kolejnego skoku', 'next hop'],
    ['adres sieci|adresu sieci|adresem sieci|adres sieciowy|adresu sieciowego', 'network address'],
    ['adres rozgłoszeniowy|adresu rozgłoszeniowego|adresem rozgłoszeniowym|adres broadcast|adresu broadcast', 'broadcast address'],
    ['adres hosta|adresu hosta|adresem hosta', 'host address'],
    ['maska podsieci|maski podsieci|maskę podsieci|maską podsieci|masce podsieci|maska sieci|maski sieci|maskę sieci|maską sieci', 'subnet mask'],
    ['maska wildcard|maski wildcard|maskę wildcard|maską wildcard|masce wildcard', 'wildcard mask'],
    ['warstwa aplikacji|warstwy aplikacji|warstwie aplikacji|warstwę aplikacji|warstwą aplikacji', 'Application layer'],
    ['warstwa prezentacji|warstwy prezentacji|warstwie prezentacji|warstwę prezentacji', 'Presentation layer'],
    ['warstwa sesji|warstwy sesji|warstwie sesji|warstwę sesji', 'Session layer'],
    ['warstwa transportowa|warstwy transportowej|warstwie transportowej|warstwę transportową|warstwą transportową', 'Transport layer'],
    ['warstwa sieciowa|warstwy sieciowej|warstwie sieciowej|warstwę sieciową|warstwą sieciową', 'Network layer'],
    ['warstwa internetowa|warstwy internetowej|warstwie internetowej|warstwę internetową', 'Internet layer'],
    ['warstwa łącza danych|warstwy łącza danych|warstwie łącza danych|warstwę łącza danych|warstwą łącza danych', 'Data Link layer'],
    ['warstwa sieci lokalnej|warstwy sieci lokalnej|warstwie sieci lokalnej|warstwę sieci lokalnej', 'Local Network layer'],
    ['warstwa fizyczna|warstwy fizycznej|warstwie fizycznej|warstwę fizyczną|warstwą fizyczną', 'Physical layer'],
    ['adres MAC|adresu MAC|adresem MAC|adresie MAC', 'MAC address'],
    ['adresy MAC|adresów MAC|adresami MAC|adresach MAC', 'MAC addresses'],
    ['adres IP|adresu IP|adresem IP|adresie IP', 'IP address'],
    ['adresy IP|adresów IP|adresami IP|adresach IP', 'IP addresses'],
    ['część sieciowa|części sieciowej|część sieciową', 'network portion'],
    ['część hosta|części hosta|część hostową|część hostowa', 'host portion'],
    ['domena kolizji|domeny kolizji|domenę kolizji|domeną kolizji|domenie kolizji', 'collision domain'],
    ['domeny kolizyjne|domen kolizyjnych|domeny kolizji', 'collision domains'],
    ['domena rozgłoszeniowa|domeny rozgłoszeniowej|domenę rozgłoszeniową|domeną rozgłoszeniową|domenie rozgłoszeniowej', 'broadcast domain'],
    ['domeny rozgłoszeniowe|domen rozgłoszeniowych', 'broadcast domains'],
    ['ładunek użytkowy|ładunku użytkowego|ładunkiem użytkowym', 'payload'],
    ['płaszczyzna danych|płaszczyzny danych', 'data plane'],
    ['płaszczyzna sterowania|płaszczyzny sterowania', 'control plane'],
    ['płaszczyzna zarządzania|płaszczyzny zarządzania', 'management plane'],
    ['listy kontroli dostępu|lista kontroli dostępu', 'Access Control Lists'],
    ['maszyna wirtualna|maszyny wirtualnej|maszynę wirtualną|maszynie wirtualnej', 'virtual machine (VM)'],
    ['maszyny wirtualne|maszyn wirtualnych', 'virtual machines (VMs)'],
    ['uczenie maszynowe|uczenia maszynowego', 'Machine Learning'],
    ['przełączanie Ethernet|przełączania Ethernet|przełączaniu Ethernet|przełączanie w sieci Ethernet', 'Ethernet switching'],
    ['autonegocjacja|autonegocjacji|autonegocjację', 'autonegotiation'],
    ['enkapsulacja|enkapsulacji|enkapsulację|kapsułkowanie|kapsułkowania', 'encapsulation'],
    ['dekapsulacja|dekapsulacji|dekapsulację|dekapsułkowanie|dekapsułkowania', 'decapsulation'],
    ['krosowany|krosowanego|krosowanym', 'crossover cable'],
    ['światłowód|światłowodu|światłowodem|światłowodów|światłowody', 'fiber-optic cable'],
    ['skrętka|skrętki|skrętkę|skrętką|skrętce', 'twisted-pair cable'],
    ['przełącznik', 'switch'],
    ['przełącznika', 'switcha'],
    ['przełącznikiem', 'switchem'],
    ['przełączniku', 'switchu'],
    ['przełącznikowi', 'switchowi'],
    ['przełączniki', 'switche'],
    ['przełączników', 'switchów'],
    ['przełącznikami', 'switchami'],
    ['przełącznikach', 'switchach'],
    ['przełącznikom', 'switchom'],
    ['koncentrator|koncentratora|koncentratorze|koncentratorem', 'hub'],
    ['koncentratory|koncentratorów', 'hubs'],
    ['ruter|rutera|ruterze', 'router'],
    ['ramka|ramki|ramkę|ramką|ramce', 'frame'],
    ['ramek|ramkami|ramkach', 'frames'],
    ['pakiet|pakietu|pakietem|pakiecie', 'packet'],
    ['pakiety|pakietów|pakietami|pakietach', 'packets'],
    ['nagłówek|nagłówka|nagłówku|nagłówkiem', 'header'],
    ['nagłówki|nagłówków|nagłówkami', 'headers'],
    ['ładunek|ładunku|ładunkiem', 'payload'],
    ['stopka|stopki|stopkę|stopką', 'trailer'],
    ['interfejs|interfejsu|interfejsie|interfejsem|interfejsowi', 'interface'],
    ['interfejsy|interfejsów|interfejsach|interfejsami', 'interfaces'],
    ['dupleks|dupleksu|dupleksem|dupleksie', 'duplex'],
    ['serwer|serwera|serwerze|serwerem', 'server'],
    ['serwery|serwerów|serwerami', 'servers'],
    ['przewód|przewodu|przewodem|przewodzie|kabel|kabla|kablem|kablu', 'cable'],
    ['przewody|przewodów|przewodami|przewodach|kable|kabli|kablami', 'cables'],
    ['brama|bramy|bramę|bramą|bramie', 'gateway'],
    ['bramami', 'gateways'],
    ['maska|maski|maskę|maską|masce', 'subnet mask'],
    ['maski sieciowe|maskach|maskami', 'subnet masks'],
    ['zapora|zapory|zaporę|zaporą', 'firewall'],
    ['preambuła|preambuły|preambułę', 'preamble']
  ];
  const terms = new Map();
  for (const [variants, english] of glossary) for (const variant of variants.split('|')) terms.set(variant.toLocaleLowerCase('pl'), english);
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('(?<![\\p{L}\\p{N}_-])(?:' + [...terms.keys()].sort((a, b) => b.length - a.length).map(escape).join('|') + ')(?![\\p{L}\\p{N}_-])', 'giu');
  const frameAdjectives = {
    każda: 'każdy', nowa: 'nowy', standardowa: 'standardowy', odebrana: 'odebrany', ta: 'ten', właściwa: 'właściwy',
    właściwej: 'właściwego', odebranej: 'odebranego', nowej: 'nowego', wejściowej: 'wejściowego', wyjściowej: 'wyjściowego', przekazywanej: 'przekazywanego', wysłanej: 'wysłanego',
    takiej: 'takiego', każdej: 'każdego', danej: 'danego', całej: 'całego', wysyłanej: 'wysyłanego', pierwszej: 'pierwszego', swojej: 'swojego', dowolnej: 'dowolnego', własnej: 'własnego', zewnętrznej: 'zewnętrznego', poprawnej: 'poprawnego', wcześniejszej: 'wcześniejszego', dalszej: 'dalszego',
    minimalną: 'minimalny', nową: 'nowy', inną: 'inny', krótką: 'krótki', uszkodzoną: 'uszkodzony', niezgodną: 'niezgodny', właściwą: 'właściwy', odebraną: 'odebrany', całą: 'cały', każdą: 'każdy', zwykłą: 'zwykły', ostatnią: 'ostatni'
  };
  const frameParticiples = {
    przesyłana: 'przesyłany', przeznaczona: 'przeznaczony', wysyłana: 'wysyłany', odebrana: 'odebrany', dostarczona: 'dostarczony', rozgłaszana: 'rozgłaszany', zawierająca: 'zawierający', została: 'został',
    krótszą: 'krótszy', dłuższą: 'dłuższy', wyjściowa: 'wyjściowy', weszła: 'dotarł', zawierającą: 'zawierający', skierowanej: 'skierowany', tranzytowej: 'tranzytowy', tranzytową: 'tranzytowy', większej: 'większego', zaadresowanej: 'zaadresowanego', tworzonej: 'tworzonego', wysyłanej: 'wysyłanego', wejściowej: 'wejściowy', wyjściowej: 'wyjściowy'
  };
  const frameBefore = new RegExp('(?<![\\p{L}\\p{N}_-])(' + Object.keys(frameAdjectives).join('|') + ') ((?:Ethernet(?: II)? )?frame)(?![\\p{L}\\p{N}_-])', 'giu');
  const frameAfter = new RegExp('\\b(frame) (' + Object.keys(frameParticiples).join('|') + ')(?![\\p{L}\\p{N}_-])', 'giu');
  const preserveCase = (original, value) => /^[A-ZĄĆĘŁŃÓŚŹŻ]/u.test(original) ? value[0].toUpperCase() + value.slice(1) : value;
  function frameAgreement(value) {
    return value
      .replace(frameBefore, (_match, adjective, noun) => preserveCase(adjective, frameAdjectives[adjective.toLocaleLowerCase('pl')]) + ' ' + noun)
      .replace(frameAfter, (_match, noun, participle) => noun + ' ' + frameParticiples[participle.toLocaleLowerCase('pl')])
      .replace(/\b(?:tę|ta) samą ((?:Ethernet )?frame)\b/gi, 'ten sam $1')
      .replace(/\bEthernet frame II\b/g, 'Ethernet II frame')
      .replace(/\bJej header\b/g, 'Jego header')
      .replace(/\bjej header\b/g, 'jego header');
  }
  function prose(value) {
    return value
      .replace(/\b(wszystkie|dwie|trzy|cztery|nowe|kolejne|takie|jakie|standardowe|nieznane) ramki\b/gi, '$1 frames')
      .replace(/\bramki (są|mają|trafiają|przychodzą|zostały|przekazywane|otrzymują)\b/gi, 'frames $1')
      .replace(pattern, match => {
        const english = terms.get(match.toLocaleLowerCase('pl'));
        return /^[A-ZĄĆĘŁŃÓŚŹŻ]/u.test(match) ? english[0].toUpperCase() + english.slice(1) : english;
      })
      .replace(/\b(frame|packet|header|payload|trailer|switch|router|interface|full-duplex|half-duplex|encapsulation|decapsulation)\s*\(\1\)/gi, '$1')
      .replace(/\b(?:twisted-pair cable|Twisted pair), czyli twisted-pair cable/gi, 'twisted-pair cable')
      .replace(/\b(subnet mask)\s*\(netmask\s*\/\s*subnet mask\)/gi, '$1')
      .replace(/\b(command-line interface \(CLI\))\s*\(command-line interface, CLI\)/gi, '$1')
      .replace(/\b(graphical user interface \(GUI\))\s*\(graphical user interface, GUI\)/gi, '$1')
      .replace(/\b(single-mode fiber \(SMF\))\s*\(SMF\)/gi, '$1')
      .replace(/\b(multimode fiber \(MMF\))\s*\(MMF\)/gi, '$1');
  }
  function text(value) {
    if (typeof value !== 'string' || !value) return value;
    if (value === 'Cread, Read, Update, Delete') return 'Create, Read, Update, Delete';
    pattern.lastIndex = 0;
    const hasPolishTerm = pattern.test(value);
    pattern.lastIndex = 0;
    if (!hasPolishTerm) return value;
    // Leave markup, attributes, URLs and IOS commands intact. Only prose is edited.
    return value.split(/(<(?:code|pre)\b[^>]*>[\s\S]*?<\/(?:code|pre)>|<[^>]+>|https?:\/\/[^\s<>]+)/gi)
      .map((part, index) => index % 2 ? part : frameAgreement(prose(part))).join('')
      .replace(/\b(source|destination) (MAC|IP) address\s*\(\1 \2 address\)/gi, '$1 $2 address')
      .replace(/\b((?:Application|Presentation|Session|Transport|Network|Internet|Physical|Data Link|Local Network) layer)\s*\(\1\)/gi, '$1')
      .replace(/\b((?:single-mode|multimode) fiber \((?:SMF|MMF)\)(?:<\/(?:strong|em)>)?), czyli (?:single-mode|multimode) fiber \((?:SMF|MMF)\)/gi, '$1')
      .replace(/\b(?:miedziany|miedzianego|miedzianym) (straight-through|crossover) cable/gi, 'copper $1 cable')
      .replace(/\b(?:Miedziany|miedzianego|miedzianym) (straight-through|crossover) cable \(copper \1 cable\)/gi, 'copper $1 cable')
      .replace(/\bktór(?:a|ej|ą) (?=(?:Ethernet )?frame)\b/gi, match => /^[A-Z]/.test(match) ? 'Który ' : 'który ')
      .replace(/\b(właściwej|odebranej|nowej|wejściowej|wyjściowej|przekazywanej|wysłanej) ((?:Ethernet )?frame)\b/gi, (_m, adjective, noun) => ({właściwej:'właściwego',odebranej:'odebranego',nowej:'nowego',wejściowej:'wejściowego',wyjściowej:'wyjściowego',przekazywanej:'przekazywanego',wysłanej:'wysłanego'}[adjective.toLowerCase()]) + ' ' + noun)
      .replace(/\b(minimalną|nową|inną|krótką|uszkodzoną) ((?:Ethernet )?frame)\b/gi, (_m, adjective, noun) => ({minimalną:'minimalny',nową:'nowy',inną:'inny',krótką:'krótki',uszkodzoną:'uszkodzony'}[adjective.toLowerCase()]) + ' ' + noun)
      .replace(/\btej samej ((?:Ethernet )?frame)\b/gi, 'tego samego $1')
      .replace(/\b(każda|nowa|standardowa|odebrana|ta|właściwa) frame\b/gi, (_m, word) => ({każda:'każdy',nowa:'nowy',standardowa:'standardowy',odebrana:'odebrany',ta:'ten',właściwa:'właściwy'}[word.toLowerCase()] || word) + ' frame')
      .replace(/\bframe (przesyłana|przeznaczona|wysyłana|odebrana|dostarczona|rozgłaszana|zawierająca|została)\b/gi, (_m, word) => 'frame ' + ({przesyłana:'przesyłany',przeznaczona:'przeznaczony',wysyłana:'wysyłany',odebrana:'odebrany',dostarczona:'dostarczony',rozgłaszana:'rozgłaszany',zawierająca:'zawierający',została:'został'}[word.toLowerCase()]))
      .replace(/\bprzesyłana jest frame\b/gi, 'przesyłany jest frame')
      .replace(/\bframe (krótszą|wyjściowa|weszła|zawierającą|skierowanej|tranzytowej)\b/gi, (_m, word) => 'frame ' + ({krótszą:'krótszy',wyjściowa:'wyjściowy',weszła:'dotarł',zawierającą:'zawierający',skierowanej:'skierowany',tranzytowej:'tranzytowy'}[word.toLowerCase()]))
      .replace(/\bframe jest przeznaczona\b/gi, 'frame jest przeznaczony')
      .replace(/\b(takiej|każdej|danej|całej|wysyłanej) ((?:Ethernet )?frame)\b/gi, (_m, adjective, noun) => ({takiej:'takiego',każdej:'każdego',danej:'danego',całej:'całego',wysyłanej:'wysyłanego'}[adjective.toLowerCase()]) + ' ' + noun)
      .replace(/\bEthernet frame i jej pola\b/gi, 'Ethernet frame i jego pola')
      .replace(/\bnie wysyła jej z powrotem\b/gi, 'nie wysyła frame z powrotem')
      .replace(/\b(?:Przekazuje|Rozsyła|Wysyła) ją\b/g, match => match.split(' ')[0] + ' frame')
      .replace(/\b(default gateway|gateway) ostatniej szansy używaną\b/gi, 'gateway of last resort używany')
      .replace(/\bframe ARP Request będącą broadcastem\b/gi, 'frame ARP Request będący broadcastem')
      .replace(/\btrailer służącą\b/gi, 'trailer służący')
      .replace(/\bPayloadem (packet|frame)\b/gi, 'Payload w $1')
      .replace(/\bpayloadem (packet|frame)\b/gi, 'payload w $1')
      .replace(/\b(?:segment \(segment\)|datagram \(datagram\))/gi, match => match.split(' ')[0])
      .replace(/\brollover cable \(rollover cable\)/gi, 'rollover cable');
  }
  const questionPhrases = [
    [/\bnetwork device\b/gi, 'urządzenie sieciowe'], [/\bnetwork devices\b/gi, 'urządzenia sieciowe'],
    [/\bconnection\b/gi, 'połączenie'], [/\bconnections\b/gi, 'połączenia'], [/\bspeed\b/gi, 'szybkość'],
    [/\bcommand\b/gi, 'polecenie'], [/\bcommands\b/gi, 'polecenia'], [/\baddress\b/gi, 'adres'],
    [/\baddresses\b/gi, 'adresy'], [/\binterface\b/gi, 'interface'], [/\binterfaces\b/gi, 'interfaces'],
    [/\bprotocol\b/gi, 'protokół'], [/\bprotocols\b/gi, 'protokoły'], [/\bpurpose\b/gi, 'cel'],
    [/\bdefault\b/gi, 'domyślny'], [/\bsource\b/gi, 'źródłowy'], [/\bdestination\b/gi, 'docelowy'],
    [/\bconfigure\b/gi, 'skonfigurować'], [/\bconfiguration\b/gi, 'konfiguracja'], [/\bverify\b/gi, 'zweryfikować'],
    [/\benabled\b/gi, 'włączony'], [/\bdisabled\b/gi, 'wyłączony'], [/\bpacket\b/gi, 'packet'],
    [/\bframe\b/gi, 'frame'], [/\bswitch\b/gi, 'switch'], [/\brouter\b/gi, 'router'],
    [/\bused for\b/gi, 'używany do'], [/\bused to\b/gi, 'używany do'], [/\bfollowing\b/gi, 'poniższych'],
    [/\bcorrect\b/gi, 'poprawny'], [/\bincorrect\b/gi, 'niepoprawny'], [/\bbest\b/gi, 'najlepszy'],
    [/\bmessage\b/gi, 'komunikat'], [/\bmessages\b/gi, 'komunikaty'], [/\bvalue\b/gi, 'wartość'],
    [/\bvalues\b/gi, 'wartości'], [/\bnumber\b/gi, 'liczba'], [/\blayer\b/gi, 'warstwa'],
    [/\bhost\b/gi, 'host'], [/\bhosts\b/gi, 'hosty'], [/\bserver\b/gi, 'server'], [/\bclient\b/gi, 'client']
  ];
  function translateQuestionTail(value) {
    let result=String(value||'').trim();
    for(const [pattern,replacement] of questionPhrases)result=result.replace(pattern,replacement);
    return result
      .replace(/\bthe\b/gi,'').replace(/\ban\b/gi,'').replace(/\ba\b/gi,'')
      .replace(/\bof\b/gi,'').replace(/\bfor\b/gi,'dla').replace(/\bto\b/gi,'do')
      .replace(/\bin\b/gi,'w').replace(/\bon\b/gi,'na').replace(/\bwith\b/gi,'z')
      .replace(/\s+([?!.,:;])/g,'$1').replace(/\s{2,}/g,' ').trim();
  }
  function polishQuestion(value) {
    const question=String(value||'').trim();
    if(!question)return'';
    let match=/^What is the speed of an? ['"]?([^'"]+)['"]? connection\?$/i.exec(question);
    if(match)return`Jaka jest szybkość połączenia '${match[1]}'?`;
    match=/^What (?:does|do) (.+?) stand for\?$/i.exec(question);
    if(match)return`Jak rozwija się skrót ${match[1]}?`;
    match=/^What is the purpose of (.+?)\?$/i.exec(question);
    if(match)return`Jaki jest cel ${translateQuestionTail(match[1])}?`;
    match=/^What is (.+?)\?$/i.exec(question);
    if(match)return`Czym jest ${translateQuestionTail(match[1])}?`;
    match=/^(?:What are|What were) (.+?)\?$/i.exec(question);
    if(match)return`Czym są ${translateQuestionTail(match[1])}?`;
    match=/^What (?:does|do) (.+?) (?:do|provide|use)\?$/i.exec(question);
    if(match)return`Jaką funkcję pełni ${translateQuestionTail(match[1])}?`;
    match=/^Which command (.+?)\?$/i.exec(question);
    if(match)return`Które polecenie ${translateQuestionTail(match[1])}?`;
    match=/^Which (.+?)\?$/i.exec(question);
    if(match)return`Który wariant poprawnie opisuje ${translateQuestionTail(match[1])}?`;
    match=/^How many (.+?)\?$/i.exec(question);
    if(match)return`Ile ${translateQuestionTail(match[1])}?`;
    match=/^How (?:do|does|would|can) (.+?)\?$/i.exec(question);
    if(match)return`Jak ${translateQuestionTail(match[1])}?`;
    match=/^Why (.+?)\?$/i.exec(question);
    if(match)return`Dlaczego ${translateQuestionTail(match[1])}?`;
    match=/^When (.+?)\?$/i.exec(question);
    if(match)return`Kiedy ${translateQuestionTail(match[1])}?`;
    match=/^Where (.+?)\?$/i.exec(question);
    if(match)return`Gdzie ${translateQuestionTail(match[1])}?`;
    match=/^(?:True\s*\/\s*False|True or False)\s*:\s*(.+)$/i.exec(question);
    if(match)return`Prawda czy fałsz: ${translateQuestionTail(match[1])}`;
    match=/^(Configure|Verify|Identify|Name|List|Describe|Explain|Define|Select)\s+(.+)$/i.exec(question);
    if(match){
      const verbs={configure:'Skonfiguruj',verify:'Zweryfikuj',identify:'Wskaż',name:'Nazwij',list:'Wymień',describe:'Opisz',explain:'Wyjaśnij',define:'Zdefiniuj',select:'Wybierz'};
      return`${verbs[match[1].toLowerCase()]} ${translateQuestionTail(match[2])}`;
    }
    if(/\[\.\.\.\]|{{c\d+::/i.test(question))return`Uzupełnij zdanie: ${translateQuestionTail(question.replace(/{{c\d+::([^}:]*)(?:::[^}]*)?}}/gi,'[...]'))}`;
    return`Wybierz poprawną odpowiedź: ${translateQuestionTail(question)}`;
  }
  function isEnglishQuestion(value) {
    const question=String(value||'').trim();
    if(!question||/[ąćęłńóśźż]/i.test(question))return false;
    return /^(?:what|which|how|why|when|where|who|true\s*\/\s*false|true or false|configure|verify|identify|name|list|describe|explain|define|select|assuming|a |an |the )\b/i.test(question) || /\b(?:is|are|does|do|will|would|should|can|network|router|switch|command)\b/i.test(question);
  }
  const sectionTitles = {
    // WIEDORA-CHANGE: WD-20261031-WIE-005-NATIVE-REGRESSION-09 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
    'interfejsy-sieciowe-i-okablowanie': 'Interfaces, Cabling and Device Connections',
    'cisco-ios-cli': 'Cisco IOS i command-line interface (CLI)',
    'przelaczanie-ethernet-czesc-1': 'Ethernet switching — część 1',
    'przelaczanie-ethernet-czesc-2': 'Ethernet switching — część 2',
    'interfejsy-przelacznika': 'Switch interfaces',
    'naglowek-ipv4': 'IPv4 header',
    'podstawy-routingu': 'Routing: podstawy i static routes',
    'zycie-pakietu': 'Packet: droga przez sieć',
    'ccna-network-devices': 'Network devices',
    'ccna-subnetting': 'Subnetting IPv4',
    'ccna-dynamic-routing': 'Dynamic routing, RIP i EIGRP',
    'ccna-acl': 'ACL — Access Control Lists',
    'ccna-virtualization-cloud': 'Virtualization, cloud i containers'
  };
  // Form complete learning prompts from original imported exam material.
  // Do not modify questionEn, IDs or the identifiers used for saved progress.
  function examPrompt(source, answer = '') {
    const original = String(source || '').trim().replace(/^Pytanie egzaminacyjne\s*[•—:-]?\s*/i, '');
    if (!original) return 'Podaj prawidłową odpowiedź na pytanie.';
    const question = original
      .replace(/{{c\d+::([^}:]*)(?:::[^}]*)?}}/gi, '[...]')
      .replace(/\s+/g, ' ').trim();
    const standFor = /^What (?:does|do) ([A-Z0-9/-]{2,18}) stand for\?$/i.exec(question);
    if (standFor) return 'Rozwiń skrót ' + standFor[1].toUpperCase() + '.';
    if (/^[A-Z][A-Z0-9/-]{1,18}$/.test(question) ||
        /^[A-Za-z][A-Za-z0-9/-]{1,18}$/.test(question) &&
        String(answer).toLowerCase().includes('(' + question.toLowerCase() + ')')) {
      // Anki includes acronyms as stand-alone card fronts (GBIC, SFP, STP etc.).
      return 'Rozwiń skrót ' + question + '.';
    }
    if (/^[0-9]{1,10} in binary$/i.test(question)) {
      return 'Zapisz liczbę ' + question.split(' ')[0] + ' w systemie binarnym.';
    }
    const classRange = /^Class ([A-E]) range$/i.exec(question);
    if (classRange) return 'Jaki jest zakres adresów IPv4 klasy ' + classRange[1].toUpperCase() + '?';
    const distance = /^((?:10|100|1000)G?BASE-[A-Z0-9/-]+) maximum cable length:?$/i.exec(question);
    if (distance) return 'Jaka jest maksymalna długość łącza ' + distance[1] + '?';
    const wifiRate = /^(802\.11[a-z]*) max data rate:?$/i.exec(question);
    if (wifiRate) return 'Jaka jest maksymalna szybkość transmisji w standardzie ' + wifiRate[1] + '?';
    if (/^802\.11 defines three types of service sets:?$/i.test(question)) {
      return 'Wymień trzy rodzaje service sets zdefiniowane w IEEE 802.11.';
    }
    if (/^The messages sent by STP switches are called:?$/i.test(question)) {
      return 'Jak nazywają się komunikaty wysyłane przez switche STP?';
    }
    if (/^TCP (?:three-way|four-way) handshake order of messages/i.test(question)) {
      return 'W jakiej kolejności występują komunikaty podczas ' + question.split(' order')[0] + '?';
    }
    if (/\[\.\.\.\]/.test(question)) return 'Uzupełnij lukę w zdaniu: ' + question;
    // Existing full questions (including those with a qualifier after "?") are retained.
    if (question.includes('?')) return question;
    if (/\[[^\]]+\]/.test(question) || /\.{3}$/.test(question)) {
      return 'Uzupełnij zdanie lub wybierz poprawny wariant: ' + question;
    }
    const stem = question.replace(/[:.;]\s*$/, '').trim();
    if (/^(?:Generate|Configure|Enable|Disable|Show|Verify|Restart|Display|Set|Remove|Clear|Create|Limit|Allow|Deny|List|Command to show)\b/i.test(stem)) {
      return 'Podaj polecenie Cisco IOS realizujące zadanie: ' + stem + '.';
    }
    if (/^(?:Define|Explain|Name|Describe|Give|Identify|Compare)\b/i.test(stem)) {
      return stem + (/[.!?]$/.test(stem) ? '' : '.');
    }
    if (/\b(?:address|port|timer|range|length|size|speed|mask|metric|value|holdtime|default|counter|interval|number|frequency|bandwidth)\b/i.test(stem)) {
      return 'Podaj wartość właściwą dla: ' + stem + '.';
    }
    // Never turn a bare imported answer cue back into a bare label.
    return 'Wyjaśnij zagadnienie: ' + stem + '.';
  }

  const displayKeys = new Set(['title', 'description', 'note', 'question', 'text', 'answer', 'answers', 'options', 'explanation', 'label', 'goal', 'steps', 'scope', 'instructions', 'tasks', 'checks', 'hint', 'subsectionTitle']);
  function course(data) {
    let changed = 0;
    const visit = (object, display = false) => {
      if (!object || typeof object !== 'object') return;
      // WIEDORA-CHANGE: WD-20261031-WIE-005-NATIVE-REGRESSION-09 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
      // A reviewed Polish prompt retains its original English source in questionEn.
      // Reapplying legacy terminology must not undo that explicit editorial revision.
      if (object.source && typeof object.questionEn === 'string' && object.questionPl === object.question && object.question !== object.questionEn) return;
      if (object.id && sectionTitles[object.id] && object.title !== sectionTitles[object.id]) { object.title = sectionTitles[object.id]; changed++; }
      // Imported questions are exam practice. Keep the original English wording,
      // replacing the old, incomplete machine-generated Polish/English wrapper.
      if (object.source && typeof object.questionEn === 'string' && object.questionEn.trim()) {
        const question = object.examQuestion ? examPrompt(object.questionEn, object.answer) : object.questionEn.trim();
        if (question !== object.question) { object.question = question; changed++; }
      }
      if (object.examQuestion && typeof object.question === 'string') {
        const question = object.question.replace(/^Pytanie egzaminacyjne\s*[•—:-]?\s*/i, '');
        if (question !== object.question) { object.question = question; changed++; }
      }
      for (const [key, value] of Object.entries(object)) {
        const visible = display || displayKeys.has(key);
        if (typeof value === 'string' && visible) {
          // Runtime-generated note supplements already use the final wording.
          // Leaving them untouched keeps applying the terminology pass idempotent.
          if (key === 'note' && (value.includes('ccna-question-note-supplement') || value.includes('data-ccna-topic='))) continue;
          const result = text(value);
          if (result !== value) { object[key] = result; changed++; }
        } else if (value && typeof value === 'object') visit(value, Array.isArray(value) && visible);
      }
      if (typeof object.question === 'string' && isEnglishQuestion(object.question)) {
        const translated=polishQuestion(object.question);
        if(translated&&translated!==object.question){object.questionPl=translated;changed++;}
      }
      if (typeof object.question === 'string' && /\bframe\b/i.test(object.question)) {
        const pronouns = value => value.replace(/\b(Przekazuje|Rozsyła|Wysyła) ją\b/g, '$1 frame');
        if (typeof object.answer === 'string') object.answer = pronouns(object.answer);
        if (Array.isArray(object.answers)) object.answers = object.answers.map(pronouns);
      }
      if (object.id === 'anki-interfaces-cables-ocg-2009') {
        // Cisco's official expansion omits the extra word "Ethernet".
        object.answer = 'Gigabit Interface Converter (GBIC)';
        if (Array.isArray(object.answers)) object.answers = object.answers.map(value =>
          value === 'Gigabit Ethernet Interface Converter (GBIC)' ? object.answer : value);
      }
      if (object.id === 'anki-interfaces-cables-ocg-6999') {
        object.question = 'Jakie pola zawiera nagłówek ramki Ethernet II?';
        object.questionPl = object.question;
        object.answer = 'Docelowy adres MAC, źródłowy adres MAC i pole EtherType.';
        object.answers = [
          object.answer,
          'Adres IP źródłowy, adres IP docelowy i wartość TTL.',
          'Preambuła, dane użytkownika i wyłącznie suma kontrolna FCS.',
          'Numery portów TCP, numer sekwencyjny i suma kontrolna.'
        ];
        object.correct = 0;
      }
      if (object.id === 'anki-other-jitl-1766789265137') {
        object.question = 'Jak rozwija się skrót SAN?';
        object.answer = 'Storage Area Network';
        object.answers = ['Storage Area Network', 'Local Area Network', 'Wide Area Network', 'Wireless Local Area Network'];
      }
    };
    visit(data);
    return { changed };
  }
  return Object.freeze({ text, course, examPrompt, polishQuestion, isEnglishQuestion, sectionTitles: Object.freeze(sectionTitles) });
});
