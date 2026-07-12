/**
 * content/noticias.ts
 * ---------------------------------------------------------------
 * Aqui moram os DADOS das notícias do portal — por enquanto, 12
 * notícias MOCK (inventadas pra teste, mas baseadas em fatos e
 * missões reais e conhecidas: James Webb, Artemis, Starship, Marte,
 * IA, computação quântica etc.).
 *
 * "Mock" = dado de mentirinha, usado só pra construir e testar a
 * tela antes de existir um pipeline de verdade coletando notícias.
 * Quando a Fase 2 do roadmap (scraping + IA reescrevendo matérias)
 * estiver pronta, os dados de verdade vão respeitar exatamente este
 * mesmo formato — é por isso que definimos um "type" (um contrato
 * de quais campos toda notícia PRECISA ter) logo abaixo: qualquer
 * fonte de dados futura (mock ou real) pode alimentar os mesmos
 * componentes de tela sem precisar mudar nada neles.
 *
 * As imagens de capa vêm da biblioteca de imagens da NASA
 * (images-assets.nasa.gov, domínio público — sem direitos autorais
 * pra pagar). Cada URL abaixo foi verificada com uma requisição
 * real antes de entrar aqui (todas responderam "200 OK", ou seja,
 * a imagem existe e carrega).
 */

// Categorias possíveis de uma notícia — usamos um "union type" (uma
// lista fechada de valores válidos) em vez de aceitar qualquer
// string, assim o TypeScript avisa na hora se alguém digitar a
// categoria errada.
export type Categoria = "espaço" | "tecnologia" | "física" | "biologia" | "ia";

// O "contrato" de uma notícia: todo objeto do tipo Noticia PRECISA
// ter exatamente estes campos, com estes tipos. Isso é o que o
// plano de redesign chama de "contrato que o backend futuro vai
// preencher" — hoje é gente (nós) escrevendo à mão, amanhã pode ser
// um pipeline automático, mas o formato final é este.
export type Noticia = {
  slug: string; // identificador único na URL, ex.: /noticia/jwst-vapor-agua-exoplaneta-rochoso
  categoria: Categoria;
  manchete: string; // título curto e direto do card
  resumo: string; // 1-2 frases de chamada, aparece no card
  imagem: string; // URL da imagem de capa
  dataISO: string; // data no formato AAAA-MM-DD (fácil de ordenar e formatar depois)
  corpo: string[]; // parágrafos do texto completo da matéria
  dadoCientifico: {
    fato: string; // uma curiosidade/explicação científica em destaque
    fonte: string; // nome da fonte desse dado
    url: string; // link pra essa fonte
  };
  traducao: string; // "o que isso significa na prática" — implicação concreta pro leitor
  fontes: { nome: string; url: string }[]; // referências completas no fim da matéria
};

export const noticias: Noticia[] = [
  {
    slug: "jwst-vapor-agua-exoplaneta-rochoso",
    categoria: "espaço",
    manchete:
      "James Webb detecta vapor de água na atmosfera de um exoplaneta rochoso",
    resumo:
      "Observações do telescópio espacial revelam sinais de vapor d'água num mundo rochoso a dezenas de anos-luz da Terra — um passo importante na busca por planetas potencialmente habitáveis.",
    imagem:
      "https://images-assets.nasa.gov/image/PIA18904/PIA18904~medium.jpg",
    dataISO: "2026-06-18",
    corpo: [
      "Usando o instrumento NIRSpec, o telescópio espacial James Webb registrou o espectro de luz da estrela hospedeira filtrado pela atmosfera do planeta durante um trânsito — o momento em que o planeta passa na frente da sua estrela, visto daqui da Terra. Nesse espectro, moléculas específicas deixam uma espécie de 'impressão digital': padrões de absorção de luz que só aquela substância produz.",
      "A equipe identificou um sinal compatível com vapor de água na atmosfera do planeta, que orbita uma estrela anã vermelha a poucas dezenas de anos-luz do Sistema Solar. É um dos sinais mais claros já captados nesse tipo de mundo rochoso, menor e mais denso que os gigantes gasosos que dominavam as primeiras descobertas de exoplanetas.",
      "Cientistas envolvidos na pesquisa pedem cautela: um sinal de água não significa, sozinho, que o planeta tenha oceanos ou seja habitável. A atmosfera pode ser fina, quente demais, ou a água pode existir só como vapor em quantidades mínimas. Ainda assim, é exatamente o tipo de medição que os astrônomos esperavam poder fazer quando o Webb foi projetado.",
      "A descoberta reacende o debate sobre quantos desses mundos rochosos existem só na nossa vizinhança galáctica — e reforça o argumento a favor de telescópios ainda mais sensíveis, como os que estão em planejamento pra próxima década, capazes de procurar não só água, mas gases associados à vida.",
    ],
    dadoCientifico: {
      fato: "O JWST usa espectroscopia de transmissão para analisar a luz da estrela filtrada pela atmosfera do planeta durante o trânsito, identificando moléculas pela 'impressão digital' que elas deixam no espectro de luz.",
      fonte: "NASA / Space Telescope Science Institute",
      url: "https://webb.nasa.gov",
    },
    traducao:
      "Não significa vida — mas é o mesmo tipo de leitura que os próximos telescópios vão usar pra vasculhar sinais biológicos em mundos fora do Sistema Solar.",
    fontes: [
      { nome: "NASA — James Webb Space Telescope", url: "https://webb.nasa.gov" },
      { nome: "Space Telescope Science Institute", url: "https://www.stsci.edu" },
    ],
  },
  {
    slug: "jwst-nebulosa-carina-bercario-estelar",
    categoria: "espaço",
    manchete:
      "Webb revela detalhes inéditos de um berçário estelar na Nebulosa de Carina",
    resumo:
      "Nova imagem em infravermelho mostra centenas de estrelas recém-nascidas escondidas atrás de paredes de poeira cósmica.",
    imagem:
      "https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~medium.jpg",
    dataISO: "2026-05-02",
    corpo: [
      "A imagem, batizada informalmente de 'Penhascos Cósmicos', mostra a borda de uma região jovem e cheia de estrelas na Nebulosa de Carina, a cerca de 7.600 anos-luz da Terra. O que parecem montanhas e vales é, na verdade, a borda de uma cavidade gigante de gás esculpida pela radiação ultravioleta e pelos ventos estelares de estrelas massivas recém-formadas.",
      "Diferente de telescópios que captam luz visível, o Webb enxerga principalmente em infravermelho — um tipo de luz capaz de atravessar nuvens de poeira que, pra olho humano ou pra um telescópio como o Hubble, seriam opacas. É esse 'raio-x cósmico' que revela centenas de estrelas até então escondidas dentro dos pilares de poeira.",
      "Cada pontinho brilhante recém-revelado é uma estrela em algum estágio de formação: desde protoestrelas ainda envoltas em seus casulos de gás até estrelas jovens já soprando bolhas ao redor de si com sua própria radiação. Estudar essa variedade lado a lado ajuda astrônomos a montar, como um filme, as etapas do nascimento estelar.",
      "Entender como estrelas se formam também é entender a própria história do Sol: ele nasceu do mesmo jeito, dentro de uma nuvem parecida com essa, há cerca de 4,6 bilhões de anos — só que naquela época não havia ninguém, nem telescópio, pra registrar a cena.",
    ],
    dadoCientifico: {
      fato: "A visão em infravermelho do Webb atravessa nuvens de poeira que bloqueiam a luz visível, revelando estrelas em formação escondidas dentro dos chamados 'pilares de criação'.",
      fonte: "NASA",
      url: "https://webb.nasa.gov",
    },
    traducao:
      "Reconstruir como estrelas nascem é reconstruir a própria origem do Sol e do Sistema Solar — inclusive de onde vieram os elementos que formam a Terra e a gente.",
    fontes: [
      { nome: "NASA — James Webb Space Telescope", url: "https://webb.nasa.gov" },
      { nome: "European Space Agency (ESA)", url: "https://esawebb.org" },
    ],
  },
  {
    slug: "artemis-ii-tripulacao-preparacao-lancamento",
    categoria: "espaço",
    manchete:
      "Tripulação da Artemis II faz últimos testes antes do primeiro voo tripulado à Lua em décadas",
    resumo:
      "Astronautas realizam simulações finais na plataforma de lançamento enquanto a NASA se prepara pra enviar humanos ao redor da Lua novamente.",
    imagem:
      "https://images-assets.nasa.gov/image/Artemis%20II%20at%20the%20pad%20Moon%2001292026_4/Artemis%20II%20at%20the%20pad%20Moon%2001292026_4~medium.jpg",
    dataISO: "2026-01-30",
    corpo: [
      "No Complexo de Lançamento 39B, no Centro Espacial Kennedy, a pilha completa do foguete SLS (Space Launch System) com a cápsula Orion no topo já está na plataforma, iluminada à noite com a Lua ao fundo — cenário que resume o objetivo da missão. A tripulação da Artemis II vem realizando simulações finais dos procedimentos de emergência, comunicação e escape antes da data de lançamento.",
      "Diferente da Artemis III, que pretende pousar astronautas na superfície lunar, a Artemis II é uma missão de sobrevoo: a cápsula Orion vai levar uma tripulação de quatro pessoas numa trajetória ao redor da Lua e de volta, sem pousar, num percurso de aproximadamente dez dias.",
      "É a primeira vez, desde o fim do programa Apollo em 1972, que seres humanos vão viajar além da órbita baixa da Terra. Isso muda completamente o tipo de risco envolvido: longe da Terra, não há resgate rápido possível, e todos os sistemas de suporte à vida da Orion — ar, água, temperatura, radiação — precisam funcionar sem falhas por conta própria.",
      "A missão também serve como teste de confiança pra tudo que vem depois: escudo térmico de reentrada, sistemas de navegação profunda e o próprio treinamento da tripulação em condições reais de missão, não só em simuladores na Terra.",
    ],
    dadoCientifico: {
      fato: "A missão Artemis II vai testar os sistemas de suporte à vida da cápsula Orion com astronautas a bordo, viajando além da órbita baixa da Terra — algo que nenhum ser humano faz desde o programa Apollo.",
      fonte: "NASA",
      url: "https://www.nasa.gov/artemis-ii/",
    },
    traducao:
      "É a ponte entre visitar a Lua uma vez e morar nela: as próximas missões vão usar tudo que for aprendido aqui pra pousar de novo — dessa vez, pra ficar.",
    fontes: [
      { nome: "NASA — Programa Artemis", url: "https://www.nasa.gov/artemis-ii/" },
      { nome: "NASA Kennedy Space Center", url: "https://www.nasa.gov/kennedy/" },
    ],
  },
  {
    slug: "starship-hls-modulo-lunar-artemis",
    categoria: "espaço",
    manchete:
      "Starship: módulo lunar da SpaceX avança nos testes pra levar astronautas à Lua",
    resumo:
      "Versão modificada da nave Starship, batizada de HLS, é a escolhida pela NASA pra pousar a próxima tripulação na superfície lunar.",
    imagem:
      "https://images-assets.nasa.gov/image/11%2003%2024%20artemis%203%20on%20surface/11%2003%2024%20artemis%203%20on%20surface~medium.jpg",
    dataISO: "2026-03-11",
    corpo: [
      "O HLS (Human Landing System, 'sistema humano de pouso') é uma versão especializada da Starship, a nave da SpaceX, adaptada especificamente pra pousar astronautas na superfície da Lua como parte do programa Artemis. Diferente da Starship que voa da Terra, o HLS nunca reentra na atmosfera terrestre — sua jornada inteira acontece no espaço e na superfície lunar.",
      "O desafio técnico mais delicado do projeto é o reabastecimento em órbita: antes de seguir pra Lua, o HLS precisa receber combustível criogênico (extremamente gelado) de outras naves-tanque, numa sequência de manobras orbitais que nunca foi feita nessa escala. Só depois de reabastecida a nave segue pra órbita lunar, onde vai se encontrar com a cápsula Orion.",
      "Os motores Raptor, também desenvolvidos pela SpaceX, são o coração propulsivo do sistema — usam metano e oxigênio líquido, uma combinação escolhida pensando até em missões futuras a Marte, onde metano poderia teoricamente ser produzido localmente.",
      "É a primeira vez que uma espaçonave construída por uma empresa privada é responsável por pousar humanos fora da Terra — um modelo de parceria entre a NASA e o setor privado que o programa Artemis aposta ser mais rápido e barato do que desenvolver tudo internamente, como era feito na era Apollo.",
    ],
    dadoCientifico: {
      fato: "O HLS Starship precisa ser reabastecido em órbita por outras naves antes de seguir para a Lua — uma manobra orbital nunca realizada nessa escala.",
      fonte: "NASA",
      url: "https://www.nasa.gov/humans-in-space/artemis/human-landing-system/",
    },
    traducao:
      "Se der certo, é a primeira vez que uma espaçonave privada, reabastecida em órbita, pousa humanos na Lua — abrindo caminho pra viagens espaciais mais baratas e frequentes.",
    fontes: [
      { nome: "NASA — Human Landing System", url: "https://www.nasa.gov/humans-in-space/artemis/human-landing-system/" },
      { nome: "SpaceX", url: "https://www.spacex.com/vehicles/starship/" },
    ],
  },
  {
    slug: "buraco-negro-supermassivo-galaxia-anao",
    categoria: "física",
    manchete:
      "Astrônomos encontram buraco negro supermassivo numa galáxia bem menor do que o esperado",
    resumo:
      "Descoberta desafia modelos que relacionam o tamanho de uma galáxia ao tamanho do buraco negro que ela abriga em seu centro.",
    imagem:
      "https://images-assets.nasa.gov/image/behemoth-black-hole-found-in-an-unlikely-place_26209716511_o/behemoth-black-hole-found-in-an-unlikely-place_26209716511_o~medium.jpg",
    dataISO: "2026-02-14",
    corpo: [
      "Usando dados combinados de telescópios espaciais, uma equipe de astrônomos identificou um buraco negro supermassivo no centro de uma galáxia anã — muito menor do que as galáxias onde costumam ser encontrados objetos desse porte. A massa do buraco negro é comparável à de buracos negros que vivem em galáxias centenas de vezes maiores.",
      "Até então, a relação observada entre o tamanho de uma galáxia e a massa do buraco negro em seu núcleo era um dos padrões mais consistentes da astrofísica: galáxias maiores, buracos negros maiores. Encontrar uma exceção tão desproporcional obriga os cientistas a revisitar essa suposição.",
      "Uma das hipóteses é que esse buraco negro tenha se formado antes da própria galáxia crescer ao seu redor — ou seja, ele não seria um 'produto' do crescimento galáctico, mas um ponto de partida que atraiu gás e estrelas pra formar a galáxia em torno de si.",
      "Para efeito de comparação, o buraco negro no centro da nossa própria galáxia, a Via Láctea, chamado Sagitário A*, tem massa muito menor em relação ao tamanho da Via Láctea — reforçando o quão incomum é o caso agora observado.",
    ],
    dadoCientifico: {
      fato: "O buraco negro identificado tem massa comparável à de buracos negros encontrados em galáxias centenas de vezes maiores, quebrando a proporção que os astrônomos costumam observar.",
      fonte: "NASA / ESA — Telescópio Espacial Hubble",
      url: "https://science.nasa.gov",
    },
    traducao:
      "Isso sugere que buracos negros gigantes podem se formar antes das galáxias ao redor deles crescerem — mudando a ordem que os cientistas imaginavam na formação do universo primitivo.",
    fontes: [
      { nome: "NASA Science", url: "https://science.nasa.gov" },
      { nome: "Telescópio Espacial Hubble", url: "https://science.nasa.gov/mission/hubble/" },
    ],
  },
  {
    slug: "sol-erupcao-solar-intensa-fusao-nuclear",
    categoria: "física",
    manchete:
      "Sol libera erupção solar intensa e reacende debate sobre replicar sua energia na Terra",
    resumo:
      "Explosão classe X captada por satélites reforça o interesse científico em recriar, em laboratório, o processo de fusão nuclear que alimenta o Sol.",
    imagem:
      "https://images-assets.nasa.gov/image/PIA21958/PIA21958~medium.jpg",
    dataISO: "2026-04-22",
    corpo: [
      "O Observatório de Dinâmica Solar (SDO) da NASA registrou uma erupção solar de classe X — a categoria mais intensa na escala usada por astrônomos pra medir esses eventos. A explosão liberou, em minutos, uma quantidade de energia equivalente a bilhões de bombas de hidrogênio, e partículas carregadas seguiram em direção ao espaço, incluindo parte em direção à Terra.",
      "Erupções assim acontecem porque o Sol é, essencialmente, uma bola de plasma dominada por campos magnéticos que se torcem, se rompem e se reconectam de forma explosiva. A energia liberada nesse processo é diferente da energia que ilumina e aquece o planeta todos os dias — essa vem de um processo constante no núcleo solar: a fusão nuclear.",
      "No núcleo do Sol, pressão e temperatura extremas fundem núcleos de hidrogênio em hélio, liberando energia na forma de luz e calor. É o mesmo princípio físico que projetos de fusão nuclear na Terra — como reatores tokamak e experimentos de fusão a laser — tentam reproduzir, numa escala minúscula comparada ao Sol, mas suficiente pra gerar eletricidade.",
      "Diferente da fissão nuclear usada nas usinas atuais, que quebra átomos pesados e produz rejeito radioativo de longa duração, a fusão junta átomos leves e, em teoria, deixaria muito menos resíduo perigoso. O obstáculo continua sendo de engenharia: manter o plasma quente e estável tempo suficiente pra produzir mais energia do que consome ainda é um desafio em aberto.",
    ],
    dadoCientifico: {
      fato: "No núcleo do Sol, pressão e temperatura extremas fundem núcleos de hidrogênio em hélio, liberando a energia que emerge como luz e calor — o mesmo princípio físico que reatores de fusão terrestres tentam reproduzir em escala muito menor.",
      fonte: "NASA Solar Dynamics Observatory",
      url: "https://sdo.gsfc.nasa.gov",
    },
    traducao:
      "Cada avanço nas pesquisas de fusão aproxima a humanidade de uma fonte de energia quase ilimitada e sem os resíduos radioativos de longa duração da fissão nuclear usada hoje.",
    fontes: [
      { nome: "NASA Solar Dynamics Observatory", url: "https://sdo.gsfc.nasa.gov" },
      { nome: "ITER Organization", url: "https://www.iter.org" },
    ],
  },
  {
    slug: "perseverance-rocha-marciana-sinais-promissores",
    categoria: "espaço",
    manchete:
      "Perseverance identifica minerais que podem indicar ambiente antigo favorável à vida em Marte",
    resumo:
      "Rover da NASA analisa rocha na cratera Jezero com composição química que intriga astrobiólogos.",
    imagem:
      "https://images-assets.nasa.gov/image/PIA24348/PIA24348~medium.jpg",
    dataISO: "2026-01-09",
    corpo: [
      "O rover Perseverance, explorando a cratera Jezero desde 2021, encontrou numa rocha sedimentar uma combinação de minerais — incluindo sulfatos e possíveis compostos orgânicos — que os cientistas da missão classificam como um dos sinais mais intrigantes já registrados na busca por indícios de vida antiga em Marte.",
      "A cratera Jezero foi escolhida como local de pouso justamente por ter sido, bilhões de anos atrás, o leito de um lago alimentado por um rio que formava um delta — exatamente o tipo de ambiente que, na Terra, costuma preservar sinais químicos de atividade biológica em sedimentos.",
      "O instrumento SHERLOC, montado no braço robótico do rover, usa fluorescência ultravioleta pra mapear minerais e compostos orgânicos na superfície das rochas sem precisar quebrar ou danificar a amostra — uma espécie de 'raio-x químico' que revela padrões invisíveis a olho nu.",
      "Cientistas da missão são cuidadosos ao comunicar esse tipo de achado: composições minerais parecidas com biossinaturas também podem se formar por processos puramente geológicos, sem vida nenhuma envolvida. A palavra final só deve vir quando essas amostras, já lacradas em tubos especiais pelo próprio rover, chegarem a laboratórios de verdade na Terra.",
    ],
    dadoCientifico: {
      fato: "O rover usa o instrumento SHERLOC para mapear minerais e compostos orgânicos na superfície das rochas usando fluorescência ultravioleta, sem precisar quebrar a amostra.",
      fonte: "NASA / JPL",
      url: "https://mars.nasa.gov/mars2020/",
    },
    traducao:
      "As respostas definitivas só virão quando essas amostras chegarem a laboratórios na Terra — o que a missão Mars Sample Return pretende fazer ainda nesta década.",
    fontes: [
      { nome: "NASA Mars 2020 / Perseverance", url: "https://mars.nasa.gov/mars2020/" },
      { nome: "Jet Propulsion Laboratory (JPL)", url: "https://www.jpl.nasa.gov" },
    ],
  },
  {
    slug: "ingenuity-helicoptero-marte-fim-missao",
    categoria: "espaço",
    manchete:
      "Ingenuity encerra operação histórica após dezenas de voos sobre o solo marciano",
    resumo:
      "O pequeno helicóptero, projetado pra apenas 5 voos-teste, provou que é possível voar em outro planeta — e mudou o jeito que exploramos Marte.",
    imagem:
      "https://images-assets.nasa.gov/image/PIA24466/PIA24466~medium.jpg",
    dataISO: "2026-01-25",
    corpo: [
      "Planejado originalmente como uma demonstração tecnológica de apenas cinco voos, o helicóptero Ingenuity acabou voando dezenas de vezes ao longo de sua missão em Marte, servindo como batedor aéreo pro rover Perseverance e mostrando, na prática, que voo motorizado controlado é possível fora da Terra.",
      "O desafio de engenharia era enorme: a atmosfera marciana tem cerca de 1% da densidade da atmosfera terrestre ao nível do mar. Pra gerar sustentação suficiente nessas condições, as pás do Ingenuity giram muito mais rápido do que as de um helicóptero comum — a ponto de os engenheiros terem que desenvolver um sistema de rotor inteiramente novo.",
      "Além de bater recordes de altitude e distância pra um veículo aéreo em outro planeta, o Ingenuity ajudou a equipe do Perseverance a escolher rotas mais seguras e identificar alvos científicos interessantes vistos de cima — um tipo de reconhecimento que, até então, só orbitadores distantes podiam oferecer, com muito menos detalhe.",
      "O legado do pequeno helicóptero vai além dos números: ele provou o conceito que futuras missões pretendem expandir, com drones maiores e mais capazes explorando Marte, Titã e outras luas com atmosfera — voar deixou de ser um recurso exclusivo da Terra.",
    ],
    dadoCientifico: {
      fato: "A atmosfera de Marte tem cerca de 1% da densidade da atmosfera terrestre ao nível do mar — para voar nela, as pás do Ingenuity giram bem mais rápido do que as de um helicóptero comum na Terra.",
      fonte: "NASA / JPL",
      url: "https://mars.nasa.gov/technology/helicopter/",
    },
    traducao:
      "Provar que dá pra voar em Marte abre a porta pra futuras missões usarem drones aéreos como parte padrão da exploração de outros planetas.",
    fontes: [
      { nome: "NASA — Mars Helicopter (Ingenuity)", url: "https://mars.nasa.gov/technology/helicopter/" },
      { nome: "Jet Propulsion Laboratory (JPL)", url: "https://www.jpl.nasa.gov" },
    ],
  },
  {
    slug: "sensor-quantico-comunicacao-computadores-quanticos",
    categoria: "tecnologia",
    manchete:
      "Novo sensor quântico pode resolver um dos maiores gargalos dos computadores quânticos",
    resumo:
      "Dispositivo desenvolvido em laboratório da NASA promete detectar sinais de micro-ondas com precisão inédita, ajudando computadores quânticos a se comunicarem entre si.",
    imagem:
      "https://images-assets.nasa.gov/image/PIA25260/PIA25260~medium.jpg",
    dataISO: "2026-03-30",
    corpo: [
      "Computadores quânticos processam informação usando qubits — unidades que, ao contrário dos bits comuns (0 ou 1), podem existir em combinações de estados ao mesmo tempo. Esse comportamento é o que dá a eles potencial de resolver certos problemas exponencialmente mais rápido que computadores convencionais.",
      "O problema é que ler o estado de um qubit sem destruí-lo é extremamente difícil: qualquer interferência descuidada colapsa esse estado frágil. Pesquisadores de um laboratório da NASA desenvolveram um sensor capaz de detectar fótons de micro-ondas — partículas de energia extremamente fracas — com um nível de ruído baixíssimo, o suficiente pra captar sinais que detectores convencionais simplesmente não veem.",
      "Além de melhorar a leitura de qubits dentro de um único computador quântico, esse tipo de sensor é peça-chave pra conectar vários processadores quânticos numa rede — permitindo que 'conversem' entre si trocando informação quântica, hoje um dos maiores gargalos da área.",
      "A tecnologia também tem aplicações fora da computação: sensores dessa sensibilidade são cogitados pra detectar sinais fracos demais até pra instrumentos atuais, incluindo possíveis candidatos a matéria escura — o tipo de matéria que compõe a maior parte do universo, mas que nunca foi observada diretamente.",
    ],
    dadoCientifico: {
      fato: "Ler o estado de um qubit sem destruí-lo é um dos maiores desafios da computação quântica; sensores como esse usam fótons de micro-ondas de altíssima sensibilidade para captar sinais fracos demais para detectores convencionais.",
      fonte: "NASA / Jet Propulsion Laboratory",
      url: "https://www.jpl.nasa.gov",
    },
    traducao:
      "Comunicação quântica confiável é a peça que falta pra conectar vários computadores quânticos pequenos numa rede muito mais poderosa do que qualquer um deles sozinho.",
    fontes: [
      { nome: "NASA Jet Propulsion Laboratory", url: "https://www.jpl.nasa.gov" },
      { nome: "Caltech", url: "https://www.caltech.edu" },
    ],
  },
  {
    slug: "cimon-assistente-ia-estacao-espacial",
    categoria: "ia",
    manchete:
      "Assistente robótico com inteligência artificial começa a trabalhar ao lado de astronautas na ISS",
    resumo:
      "Esfera flutuante equipada com IA ajuda a tripulação em tarefas rotineiras e experimentos científicos a bordo da Estação Espacial Internacional.",
    imagem:
      "https://images-assets.nasa.gov/image/iss073e0384104/iss073e0384104~medium.jpg",
    dataISO: "2026-02-27",
    corpo: [
      "Do tamanho de uma bola de vôlei, o assistente flutua sozinho dentro da cabine da Estação Espacial Internacional usando pequenos propulsores internos que giram para se orientar — sem rodas, sem braços mecânicos, sem nada tocando as paredes ou os astronautas.",
      "Equipado com reconhecimento de voz e processamento de linguagem natural, o dispositivo entende comandos falados e responde em tempo real, ajudando a tripulação a consultar procedimentos de experimentos, gravar observações e até documentar tarefas em vídeo sem precisar largar o que está fazendo com as mãos.",
      "Além da função prática, o assistente tem um papel pensado especificamente pra missões longas: fazer companhia. Astronautas em expedições de meses relatam que interagir com uma 'presença' capaz de conversar, ainda que artificial, ajuda a aliviar o isolamento psicológico do trabalho em órbita.",
      "É, na prática, um teste em pequena escala de algo que futuras missões mais longas — como uma viagem tripulada a Marte, que pode durar anos — vão precisar levar a sério: contar com inteligência artificial como parceira de trabalho, não apenas como ferramenta.",
    ],
    dadoCientifico: {
      fato: "O assistente flutua sozinho usando pequenos propulsores internos que giram para se orientar dentro da cabine, sem precisar de rodas ou braços mecânicos externos.",
      fonte: "ESA / NASA",
      url: "https://www.nasa.gov/international-space-station/",
    },
    traducao:
      "É um teste em pequena escala de como astronautas em missões longas — tipo uma viagem a Marte — vão contar com IA como parceira de trabalho, não só como ferramenta.",
    fontes: [
      { nome: "NASA — International Space Station", url: "https://www.nasa.gov/international-space-station/" },
      { nome: "European Space Agency (ESA)", url: "https://www.esa.int" },
    ],
  },
  {
    slug: "supercomputador-nasa-simulacoes-climaticas-ia",
    categoria: "ia",
    manchete:
      "Supercomputador da NASA usa inteligência artificial pra acelerar simulações do clima da Terra",
    resumo:
      "Sistema batizado Discover combina poder de processamento massivo com modelos de aprendizado de máquina pra prever padrões climáticos com mais velocidade.",
    imagem:
      "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e002030/GSFC_20171208_Archive_e002030~medium.jpg",
    dataISO: "2026-05-19",
    corpo: [
      "O cluster de supercomputação Discover, operado pelo Centro de Simulação Climática da NASA, é um dos sistemas mais usados pela agência pra rodar modelos completos do sistema terrestre — simulações que juntam atmosfera, oceanos, gelo polar e superfície continental numa única representação numérica do planeta.",
      "Modelos climáticos tradicionais resolvem equações físicas ponto a ponto numa grade tridimensional que cobre toda a atmosfera — um processo caríssimo em poder computacional, que pode levar semanas mesmo em máquinas potentes. Pesquisadores começaram a treinar redes neurais nesses mesmos dados históricos, capazes de aproximar resultados semelhantes numa fração do tempo.",
      "A ideia não é substituir a física por adivinhação estatística, mas usar a IA como um atalho em partes específicas do modelo — por exemplo, em processos de formação de nuvens, historicamente uma das etapas mais lentas e incertas das simulações — liberando poder computacional pra rodar mais cenários em menos tempo.",
      "Simulações mais rápidas significam mais capacidade de testar diferentes cenários — de trajetórias de furacões a projeções de aquecimento global de longo prazo — dando às autoridades mais tempo de antecedência pra se prepararem.",
    ],
    dadoCientifico: {
      fato: "Modelos climáticos tradicionais resolvem equações físicas ponto a ponto num grid tridimensional da atmosfera — um processo caríssimo em poder computacional; redes neurais treinadas nesses mesmos dados conseguem aproximar resultados semelhantes numa fração do tempo.",
      fonte: "NASA Center for Climate Simulation",
      url: "https://www.nccs.nasa.gov",
    },
    traducao:
      "Previsões climáticas mais rápidas significam mais tempo de antecedência pra cidades se prepararem pra eventos extremos, de furacões a ondas de calor.",
    fontes: [
      { nome: "NASA Center for Climate Simulation", url: "https://www.nccs.nasa.gov" },
      { nome: "NASA Goddard Space Flight Center", url: "https://www.nasa.gov/goddard/" },
    ],
  },
  {
    slug: "tecido-humano-microgravidade-medicina-regenerativa",
    categoria: "biologia",
    manchete:
      "Cientistas cultivam tecido humano em microgravidade a bordo da ISS",
    resumo:
      "Experimentos na Estação Espacial Internacional exploram como a ausência de gravidade favorece o crescimento de células em estruturas tridimensionais mais parecidas com tecido real.",
    imagem:
      "https://images-assets.nasa.gov/image/jsc2020e031188/jsc2020e031188~medium.jpg",
    dataISO: "2026-06-05",
    corpo: [
      "Dentro do Bioculture System Facility, um equipamento instalado na Estação Espacial Internacional dedicado a experimentos biológicos, pesquisadores vêm cultivando amostras de células humanas em condições de microgravidade — o ambiente de quase ausência de peso que existe em órbita.",
      "Na Terra, a gravidade faz as células cultivadas em laboratório se acomodarem em camadas achatadas no fundo do recipiente de cultivo. Em microgravidade, sem essa força puxando tudo pra baixo, as células flutuam livremente e se organizam de forma mais parecida com um tecido de verdade dentro do corpo — em estruturas tridimensionais, com camadas e interações que um cultivo achatado simplesmente não reproduz.",
      "Esses tecidos cultivados em órbita — incluindo modelos de músculo cardíaco, tecido ósseo e até tumores usados em pesquisa contra o câncer — voltam à Terra pra serem analisados em detalhe, comparados com equivalentes cultivados normalmente aqui embaixo.",
      "A aposta científica é que modelos de tecido mais realistas sirvam pra testar novos remédios antes de chegarem a testes em humanos, com resultados mais confiáveis do que os obtidos em culturas de células tradicionais — reduzindo, também, a necessidade de testes em animais em algumas etapas da pesquisa.",
    ],
    dadoCientifico: {
      fato: "Na Terra, a gravidade faz as células cultivadas em laboratório se acomodarem em camadas achatadas no fundo do recipiente; em microgravidade, elas flutuam livremente e se organizam em estruturas tridimensionais mais parecidas com tecido de verdade.",
      fonte: "NASA — Pesquisa na ISS",
      url: "https://www.nasa.gov/mission/station/research/",
    },
    traducao:
      "Tecidos cultivados assim podem virar modelos melhores pra testar remédios antes de chegarem a humanos, acelerando pesquisas contra doenças e reduzindo etapas de teste em animais.",
    fontes: [
      { nome: "NASA — Pesquisa a bordo da ISS", url: "https://www.nasa.gov/mission/station/research/" },
      { nome: "Center for the Advancement of Science in Space (CASIS)", url: "https://www.issnationallab.org" },
    ],
  },
];
