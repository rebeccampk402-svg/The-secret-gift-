const steps = [
  {
    title: "Bienvenue dans ta surprise",
    body: "Une petite aventure t’attend… Prends ton temps, ouvre bien les yeux et profite de chaque étape. ❤️",
    type: "intro"
  },
  {
    title: "A Blast from the Past",
    body: "Remonte dans tes souvenirs et découvre la première partie de ta surprise.",
    type: "questions",
    questions: [
      {
        text: "Quel souvenir de notre histoire te fait le plus sourire ?",
        choices: [
          ["Notre première rencontre", false, "Ce n'est pas le souvenir que je cherche 😊"],
          ["Notre première sortie ensemble", false, "Pas encore 😊 Essaie une autre réponse."],
          ["Le jour où nous avons beaucoup ri ensemble", false, "Ce n’est pas encore ça 😄"],
          ["Le moment où nous sommes devenus proches", true, "Bravo ! 🎉 Tu te souviens bien."]
        ]
      },
      {
        text: "Quelle petite chose chez moi te fait toujours sourire ?",
        choices: [
          ["Ton sourire", false, "Pas encore 😊"],
          ["Ta façon de parler", false, "Pas encore 😄"],
          ["Ta gentillesse", false, "Pas encore 😊"],
          ["Ton rire", true, "Exact ! 🎉 Tu me connais bien."]
        ]
      },
      {
        text: "Si tu pouvais revivre un moment avec moi, lequel choisirais-tu ?",
        choices: [
          ["Notre première conversation", false, "Pas exactement 😊"],
          ["Le moment où nous sommes devenus proches", true, "Exact ! ❤️ C’est bien ce moment."],
          ["Une soirée où nous avons beaucoup ri", false, "Pas exactement 😄"],
          ["Le jour où nous avons fait une sortie ensemble", false, "Ce n’est pas encore ça 😊"]
        ]
      },
      {
        text: "Quelle est la chose que tu apprécies le plus chez moi ?",
        choices: [
          ["Ta gentillesse", true, "Exact ! ❤️ C’est ce que j’apprécie le plus chez toi."],
          ["Ton sourire", false, "Pas exactement 😊"],
          ["Ta façon de parler", false, "Pas encore 😄"],
          ["Ton rire", false, "Ce n’est pas encore ça 😊"]
        ]
      }
    ]
  },
  {
    title: "A Little Challenge",
    body: "Maintenant, voyons si tu me connais vraiment… 😉",
    type: "questions",
    questions: [
      {
        text: "Si on devait passer une journée ensemble sans aucun programme, qu’est-ce qu’on ferait probablement ?",
        choices: [
          ["Regarder un film ensemble", false, "Pas exactement 😊"],
          ["Faire quelque chose de spontané ensemble", true, "Exact ! 🎉 Tu as bien deviné."]
        ]
      },
      {
        text: "Quelle serait la première chose que tu choisirais pour me faire plaisir ?",
        choices: [
          ["Te préparer une petite surprise", false, "Pas exactement 😊"],
          ["Faire quelque chose que tu aimes vraiment", true, "Exact ! 🎉 Tu sais comment me faire plaisir."]
        ]
      }
    ]
  },
  {
    title: "A Soundtrack for You",
    body: "Parce que certains souvenirs ont leur propre bande-son… 🎵",
    type: "audio"
  },
  {
    title: "Through the Memories",
    body: "Quelques souvenirs à revivre, un moment à la fois… 📸❤️",
    type: "memories"
  },
  {
    title: "Something I Want You to Know",
    body: "Il y a quelque chose que j’aimerais vraiment que tu saches… ❤️",
    type: "message"
  },
  {
    title: "The Final Clue",
    body: "Tu es presque arrivé(e) au bout… mais il reste un dernier indice. 🔐",
    type: "clue"
  },
  {
    title: "The Reveal",
    body: "Et maintenant… découvre enfin qui a préparé cette surprise pour toi. 🎁❤️",
    type: "reveal"
  }
];

let current = 0;
let questionIndex = 0;

const screen = document.getElementById("screen");
const progress = document.getElementById("progress");
const music = new Audio("a.mp3");
const humanMusic = new Audio("human.mp3");
music.volume = 0.5;
humanMusic.volume = 0.5;

function renderProgress() {
  progress.innerHTML = steps.map((_, i) =>
    `<span class="dot ${i === current ? "active" : ""}"></span>`
  ).join("");
}

function render() {
  renderProgress();
  const step = steps[current];

if (step.type === "intro") {
  screen.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    ">
      <img src="accueil.png" alt="Pour toi" style="
        width: 100%;
        height: 100%;
        object-fit: contain;
      ">
      <button class="primary" onclick="music.play(); nextStep()" style="
      
        position: absolute;
        bottom: 12%;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        max-width: 280px;
        z-index: 10;
      ">
        ✦ &nbsp; Commencer l’aventure &nbsp; →
      </button>
    </div>
  `;
  return;
}
  
    
  if (step.type === "questions") {
    const q = step.questions[questionIndex];
    screen.innerHTML = `
      <article class="step-card">
        <div class="step-number">${String(current + 1).padStart(2, "0")} / ${steps.length}</div>
        <h2>${step.title}</h2>
        <p class="body-copy">${step.body}</p>
        <h3>${q.text}</h3>
        <div class="choices">
          ${q.choices.map((c, i) => `<button class="choice" onclick="answer(${i})">${c[0]}</button>`).join("")}
        </div>
        <div id="feedback"></div>
      </article>`;
    return;
  }

  const generic = {
    audio: ["🎵", "Écoute bien…", "Cette partie sera reliée à ton audio/musique dans Supabase."],
    memories: ["📸", "Quelques souvenirs…", "Les photos et leurs petits textes seront chargés ici."],
    message: ["❤️", "Something I Want You to Know", ""],
    clue: ["🔐", "The Final Clue", "Ton dernier indice sera affiché ici."],
    reveal: ["🎁", "The Reveal", "La révélation finale sera affichée ici."]
  }[step.type];
  if (step.type === "message") {  
    humanMusic.currentTime = 0;
  humanMusic.play().catch(() => {});
  const messageLines = [
    "Voilà une année qui finit et une autre qui commence…",
    "Celle qui ne nous promet ni de beaux jours, ni de mauvais jours.",
    "Elle nous promet seulement d'être là quand quelque chose de beau grandira, même au cœur des jours difficiles.",
    "J'ai rêvé d'une histoire qui me ferait sourire et voyager à travers ton regard.",
    "Mais celle-ci m'a appris que parfois, pleurer fait naître quelque chose de précieux dans nos cœurs.",
    "Ce ne sont pas des larmes de chagrin… mais un rire du cœur qui se révèle sous mes yeux chargés d'inquiétude.",
    "Ce n'est pas de la peur, mais l'espoir que je nourris que cette histoire ne s'arrête pas à un tour de soleil.",
    "J'ai cherché partout quelqu'un de mieux que toi.",
    "Je ne dirai pas ne pas l'avoir trouvé : je l'ai croisé. Et bien au-delà de ce à quoi je m'attendais.",
    "Mais vois-tu… cette personne n'avait pas ton regard.",
    "Elle n'avait pas ta façon de me dire que même dans le silence, tu serais là.",
    "Un soir, une nuit, une amitié est née et continue de grandir…",
    "Parce qu'il n'existe rien de plus beau que cela : un sentiment sincère.",
    "Un nouveau jour où tout n'est pas parfait, mais court vers la perfection.",
    "Chaque jour devient un éclat d'intention partagé.",
    "En cette nouvelle traversée du temps, je ne te souhaite pas ce que mes mains ne peuvent offrir.",
    "Je te souhaite une présence… celle qui demeure quand les instants deviennent inestimables.",
    "Et cette présence, sans détour ni promesse vaine, est celle qui t'écrit aujourd'hui.",
    "Simplement. ❤️"
  ];

  screen.innerHTML = `
    <article class="step-card">
      <div class="step-number">${String(current + 1).padStart(2, "0")} / ${steps.length}</div>
      <div style="font-size:42px">❤️</div>
      <h2>Something I Want You to Know</h2>
      <div id="messageText"></div>
      <div id="messageContinue"></div>
    </article>
  `;

  let i = 0;

  function showMessageLine() {
    if (i < messageLines.length) {
      const p = document.createElement("p");
      p.className = "body-copy";
      p.textContent = messageLines[i];
      document.getElementById("messageText").appendChild(p);
      i++;
      setTimeout(showMessageLine, 5000);
    } else {
      document.getElementById("messageContinue").innerHTML =
        `<button class="primary continue" onclick="nextStep()">Continuer →</button>`;
    }
  }

  showMessageLine();
  return;
  }

  if (step.type === "reveal") {
    screen.innerHTML = `<div class="final">
      <div class="heart">${generic[0]}</div>
      <div class="eyebrow">${generic[1]}</div>
      <h1>C’était moi. ❤️</h1>
      <p class="lead">La personne derrière cette surprise… c’est moi.</p>
    </div>`;
    return;
  }

  screen.innerHTML = `
    <article class="step-card">
      <div class="step-number">${String(current + 1).padStart(2, "0")} / ${steps.length}</div>
      <div style="font-size:42px">${generic[0]}</div>
      <h2>${generic[1]}</h2>
      <p class="body-copy">${step.body}</p>
      <p class="body-copy">${generic[2]}</p>
      <button class="primary continue" onclick="nextStep()">Continuer →</button>
    </article>`;
}

function answer(index) {
  const q = steps[current].questions[questionIndex];
  const choice = q.choices[index];
  const feedback = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".choice");
  buttons[index].classList.add(choice[1] ? "correct" : "wrong");
  feedback.innerHTML = `<div class="feedback">${choice[2]}</div>`;

  if (choice[1]) {
    const next = document.createElement("button");
    next.className = "primary continue";
    next.textContent = questionIndex < q.length ? "Continuer →" : "Continuer →";
    next.onclick = () => {
      questionIndex++;
      if (questionIndex >= steps[current].questions.length) {
        current++;
        questionIndex = 0;
      }
      render();
    };
    feedback.appendChild(next);
  }
}

function nextStep() {
  if (current < steps.length - 1) {
    current++;
    questionIndex = 0;
    render();
  }
}

window.answer = answer;
window.nextStep = nextStep;

render();
