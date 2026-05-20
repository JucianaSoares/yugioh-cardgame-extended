// Função auxiliar para criar o tempo de espera (delay)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const state = {
  score: {
    playerScore: 0,
    computerScore: 0,
    playerLP: 8000, // Novo: Vida do jogador
    computerLP: 8000, // Novo: Vida do computador
    lpBox: document.getElementById("lp_points"),
    logBox: null,
    globalWins: parseInt(localStorage.getItem("globalWins") || "0"),
        globalLosses: parseInt(localStorage.getItem("globalLosses") || "0"),
    currentStreak: 0, // Conta os oponentes derrotados na sequência
  },
  cardSprites: {
    avatar:document.getElementById("card-image"),
    name:document.getElementById("card-name"),
    type:document.getElementById("card-type"),
     // Movi as caixas de ATK e DEF para cá, pois elas descrevem a carta
    atkBox: document.getElementById("card-atk"),
    defBox: document.getElementById("card-def"),
  },
  fieldCards: {
    player:document.getElementById("player-field-card"),
    computer:document.getElementById("computer-field-card"),
  },
  playerSides:{
    player1:"player-cards",
    player1Box:document.querySelector("#player-cards"),
    computer:"computer-cards",
    computerBox:document.querySelector("#computer-cards"),
  },
  actions: {
    button:document.getElementById("next-duel"),
    isPlayerTurn: true, // Controla quem pode clicar
        isGameOver: false,
  },
  // Adicionei um campo para log de batalha mais detalhado
    view: {
        log: document.getElementById("status-text"),
    },
};
const playerSides = {
  player1:"player-cards",
  computer:"computer-cards",
};
const pathImages = "src/assets/icons/";

const cardData = [
  {
    id: 0,
    name: "Blue Eyes White Dragon",
    atk: 3000,
    def: 2500,
    img: `${pathImages}dragon.jpg`,
    type: "Dragon",
    rarity: "legendary", // O lendário dragão de Kaiba
  },
  {
    id: 1,
    name: "Dark Magician",
    atk: 2500,
    def: 2100,
    img: `${pathImages}magician.jpg`,
    type: "Spellcaster",
    rarity: "rare", // Mago implacável do Yugi
  },
  {
    id: 2,
    name: "Exodia",
    atk: 999999,
    def: 999999,
    img: `${pathImages}exodia.jpg`,
    type: "Legendary",
    rarity: "legendary", // O trunfo supremo
  },
  {
    id: 3,
    name: "Red-Eyes B. Dragon",
    atk: 2400,
    def: 2000,
    img: `${pathImages}red_eyes.jpg`,
    type: "Dragon",
    rarity: "rare", // Ás do Joey, muito forte
  },
  {
    id: 4,
    name: "B. Skull Dragon",
    atk: 3200,
    def: 2500,
    img: `${pathImages}skull_dragon.jpg`,
    type: "Dragon",
    rarity: "legendary", // Fusão devastadora, merece brilho dourado!
  },
  {
    id: 5,
    name: "Gaia The Fierce Knight",
    atk: 2300,
    def: 2100,
    img: `${pathImages}gaia.jpg`,
    type: "Warrior",
    rarity: "rare", // Monstro clássico de alto nível
  },
  {
    id: 6,
    name: "Summoned Skull",
    atk: 2500,
    def: 1200,
    img: `${pathImages}summoned_skull.jpg`,
    type: "Fiend",
    rarity: "rare", // ATK massivo para um monstro comum do anime
  },
  {
    id: 7,
    name: "Curse of Dragon",
    atk: 2000,
    def: 1500,
    img: `${pathImages}curse_dragon.jpg`,
    type: "Dragon",
    rarity: "common", // Monstro de suporte
  },
  {
    id: 8,
    name: "Giant Soldier of Stone",
    atk: 1300,
    def: 2000,
    img: `${pathImages}stone_soldier.jpg`,
    type: "Rock",
    rarity: "common", // Sua parede de defesa inicial
  },
  {
    id: 9,
    name: "Celtic Guardian",
    atk: 1400,
    def: 1200,
    img: `${pathImages}celtic_guardian.jpg`,
    type: "Warrior",
    rarity: "common", // O guerreiro ágil inicial
  },
];

let selectedPlayerCardId = null;

async function playExodiaAnimation() {
    const audio = new Audio(`src/assets/audios/exodia_theme.wav`); // Se tiver um som épico
    try { audio.play(); } catch {}
    
    // Efeito visual: a tela pisca em dourado
    document.body.style.backgroundColor = "#f1c40f";
    setTimeout(() => {
        document.body.style.backgroundColor = ""; // Volta ao normal
    }, 2000);
}

async function applyDamageEffect(isPlayer) {
  // Se isPlayer for true, treme a barra do jogador, se false, a do computador
  const target = isPlayer ? document.querySelector(".container__left") : document.querySelector(".container__right");
  
  target.classList.add("damage-shake");
  
  // Remove a classe após a animação acabar (0.5s) para poder usar de novo
  setTimeout(() => {
    target.classList.remove("damage-shake");
  }, 500);
}

  async function getRandomCardId(){
    const randomIndex = Math.floor(Math.random()*cardData.length);
    return cardData[randomIndex].id;
  }
  async function createCardImage(randomIdCard,fieldSide){
    const cardImage = document.createElement("img");
    cardImage.setAttribute("height","100px");
    cardImage.setAttribute("src","src/assets/icons/card-back.webp")
    cardImage.setAttribute("data-id",randomIdCard);
    cardImage.classList.add("card");
    if (fieldSide === playerSides.player1) {
      cardImage.addEventListener("mouseover",() => {
      drawSelectCard(randomIdCard);
        });
      cardImage.addEventListener("click", () => {
    const menu = document.getElementById("summon-menu");
    menu.style.display = "block"; // Abre o menu

    // Configura os botões do menu para jogar a carta clicada
    document.getElementById("btn-atk").onclick = () => {
        menu.style.display = "none";
        setCardsField(randomIdCard, "atk");
    };
    document.getElementById("btn-def").onclick = () => {
        menu.style.display = "none";
        setCardsField(randomIdCard, "def");
    };
});
  }
  return cardImage;
  }
  // Na sua função que mostra o menu, use SEMPRE flex
function openSummonMenu() {
    const menu = document.getElementById("summon-menu");
    menu.style.display = "flex"; 
}

async function handleSummon(position) {
    document.getElementById("summon-menu").style.display = "none";
    await setCardsField(selectedPlayerCardId, position);
}

function updateBattlefieldEnvironment(playerCard, computerCard) {
    const body = document.body;
    
    // Reseta para o fundo padrão do jogo (Escuro profundo)
    body.style.background = "#0a0a12"; 
    body.style.boxShadow = "none";

    // 1. CENÁRIO DO EXODIA: Dourado Místico Cósmico
    if (playerCard.name === "Exodia" || computerCard.name === "Exodia") {
        body.style.background = "radial-gradient(circle, #4a3306 0%, #050300 100%)";
        // Um brilho interno dourado massivo nas bordas da tela
        body.style.boxShadow = "inset 0 0 150px rgba(241, 196, 15, 0.6)";
        return;
    }

    // 2. CENÁRIO DE DRAGÕES: Vermelho Lava / Vulcânico Neon
    if (playerCard.type === "Dragon" || computerCard.type === "Dragon") {
        body.style.background = "radial-gradient(circle, #520b0b 0%, #080101 100%)";
        // Injeta uma aura vermelha pulsante nas bordas
        body.style.boxShadow = "inset 0 0 130px rgba(255, 41, 41, 0.5)";
    } 
    // 3. CENÁRIO DE MAGOS (Spellcaster): Roxo Astral / Magia Arcana
    else if (playerCard.type === "Spellcaster" || computerCard.type === "Spellcaster") {
        body.style.background = "radial-gradient(circle, #340c54 0%, #06010a 100%)";
        // Injeta um roxo bem elétrico nas bordas
        body.style.boxShadow = "inset 0 0 130px rgba(187, 86, 255, 0.5)";
    }
    // 4. CENÁRIO DE GUERREIROS (Warrior): Azul Aço / Campo de Batalha
    else if (playerCard.type === "Warrior" || computerCard.type === "Warrior") {
        body.style.background = "radial-gradient(circle, #0d2b45 0%, #02060a 100%)";
        body.style.boxShadow = "inset 0 0 100px rgba(52, 152, 219, 0.4)";
    }
}

  async function setCardsField(cardId, playerPosition = "atk") {
    // --- TRAVA DE SEGURANÇA ---
    // Impede que o jogador jogue se não for o turno dele ou se o jogo acabou
    if (!state.actions.isPlayerTurn || state.actions.isGameOver) return;
    state.actions.isPlayerTurn = false; // Bloqueia novos cliques imediatamente
    
    await removeAllCardsImages();
    let computerCardId = await getRandomCardId();
    let computerCard = cardData[computerCardId];

    // --- NOVA LÓGICA DA IA ---
    let computerPosition = (computerCard.def > computerCard.atk) ? "def" : "atk";
    // A IA também escolhe uma posição (Estratégia competitiva)
    
// 1. Se a carta for defensiva (DEF muito maior que ATK), ele defende.
    if (computerCard.def > computerCard.atk) {
        computerPosition = "def";
    }
// 2. Se o computador estiver com pouca vida (ex: menos de 2000), 
    // ele fica desesperado e defende qualquer carta com ATK menor que 2000.
    if (state.score.computerLP < 2000 && computerCard.atk < 2000) {
        computerPosition = "def";
    }

    // 3. Se a carta for um "Boss" (ATK > 2500), ele SEMPRE ataca.
    if (computerCard.atk >= 2500) 
        computerPosition = "atk";
    
    await ShowHiddenCardFieldsImages(true);
    
    const cImg = document.getElementById("computer-field-card");
     // Limpeza de classes antigas antes de desenhar
    cImg.classList.remove("card-reveal", "card-hidden", "defense");
    // Passamos a posição para a função que desenha
    await drawCardsInfield(cardId, computerCardId, playerPosition, computerPosition);
    
        /*--- O MOMENTO DO BLEFE ---
     O jogo dá uma pausa dramática de 1 segundo (1000ms)*/
    await wait(500);
    
      // Se a carta sumiu, vamos forçar ela a aparecer aqui
    cImg.style.display = "block";
    cImg.style.visibility = "visible";
  // Troca a imagem de fundo para a imagem REAL da carta antes de virar
    cImg.src = computerCard.img;
    
    // Adiciona a classe que trigga a animação CSS de flip
    cImg.classList.add("card-reveal");
    
    // Espera a animação de flip acabar (0.6s) para fazer o cálculo
    await wait(600); 
    // ----------------------------
    
    // --- APLICAÇÃO DA RARIDADE DA IA (Garante que aplique após o flip) ---
    cImg.classList.remove("card-legendary", "card-rare"); // Limpa antes
    if (computerCard.rarity === "legendary") {
        cImg.classList.add("card-legendary");
    } else if (computerCard.rarity === "rare") {
        cImg.classList.add("card-rare");
    }
    
    // Fazer o mesmo para o jogador se  tiver a variável pImg do campo dele:
    const pImg = document.getElementById("player-field-card");
    if (pImg) {
        let playerCard = cardData[cardId];
        pImg.classList.remove("card-legendary", "card-rare");
        if (playerCard.rarity === "legendary") pImg.classList.add("card-legendary");
        else if (playerCard.rarity === "rare") pImg.classList.add("card-rare");
    }
    
    let playerCard = cardData[cardId];
    // Chama a mudança de cenário baseada nas cartas em jogo!
    updateBattlefieldEnvironment(playerCard, computerCard);
    
    let duelResults = await checkDuelResults(cardId, computerCardId, playerPosition, computerPosition);
    
    await drawButton(duelResults);
     // Nota: isPlayerTurn voltará a ser true apenas quando o botão "Próximo Turno" for clicado
}

  // Exemplo de como aplicar a classe de defesa corretamente
async function drawCardsInfield(cardId, 
   computerCardId, playerPos, compPos) {
    const pImg = document.getElementById("player-field-card");
    const cImg = document.getElementById("computer-field-card");
    
// Imagem do jogador aparece normal
    pImg.src = cardData[cardId].img;
    // --- MUDANÇA AQUI ---
    // A imagem do computador começa com o VERSO
    cImg.src = "src/assets/icons/card-back.webp"; 
    
    // Adiciona a classe que prepara o giro 3D e esconde a face
    cImg.classList.add("card-hidden");
    // --------------------

    // FORÇAR a remoção da borda do quadrado branco (o pai da imagem)
    pImg.parentElement.style.border = "none";
    cImg.parentElement.style.border = "none";
    
    // Se você usa RPGUI, as vezes ele coloca background, vamos limpar:
    pImg.parentElement.style.background = "none";
    cImg.parentElement.style.background = "none";

 // Lógica de rotação de defesa (mantenha, mas ajuste para o flip)
    if (playerPos === "def") pImg.classList.add("defense");
    else pImg.classList.remove("defense");

    const playerCard = cardData[cardId];
    // O computador também aplica a classe de defesa, mas ela age junto com a card-hidden
    if (compPos === "def") cImg.classList.add("defense");
    else cImg.classList.remove("defense");
    
    if (playerCard.name === "Exodia") pImg.classList.add("exodia-glow");
    else pImg.classList.remove("exodia-glow");

}

async function ShowHiddenCardFieldsImages(value) {
    if (value === true) {
        state.fieldCards.player.style.display = "block";
        state.fieldCards.computer.style.display = "block";
    }
    if (value === false) {
        state.fieldCards.player.style.display = "none";
        state.fieldCards.computer.style.display = "none";

        // Devolve a borda para o PAI (a div card-infield)
        state.fieldCards.player.parentElement.style.setProperty("border", "3px solid #fff", "important");
        state.fieldCards.computer.parentElement.style.setProperty("border", "3px solid #fff", "important");
    }
}

  async function hiddenCardDetails(){
    state.cardSprites.avatar.src = "";
    state.cardSprites.name.innerText = "";
    state.cardSprites.type.innerText = "";
  }
  
  async function drawButton(result) {
    // Não importa se o resultado é win ou lose, o texto do botão é fixo
    state.actions.button.innerText = "PRÓXIMO TURNO";
    state.actions.button.style.display = "block";

    // O win/lose serve apenas para mudar a cor do botão (feedback visual)
    state.actions.button.classList.remove("win-button", "lose-button", "draw-button");
    state.actions.button.classList.add(`${result}-button`);
}

async function updateScore() {
    // Mostra apenas os LPs. Removi o playerScore e computerScore.
    state.score.lpBox.innerText = `PLAYER LP: ${state.score.playerLP} | COMP LP: ${state.score.computerLP}`;
}

async function checkDuelResults(playerCardId, computerCardId, playerPos, compPos) {
    let duelResults = "draw";
    let playerCard = cardData[playerCardId];
    let computerCard = cardData[computerCardId];
    let logMessage = "";

    // --- REGRA ESPECIAL: O DESPERTAR DO EXODIA ---
    if (playerCard.name === "Exodia") {
        duelResults = "win";
        state.score.computerLP = 0; // Vitória Instantânea!
        logMessage = "EXODIA, MANIFESTE-SE! OBLITERAR!";
        
        state.score.logBox.innerText = logMessage;
        state.score.logBox.style.color = "gold"; // Efeito visual de Boss
        
        await updateScore();
        await applyDamageEffect(false); // Computador treme com o impacto
        await playExodiaAnimation();
        await playAudio("win");
        await checkGameOver();
        return duelResults;
    }

// --- LÓGICA DE ATAQUE VS ATAQUE ---
    if (compPos === "atk") {
        if (playerCard.atk > computerCard.atk) {
            let damage = playerCard.atk - computerCard.atk;
            state.score.computerLP -= damage;
            duelResults = "win";
            logMessage = `PODER ABSOLUTO! ${playerCard.name} destruiu ${computerCard.name} e causou ${damage} de dano!`;
            await applyDamageEffect(false); 
        } else if (playerCard.atk < computerCard.atk) {
            let damage = computerCard.atk - playerCard.atk;
            state.score.playerLP -= damage;
            duelResults = "lose";
            logMessage = `DERROTA! ${playerCard.name} sucumbiu a ${computerCard.name}. Você perdeu ${damage} LP.`;
            await applyDamageEffect(true);
        } else {
            logMessage = "CHOQUE DE PODER! Ambos os monstros foram destruídos no embate.";
        }
    } 
    // --- LÓGICA DE ATAQUE VS DEFESA (Onde entra o Ricochete) ---
    else {
        if (playerCard.atk > computerCard.def) {
            duelResults = "win";
            logMessage = `DEFESA ROMPIDA! ${playerCard.name} estraçalhou a muralha de ${computerCard.name}!`;
            // Nota: Na regra clássica, destruir carta em defesa não tira LP.
        } else if (playerCard.atk < computerCard.def) {
            let damage = computerCard.def - playerCard.atk;
            state.score.playerLP -= damage;
            duelResults = "lose";
            logMessage = `RICOCHETE! A defesa de ${computerCard.name} é impenetrável. Você recebeu ${damage} de dano!`;
            await applyDamageEffect(true);
        } else {
            logMessage = "IMPASSE! O ataque foi bloqueado, mas seu monstro sobreviveu.";
        }
    }

    // Ajustes finais de interface
    state.score.playerLP = Math.max(0, state.score.playerLP);
    state.score.computerLP = Math.max(0, state.score.computerLP);

    state.score.logBox.innerText = logMessage;
    await updateScore();
    await playAudio(duelResults);
    await checkGameOver();
    
    // Logs de Contexto (Opcional)
if (state.score.computerLP <= 2000 && state.score.computerLP > 0) {
    state.score.logBox.innerText += " O oponente está acuado!";
} else if (state.score.playerLP <= 1000) {
    state.score.logBox.innerText += " CUIDADO! Seus pontos de vida estão críticos!";
}

    return duelResults;
}

  async function removeAllCardsImages() {
    let{computerBox, player1Box} = state.playerSides;
    let imgElements = computerBox.querySelectorAll("img");
    imgElements.forEach((img) => img.remove());
    
     imgElements = player1Box.querySelectorAll("img");
    imgElements.forEach((img) => img.remove());
  }

async function drawSelectCard(index) {
    if(index === null) { // Se passar null, limpa tudo
        state.cardSprites.atkBox.innerText = "ATK: -";
        state.cardSprites.defBox.innerText = "DEF: -";
        return;
    }
    
    let card = cardData[index];
    state.cardSprites.avatar.src = card.img;
    state.cardSprites.name.innerText = card.name;
    state.cardSprites.type.innerText = "Atributo: " + card.type;
    
    // Se for o Exodia, mostra o símbolo de infinito
    state.cardSprites.atkBox.innerText = card.atk > 9999 ? "ATK: ∞" : `ATK: ${card.atk}`;
    state.cardSprites.defBox.innerText = card.def > 9999 ? "DEF: ∞" : `DEF: ${card.def}`;
}

  async function drawCards(cardNumbers, fieldSide){
    for (let i = 0; i < cardNumbers; i++) {
      const randomIdCard = await getRandomCardId();
      const cardImage = await createCardImage(randomIdCard, fieldSide);
      document.getElementById(fieldSide).appendChild(cardImage);
    }
  }
  
async function resetDuel() {
    // 1. Limpeza visual das cartas (Mantenha o seu código de limpar imagens do campo)
    const pImg = document.getElementById("player-field-card");
    const cImg = document.getElementById("computer-field-card");
    if (pImg) { pImg.src = ""; pImg.classList.remove("card-legendary", "card-rare"); }
    if (cImg) { cImg.src = ""; cImg.classList.remove("card-legendary", "card-rare"); }
    
    const cardName = document.getElementById("card-name");
    const cardType = document.getElementById("card-type");
    const cardAtk = document.getElementById("card-atk");
    const cardDef = document.getElementById("card-def");
    
    // Reseta o painel de detalhes para o estado inicial de fábrica
    if (cardName) cardName.innerText = "Selecione";
    if (cardType) cardType.innerText = "uma carta";
    if (cardAtk) cardAtk.innerText = "ATK: 0";
    if (cardDef) cardDef.innerText = "DEF: 0";
    // 2. Reseta o cenário de fundo para o padrão
    document.body.style.background = "#0a0a12";
    document.body.style.boxShadow = "none";

    // Atualiza o placar visual de LPs na tela
    await updateScore(); 

    if (state.score.logBox) {
        state.score.logBox.innerText = `Oponente #${state.score.currentStreak + 1} desafia você!`;
    }

    state.actions.isPlayerTurn = true;
    await init();
}

 async function playAudio(status){
   const audio = new Audio(`src/assets/audios/${status}.wav`);
   
   try {
     audio.play();
   } catch {}
 }
 
async function checkGameOver() {
    // Se o Computador perdeu todos os LPs (Vitória do Jogador)
    if (state.score.computerLP <= 0) {
        state.score.globalWins += 1;
        state.score.currentStreak += 1; // Aumenta a sequência atual
        
        // CORREÇÃO AQUI: Convertendo o número para String antes de salvar
        localStorage.setItem("globalWins", state.score.globalWins.toString()); 
        
        // O próximo inimigo ganha 8000 de vida para o próximo duelo!
    state.score.computerLP = 8000;
        
        if (state.score.logBox) {
        state.score.logBox.innerText = `OPONENTE DERROTADO! 🔥 Sequência atual: ${state.score.currentStreak} vitórias!`;
    }
        await playAudio("win");
        alert(`Você venceu o oponente #${state.score.currentStreak}! Prepare-se para o próximo!`);
        return true;
    }

    // Se o Jogador perdeu todos os LPs (Derrota do Jogador)
    if (state.score.playerLP <= 0) {
        state.score.globalLosses += 1;
        
        // CORREÇÃO AQUI: Convertendo o número para String antes de salvar
        localStorage.setItem("globalLosses", state.score.globalLosses.toString()); 
        
        /*state.score.logBox.innerText = `GAME OVER! 💀 Placar Geral: ${state.score.globalWins} VIT / ${state.score.globalLosses} DER`;*/
        await playAudio("lose");
        alert(`Fim da linha! Você sobreviveu a ${state.score.currentStreak} oponentes.`);
    state.score.currentStreak = 0; // Reseta a sequência ao morrer
    
    state.score.playerLP = 8000;    // Cura você completamente para a nova tentativa
        state.score.computerLP = 8000;  // Cura a IA completamente
        return true;
    }
    return false;
}

function resetGameTotal() {
  state.score.playerLP = 8000;
  state.score.computerLP = 8000;
  /*state.score.playerScore = 0;
  state.score.computerScore = 0;*/
  updateScore();
  resetDuel();
  
}
  
function init(){
   // CAPTURA SEGURA: O HTML já existe na tela agora!
    state.score.logBox = document.getElementById("log-text");

    // Código que exibe o placar logo na largada (agora sem perigo de quebrar)
    if (state.score.logBox) {
        state.score.logBox.innerText = `Escolha sua carta | Histórico: ${state.score.globalWins}W - ${state.score.globalLosses}L`;
    }
  
  ShowHiddenCardFieldsImages(false);
  
  drawCards(5, playerSides.player1);
  drawCards(5, playerSides.computer);
  
// Aguarda o navegador carregar tudo antes de tentar achar os elementos
window.addEventListener('load', () => {
  document.body.addEventListener("click", () => {
    const bmg = document.getElementById("bmg");
    if (bmg) {
      bmg.volume = 0.2;
      bmg.play().catch(() => {}); // O catch vazio evita erro se o som falhar
    }
  }, { once: true });
});
}
init();
// Garante que o código só rode após o HTML carregar
// Aguarda o navegador carregar o HTML completamente
window.addEventListener("load", () => {
    const menu = document.getElementById("summon-menu");
    if (menu) {
        // Move o menu para a raiz do documento (fora de flexboxes)
        document.body.appendChild(menu);
    }
});
