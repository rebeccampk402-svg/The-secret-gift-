/* =========================================================
   THE SECRET GIFT
   Garden — Anniversaire
   ========================================================= */

const SUPABASE_URL =
  "https://djujhfmusguvxqremdpp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_oJHpVpdT0-l_05ng5iTweQ_NZj5yuDg";

const SURPRISE_ID =
  "52889a77-b944-46e9-8a1a-d6f21dad11e8";

const BACKGROUND_MUSIC_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/mixkit-fright-night-871.mp3";

const FALLBACK_CHRISTINA_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/Christina.mp3";


/* =========================================================
   SUPABASE
   ========================================================= */

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   VARIABLES
   ========================================================= */

let steps = [];
let questions = [];
let answers = [];
let media = [];

let currentStepIndex = 0;
let totalSteps = 9;

let backgroundMusic = null;
let christinaAudio = null;


/* =========================================================
   ELEMENTS HTML
   ========================================================= */

const welcomeScreen =
  document.getElementById("welcome-screen");

const surpriseScreen =
  document.getElementById("surprise-screen");

const welcomeTitle =
  document.getElementById("welcome-title");

const welcomeText =
  document.getElementById("welcome-text");

const startButton =
  document.getElementById("start-button");

const currentStepCounter =
  document.getElementById("step-number");

const stepTitle =
  document.getElementById("step-title");

const stepBody =
  document.getElementById("step-body");

const questionContainer =
  document.getElementById("question-container");

const feedbackContainer =
  document.getElementById("feedback-container");

const mediaContainer =
  document.getElementById("media-container");

const actionContainer =
  document.getElementById("action-container");

backgroundMusic =
  document.getElementById("background-music");

christinaAudio =
  document.getElementById("christina-audio");


/* =========================================================
   INITIAL AUDIO CONFIGURATION
   ========================================================= */

if (backgroundMusic) {
  backgroundMusic.loop = true;
  backgroundMusic.preload = "auto";
}

if (christinaAudio) {
  christinaAudio.preload = "metadata";
}


/* =========================================================
   UTILITAIRES
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatText(text) {
  return escapeHtml(text)
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    )
    .replace(/\n/g, "<br>");
}


function clearStepAreas() {
  if (stepBody) {
    stepBody.innerHTML = "";
  }

  if (questionContainer) {
    questionContainer.innerHTML = "";
  }

  if (feedbackContainer) {
    feedbackContainer.innerHTML = "";
  }

  if (mediaContainer) {
    mediaContainer.innerHTML = "";
  }

  if (actionContainer) {
    actionContainer.innerHTML = "";
  }
}


function normalizeMediaType(type) {
  return String(type || "")
    .trim()
    .toLowerCase();
}


function isImageMedia(item) {
  const type =
    normalizeMediaType(item.media_type);

  return [
    "image",
    "photo",
    "picture",
    "img"
  ].includes(type);
}


function isVideoMedia(item) {
  const type =
    normalizeMediaType(item.media_type);

  return [
    "video",
    "mp4",
    "movie"
  ].includes(type);
}


function isAudioMedia(item) {
  const type =
    normalizeMediaType(item.media_type);

  return [
    "audio",
    "mp3",
    "music",
    "sound"
  ].includes(type);
}


/* =========================================================
   MÉDIAS
   ========================================================= */

function getStepMedia(stepId) {
  return media
    .filter(
      item => item.step_id === stepId
    )
    .sort((a, b) => {
      const dateA =
        new Date(
          a.created_at || 0
        ).getTime();

      const dateB =
        new Date(
          b.created_at || 0
        ).getTime();

      return dateA - dateB;
    });
}


/* =========================================================
   QUESTIONS
   ========================================================= */

function getQuestionForStep(stepId) {
  return questions.find(
    question =>
      question.step_id === stepId
  );
}


function getAnswersForQuestion(questionId) {
  return answers
    .filter(
      answer =>
        answer.question_id === questionId
    )
    .sort((a, b) => {
      const orderA =
        Number(a.choice_order ?? 999);

      const orderB =
        Number(b.choice_order ?? 999);

      return orderA - orderB;
    });
}


/* =========================================================
   TRANSITIONS
   ========================================================= */

function showTransition(
  html,
  buttonText,
  callback
) {
  if (!actionContainer) {
    return;
  }

  actionContainer.innerHTML = "";

  if (html) {
    const transition =
      document.createElement("div");

    transition.className =
      "transition-text fade-in";

    transition.innerHTML = html;

    actionContainer.appendChild(
      transition
    );
  }

  if (buttonText && callback) {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "primary-button";

    button.textContent =
      buttonText;

    button.addEventListener(
      "click",
      callback
    );

    actionContainer.appendChild(
      button
    );
  }
}


/* =========================================================
   ANIMATION
   ========================================================= */

function animateStepChange(callback) {
  const card =
    surpriseScreen
      ? surpriseScreen.querySelector(".card")
      : null;

  if (!card) {
    callback();
    return;
  }

  card.classList.remove("fade-in");
  card.classList.add("fade-out");

  setTimeout(() => {
    card.classList.remove("fade-out");
    callback();
    card.classList.add("fade-in");
  }, 300);
}


/* =========================================================
   MUSIQUE DE FOND
   ========================================================= */

function startBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  if (!backgroundMusic.src) {
    backgroundMusic.src =
      BACKGROUND_MUSIC_URL;
  }

  backgroundMusic.loop = true;

  const promise =
    backgroundMusic.play();

  if (
    promise &&
    typeof promise.catch === "function"
  ) {
    promise.catch(() => {});
  }
}


function pauseBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.pause();
}


function resumeBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  if (
    currentStepIndex >= totalSteps
  ) {
    return;
  }

  const promise =
    backgroundMusic.play();

  if (
    promise &&
    typeof promise.catch === "function"
  ) {
    promise.catch(() => {});
  }
}


/* =========================================================
   CHARGEMENT SUPABASE
   ========================================================= */

async function loadAllData() {

  /* ---------- SURPRISE ---------- */

  const surpriseResult =
    await supabaseClient
      .from("surprises")
      .select("*")
      .eq("id", SURPRISE_ID)
      .maybeSingle();

  if (surpriseResult.error) {
    throw new Error(
      "Impossible de charger la surprise : " +
      surpriseResult.error.message
    );
  }

  if (!surpriseResult.data) {
    throw new Error(
      "La surprise Garden est introuvable."
    );
  }


  /* ---------- ÉTAPES ---------- */

  const stepsResult =
    await supabaseClient
      .from("steps")
      .select("*")
      .eq(
        "surprise_id",
        SURPRISE_ID
      )
      .order(
        "step_number",
        {
          ascending: true
        }
      );

  if (stepsResult.error) {
    throw new Error(
      "Impossible de charger les étapes : " +
      stepsResult.error.message
    );
  }

  steps =
    stepsResult.data || [];

  if (!steps.length) {
    throw new Error(
      "Aucune étape n'a été trouvée."
    );
  }

  totalSteps =
    steps.length;


  /* ---------- QUESTIONS ---------- */

  const stepIds =
    steps.map(step => step.id);

  const questionsResult =
    await supabaseClient
      .from("questions")
      .select("*")
      .in(
        "step_id",
        stepIds
      );

  if (questionsResult.error) {
    throw new Error(
      "Impossible de charger les questions : " +
      questionsResult.error.message
    );
  }

  questions =
    questionsResult.data || [];


  /* ---------- RÉPONSES ---------- */

  const questionIds =
    questions.map(
      question => question.id
    );

  if (questionIds.length) {

    const answersResult =
      await supabaseClient
        .from("answer_choices")
        .select("*")
        .in(
          "question_id",
          questionIds
        );

    if (answersResult.error) {
      throw new Error(
        "Impossible de charger les réponses : " +
        answersResult.error.message
      );
    }

    answers =
      answersResult.data || [];

  } else {
    answers = [];
  }


  /* ---------- MÉDIAS ---------- */

  const mediaResult =
    await supabaseClient
      .from("media")
      .select("*")
      .in(
        "step_id",
        stepIds
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );

  if (mediaResult.error) {
    throw new Error(
      "Impossible de charger les médias : " +
      mediaResult.error.message
    );
  }

  media =
    mediaResult.data || [];


  /* ---------- MUSIQUE DE FOND ---------- */

  if (backgroundMusic) {
    backgroundMusic.src =
      BACKGROUND_MUSIC_URL;

    backgroundMusic.load();
  }


  /* ---------- CHRISTINA ---------- */

  const stepFour =
    steps.find(
      step =>
        Number(step.step_number) === 4
    );

  if (stepFour && christinaAudio) {

    const audioMedia =
      getStepMedia(
        stepFour.id
      ).find(isAudioMedia);

    christinaAudio.src =
      audioMedia?.media_url ||
      FALLBACK_CHRISTINA_URL;

    christinaAudio.load();
  }
}


/* =========================================================
   PROGRESSION
   ========================================================= */

async function saveProgress(
  stepNumber
) {
  try {

    const existing =
      await supabaseClient
        .from("progress")
        .select("id")
        .eq(
          "surprise_id",
          SURPRISE_ID
        )
        .maybeSingle();

    if (existing.error) {
      return;
    }

    const payload = {
      surprise_id: SURPRISE_ID,
      current_step: stepNumber,
      updated_at:
        new Date().toISOString()
    };

    if (existing.data?.id) {

      await supabaseClient
        .from("progress")
        .update(payload)
        .eq(
          "id",
          existing.data.id
        );

    } else {

      await supabaseClient
        .from("progress")
        .insert(payload);
    }

  } catch (error) {

    console.warn(
      "Progression non enregistrée :",
      error
    );
  }
}


/* =========================================================
   BOUTON COMMENCER
   ========================================================= */

if (startButton) {

  startButton.addEventListener(
    "click",
    async () => {

      startBackgroundMusic();

      if (welcomeScreen) {
        welcomeScreen.classList.add(
          "hidden"
        );
      }

      if (surpriseScreen) {
        surpriseScreen.classList.remove(
          "hidden"
        );
      }

      currentStepIndex = 0;

      await renderCurrentStep();
    }
  );
}


/* =========================================================
   AFFICHAGE DE L'ÉTAPE ACTUELLE
   ========================================================= */

async function renderCurrentStep() {

  clearStepAreas();

  const step =
    steps[currentStepIndex];

  if (!step) {
    finishSurprise();
    return;
  }

  const stepNumber =
    Number(
      step.step_number ||
      currentStepIndex + 1
    );


  /* ---------- COMPTEUR ---------- */

  if (currentStepCounter) {
    currentStepCounter.textContent =
      String(stepNumber).padStart(2, "0") +
      " / " +
      String(totalSteps).padStart(2, "0");
  }


  /* ---------- TITRE ---------- */

  if (stepTitle) {
    stepTitle.textContent =
      step.title || "";
  }


  /* ---------- CORPS ---------- */

  if (
    stepBody &&
    step.body_text
  ) {
    stepBody.innerHTML =
      '<p class="message">' +
      formatText(step.body_text) +
      "</p>";
  }


  /* ---------- PROGRESSION ---------- */

  await saveProgress(
    stepNumber
  );


  /* ---------- ROUTAGE ---------- */

  switch (stepNumber) {

    case 1:
      renderStepOne();
      break;

    case 2:
      renderStepTwo(step);
      break;

    case 3:
      renderStepThree(step);
      break;

    case 4:
      renderStepFour(step);
      break;

    case 5:
      renderStepFive();
      break;

    case 6:
      renderStepSix();
      break;

    case 7:
      renderStepSeven(step);
      break;

    case 8:
      renderStepEight(step);
      break;

    case 9:
      renderStepNine();
      break;

    default:
      renderGenericStep(step);
      break;
  }
}


/* =========================================================
   PASSER À L'ÉTAPE SUIVANTE
   ========================================================= */

function goToNextStep() {

  animateStepChange(
    async () => {

      currentStepIndex++;

      if (
        currentStepIndex >=
        steps.length
      ) {
        finishSurprise();
        return;
      }

      await renderCurrentStep();
    }
  );
}


/* =========================================================
   FIN
   ========================================================= */

function finishSurprise() {

  pauseBackgroundMusic();

  if (christinaAudio) {
    christinaAudio.pause();
  }

  currentStepIndex =
    steps.length;

  clearStepAreas();

  if (currentStepCounter) {
    currentStepCounter.textContent =
      String(totalSteps).padStart(2, "0") +
      " / " +
      String(totalSteps).padStart(2, "0");
  }

  if (stepTitle) {
    stepTitle.textContent =
      "Fin de la surprise ❤️";
  }

  if (stepBody) {
    stepBody.innerHTML =
      '<p class="final-message">' +
      "Merci d’avoir vécu cette petite aventure jusqu’au bout. ❤️" +
      "</p>";
  }
}
/* =========================================================
   ÉTAPE 1
   ========================================================= */

function renderStepOne() {

  showTransition(
    "Quand tu es prêt…<br>" +
    "la surprise peut commencer. ✨",
    "Continuer ❤️",
    goToNextStep
  );
}


/* =========================================================
   ÉTAPE 2
   A BLAST FROM THE PAST
   ========================================================= */

const stepTwoCaptions = [

  "Certains souvenirs commencent simplement…",

  "Puis on découvre peu à peu les différentes facettes d’une personne.",

  "Et certains moments restent surtout pour le sourire qu’ils nous laissent. ❤️",

  "Parce que les souvenirs les plus simples peuvent parfois devenir les plus précieux.",

  "Et puis il y a ces moments qu’on n’oublie pas…"
];


function renderStepTwo(step) {

  const photos =
    getStepMedia(step.id)
      .filter(isImageMedia);

  let photoIndex = 0;


  function showPhoto() {

    if (mediaContainer) {
      mediaContainer.innerHTML =
        "";
    }

    if (actionContainer) {
      actionContainer.innerHTML =
        "";
    }


    if (!photos[photoIndex]) {
      showStepTwoQuestion();
      return;
    }


    const item =
      photos[photoIndex];


    const block =
      document.createElement("div");

    block.className =
      "media-block fade-in";


    const image =
      document.createElement("img");

    image.src =
      item.media_url;

    image.alt =
      "Souvenir " +
      (photoIndex + 1);

    image.loading =
      "eager";


    const caption =
      document.createElement("p");

    caption.className =
      "caption";

    caption.textContent =
      stepTwoCaptions[
        photoIndex
      ] ||
      item.caption ||
      "";


    block.appendChild(image);
    block.appendChild(caption);


    if (mediaContainer) {
      mediaContainer.appendChild(
        block
      );
    }


    const button =
      document.createElement("button");

    button.type =
      "button";

    button.className =
      "primary-button";

    button.textContent =
      photoIndex ===
      photos.length - 1
        ? "Continuer ❤️"
        : "Continuer";


    button.addEventListener(
      "click",
      () => {

        photoIndex++;

        showPhoto();
      }
    );


    if (actionContainer) {
      actionContainer.appendChild(
        button
      );
    }
  }


  if (!photos.length) {

    showStepTwoQuestion();

  } else {

    showPhoto();
  }
}


/* =========================================================
   QUESTION ÉTAPE 2
   ========================================================= */

function showStepTwoQuestion() {

  if (mediaContainer) {
    mediaContainer.innerHTML =
      "";
  }

  if (actionContainer) {
    actionContainer.innerHTML =
      "";
  }


  const transition =
    document.createElement("div");

  transition.className =
    "transition-text fade-in";

  transition.innerHTML =
    "Mais est-ce que tu te souviens vraiment ? 👀<br>" +
    "Voyons ça…";


  if (actionContainer) {
    actionContainer.appendChild(
      transition
    );
  }


  const step =
    steps[currentStepIndex];

  if (!step) {
    return;
  }


  const question =
    getQuestionForStep(
      step.id
    );


  if (!question) {

    const button =
      document.createElement("button");

    button.type =
      "button";

    button.textContent =
      "Continuer ❤️";

    button.addEventListener(
      "click",
      goToNextStep
    );

    if (actionContainer) {
      actionContainer.appendChild(
        button
      );
    }

    return;
  }


  renderQuestion(question);
}


/* =========================================================
   ÉTAPE 3
   A LITTLE CHALLENGE
   ========================================================= */

function renderStepThree(step) {

  const question =
    getQuestionForStep(
      step.id
    );


  if (!question) {

    showTransition(
      "Le défi est terminé. 🌙✨",
      "Continuer ❤️",
      goToNextStep
    );

    return;
  }


  renderQuestion(question);
}


/* =========================================================
   AFFICHAGE DES QUESTIONS
   ========================================================= */

function renderQuestion(question) {

  const choices =
    getAnswersForQuestion(
      question.id
    );


  if (questionContainer) {

    questionContainer.innerHTML =
      '<div class="question">' +
      "<strong>" +
      formatText(
        question.question_text
      ) +
      "</strong>" +
      "</div>";
  }


  choices.forEach(
    answer => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "choice-button";

      button.textContent =
        answer.choice_text;


      button.addEventListener(
        "click",
        () => {

          handleAnswer(
            question,
            answer
          );
        }
      );


      if (questionContainer) {
        questionContainer.appendChild(
          button
        );
      }
    }
  );
}


/* =========================================================
   RÉPONSE À UNE QUESTION
   ========================================================= */

function handleAnswer(
  question,
  selectedAnswer
) {

  const buttons =
    questionContainer
      ? Array.from(
          questionContainer.querySelectorAll(
            ".choice-button"
          )
        )
      : [];


  buttons.forEach(
    button => {
      button.disabled =
        true;
    }
  );


  if (feedbackContainer) {

    feedbackContainer.innerHTML =
      '<div class="feedback fade-in">' +
      formatText(
        selectedAnswer.feedback ||
        ""
      ) +
      "</div>";
  }


  if (
    selectedAnswer.is_correct
  ) {

    if (actionContainer) {
      actionContainer.innerHTML =
        "";
    }


    const continueButton =
      document.createElement(
        "button"
      );

    continueButton.type =
      "button";

    continueButton.className =
      "primary-button";

    continueButton.textContent =
      "Continuer ❤️";


    continueButton.addEventListener(
      "click",
      goToNextStep
    );


    if (actionContainer) {
      actionContainer.appendChild(
        continueButton
      );
    }

  } else {

    if (actionContainer) {
      actionContainer.innerHTML =
        "";
    }


    const retryButton =
      document.createElement(
        "button"
      );

    retryButton.type =
      "button";

    retryButton.className =
      "primary-button";

    retryButton.textContent =
      "Réessayer";


    retryButton.addEventListener(
      "click",
      () => {

        if (feedbackContainer) {
          feedbackContainer.innerHTML =
            "";
        }

        if (actionContainer) {
          actionContainer.innerHTML =
            "";
        }

        renderQuestion(
          question
        );
      }
    );


    if (actionContainer) {
      actionContainer.appendChild(
        retryButton
      );
    }
  }
}


/* =========================================================
   ÉTAPE 4
   ÉCOUTE BIEN…
   ========================================================= */

function renderStepFour(step) {

  pauseBackgroundMusic();


  const audioMedia =
    getStepMedia(step.id)
      .find(isAudioMedia);


  if (
    christinaAudio &&
    audioMedia &&
    audioMedia.media_url
  ) {

    christinaAudio.src =
      audioMedia.media_url;

    christinaAudio.load();
  }


  if (mediaContainer) {
    mediaContainer.innerHTML =
      "";
  }

  if (actionContainer) {
    actionContainer.innerHTML =
      "";
  }


  const beforeText =
    document.createElement("p");

  beforeText.className =
    "message";

  beforeText.innerHTML =
    "Cette fois, pas d’énigme. 🎧<br>" +
    "Juste un moment pour écouter… et laisser la musique parler. ❤️<br>" +
    "Mets-toi à l’aise, écoute bien jusqu’au bout. Peut-être que tu comprendras pourquoi j’ai choisi cette chanson pour toi. ✨";


  if (mediaContainer) {
    mediaContainer.appendChild(
      beforeText
    );
  }


  if (
    christinaAudio &&
    christinaAudio.src
  ) {

    const block =
      document.createElement(
        "div"
      );

    block.className =
      "media-block";


    block.appendChild(
      christinaAudio
    );


    if (mediaContainer) {
      mediaContainer.appendChild(
        block
      );
    }


    christinaAudio.onended =
      () => {

        showAfterChristina();
      };


    christinaAudio
      .play()
      .catch(() => {});


    /* -----------------------------------------------------
       BOUTON DE SECOURS
       Certains navigateurs mobiles peuvent empêcher
       l'événement audio de fonctionner comme prévu.
       ----------------------------------------------------- */

    const manualButton =
      document.createElement(
        "button"
      );

    manualButton.type =
      "button";

    manualButton.className =
      "secondary-button";

    manualButton.textContent =
      "Continuer après l’écoute ❤️";


    manualButton.addEventListener(
      "click",
      () => {

        showAfterChristina();
      }
    );


    if (actionContainer) {
      actionContainer.appendChild(
        manualButton
      );
    }

  } else {

    if (mediaContainer) {

      mediaContainer.innerHTML +=
        '<p class="error-message">' +
        "Le fichier Christina.mp3 n’a pas pu être chargé." +
        "</p>";
    }


    showAfterChristina();
  }
}


/* =========================================================
   APRÈS CHRISTINA
   ========================================================= */

function showAfterChristina() {

  if (christinaAudio) {
    christinaAudio.onended =
      null;
  }


  if (mediaContainer) {

    const afterText =
      document.createElement("p");

    afterText.className =
      "message fade-in";

    afterText.innerHTML =
      "Alors… qu’est-ce que cette chanson t’a fait ressentir ? ❤️<br>" +
      "Certaines choses sont difficiles à expliquer avec des mots.<br>" +
      "Parfois, une chanson peut simplement dire ce qu’on n’arrive pas à dire soi-même. 🎧❤️<br>" +
      "Mais ne t’arrête pas là…<br>" +
      "<strong>La suite t’attend. 👀</strong>";


    mediaContainer.appendChild(
      afterText
    );
  }


  if (actionContainer) {
    actionContainer.innerHTML =
      "";
  }


  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "primary-button";

  button.textContent =
    "Continuer ❤️";


  button.addEventListener(
    "click",
    () => {

      resumeBackgroundMusic();

      goToNextStep();
    }
  );


  if (actionContainer) {
    actionContainer.appendChild(
      button
    );
  }


  resumeBackgroundMusic();
}


/* =========================================================
   ÉTAPE 5
   UN MESSAGE POUR TOI ❤️
   ========================================================= */

function renderStepFive() {

  if (!stepBody) {
    return;
  }


  stepBody.innerHTML =
    '<p class="message">' +

    "Après les souvenirs, le défi et la musique…<br>" +
    "J’avais encore quelques mots que je voulais spécialement te laisser. ❤️<br><br>" +

    "Il y a des personnes qui passent simplement dans notre vie.<br>" +
    "Et puis il y a celles qui, sans forcément le savoir, finissent par y laisser une petite trace. ✨<br><br>" +

    "Tu fais partie de ces personnes.<br><br>" +

    "Je ne vais pas tout t’expliquer maintenant…<br>" +
    "Parce qu’il reste encore quelques petites choses à découvrir. 👀❤️<br><br>" +

    "Alors garde encore un peu de patience.<br>" +
    "<strong>La suite arrive… ✨</strong>" +

    "</p>";


  showTransition(
    "",
    "Continuer ❤️",
    goToNextStep
  );
}


/* =========================================================
   ÉTAPE 6
   QUELQUES MOTS POUR TOI ❤️
   ========================================================= */

function renderStepSix() {

  if (!stepBody) {
    return;
  }


  stepBody.innerHTML =
    '<p class="message">' +

    "Après les souvenirs, le défi et la musique…<br>" +
    "J’avais encore quelques mots que je voulais spécialement te laisser. ❤️<br><br>" +

    "Il y a des personnes qui passent simplement dans notre vie.<br>" +
    "Et puis il y a celles qui, sans forcément le savoir,<br>" +
    "finissent par y laisser une petite trace. ✨<br><br>" +

    "Tu fais partie de ces personnes.<br><br>" +

    "Je ne vais pas tout t’expliquer maintenant…<br>" +
    "Parce qu’il reste encore quelques petites choses à découvrir. 👀❤️<br><br>" +

    "Alors garde encore un peu de patience.<br>" +
    "La suite arrive… ✨" +

    "</p>";


  showTransition(
    "",
    "Continuer ❤️",
    goToNextStep
  );
      }
/* =========================================================
   ÉTAPE 7
   DERNIER DÉFI AVANT LA SURPRISE
   ========================================================= */

function renderStepSeven(step) {

  const question =
    getQuestionForStep(
      step.id
    );


  if (!question) {

    showTransition(
      "Un dernier indice avant la surprise… ❤️",
      "Continuer ❤️",
      goToNextStep
    );

    return;
  }


  renderQuestion(question);
}


/* =========================================================
   ÉTAPE 8
   JOYEUX ANNIVERSAIRE, GARDEN !
   ========================================================= */

function renderStepEight(step) {

  const videos =
    getStepMedia(step.id)
      .filter(isVideoMedia);

  let videoIndex = 0;


  function showVideo() {

    if (mediaContainer) {
      mediaContainer.innerHTML =
        "";
    }

    if (actionContainer) {
      actionContainer.innerHTML =
        "";
    }


    if (!videos[videoIndex]) {
      showStepEightEnding();
      return;
    }


    /* -----------------------------------------------------
       PREMIÈRE VIDÉO
       ----------------------------------------------------- */

    if (videoIndex === 0) {

      const before =
        document.createElement(
          "p"
        );

      before.className =
        "message";

      before.innerHTML =
        "Tu es arrivé jusqu’ici…<br>" +
        "Alors cette fois, je ne vais pas te poser de question.<br>" +
        "Je veux simplement te laisser regarder. ❤️<br><br>" +
        "🎬 <strong>Un petit souvenir…</strong><br>" +
        "Regarde bien. 👀";


      if (mediaContainer) {
        mediaContainer.appendChild(
          before
        );
      }


    /* -----------------------------------------------------
       DEUXIÈME VIDÉO
       ----------------------------------------------------- */

    } else {

      const transition =
        document.createElement(
          "div"
        );

      transition.className =
        "transition-text fade-in";

      transition.innerHTML =
        "Et maintenant…<br><br>" +
        "Il y a une autre vidéo que je voulais absolument te montrer.<br>" +
        "Parce que celle-ci me rappelle quelque chose de particulier.<br>" +
        "Un moment que je n’ai pas oublié. ❤️";


      if (mediaContainer) {
        mediaContainer.appendChild(
          transition
        );
      }
    }


    const item =
      videos[videoIndex];


    const block =
      document.createElement(
        "div"
      );

    block.className =
      "media-block fade-in";


    const video =
      document.createElement(
        "video"
      );

    video.src =
      item.media_url;

    video.controls =
      true;

    video.playsInline =
      true;

    video.preload =
      "metadata";


    block.appendChild(
      video
    );


    if (mediaContainer) {
      mediaContainer.appendChild(
        block
      );
    }


    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "primary-button";

    button.textContent =
      videoIndex ===
      videos.length - 1
        ? "Continuer ❤️"
        : "Continuer";


    button.addEventListener(
      "click",
      () => {

        videoIndex++;


        if (
          videoIndex <
          videos.length
        ) {

          showVideo();

        } else {

          showStepEightEnding();
        }
      }
    );


    if (actionContainer) {
      actionContainer.appendChild(
        button
      );
    }
  }


  /* -------------------------------------------------------
     FIN DE L'ÉTAPE 8
     ------------------------------------------------------- */

  function showStepEightEnding() {

    if (mediaContainer) {
      mediaContainer.innerHTML =
        "";
    }

    if (actionContainer) {
      actionContainer.innerHTML =
        "";
    }


    const ending =
      document.createElement(
        "p"
      );

    ending.className =
      "message fade-in";

    ending.innerHTML =
      "Tu m’avais dit quelque chose d’important dans cette vidéo.<br>" +
      "Et aujourd’hui, à mon tour, j’avais envie de te rappeler une chose :<br>" +
      "<strong>tu comptes. ❤️</strong><br><br>" +

      "Peut-être que tu ne comprends pas encore pourquoi j’ai choisi tous ces petits détails pour cette surprise…<br>" +
      "Mais bientôt, tout prendra son sens. ✨<br><br>" +

      "Alors garde encore un peu de patience.<br>" +
      "<strong>Il reste une dernière étape. 👀❤️</strong>";


    if (mediaContainer) {
      mediaContainer.appendChild(
        ending
      );
    }


    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "primary-button";

    button.textContent =
      "Continuer ❤️";


    button.addEventListener(
      "click",
      goToNextStep
    );


    if (actionContainer) {
      actionContainer.appendChild(
        button
      );
    }
  }


  if (!videos.length) {

    showStepEightEnding();

  } else {

    showVideo();
  }
}


/* =========================================================
   ÉTAPE 9
   RÉVÉLATION FINALE
   ========================================================= */

function renderStepNine() {

  pauseBackgroundMusic();


  if (stepBody) {

    stepBody.innerHTML =
      '<p class="final-message">' +

      "Alors…<br>" +
      "Tu as trouvé les indices.<br>" +
      "Tu as traversé les souvenirs.<br>" +
      "Tu as relevé le défi.<br>" +
      "Tu as écouté.<br>" +
      "Tu as regardé.<br>" +
      "Et maintenant, tu sais qui se cachait derrière tout ça. ❤️<br><br>" +

      "<strong>C’était moi. Rebecca.</strong><br><br>" +

      "Mais au fond, cette surprise n’a jamais été seulement une façon de te souhaiter un joyeux anniversaire.<br>" +
      "Je voulais créer quelque chose que tu pourrais découvrir petit à petit.<br>" +
      "Quelque chose qui te ferait sourire, réfléchir, peut-être même te rappeler certains moments. ✨<br><br>" +

      "Et si tu te demandes encore pourquoi j’ai choisi le mot <strong>« Sueño »</strong>…<br>" +

      "C’est parce qu’un sueño, c’est un rêve.<br>" +
      "Quelque chose que l’on imagine, que l’on espère, que l’on aimerait voir devenir réel.<br>" +
      "Et parfois, certains rêves commencent simplement par une rencontre, un souvenir, une personne qui prend une place particulière dans notre histoire. ❤️<br><br>" +

      "Alors aujourd’hui, pour tes <strong>22 ans</strong>…<br>" +
      "Je voulais simplement te dire :<br>" +

      "<strong>Joyeux anniversaire, Garden. 🎂❤️</strong><br><br>" +

      "J’espère que cette nouvelle année de ta vie sera remplie de beaux rêves, de belles rencontres, de réussite et de moments que tu n’oublieras jamais.<br>" +
      "Et surtout…<br>" +

      "<strong>n’arrête jamais de rêver.</strong> 🌙✨<br><br>" +

      "Parce qu’on ne sait jamais jusqu’où un simple <strong>sueño</strong> peut nous mener.<br><br>" +

      "❤️ <strong>Fin de la surprise.</strong>" +

      "</p>";
  }


  if (actionContainer) {
    actionContainer.innerHTML =
      "";
  }


  if (christinaAudio) {
    christinaAudio.pause();
  }


  /* La musique de fond reste arrêtée
     jusqu'à la fin de la surprise. */
  pauseBackgroundMusic();
}


/* =========================================================
   ÉTAPE GÉNÉRIQUE
   ========================================================= */

function renderGenericStep(step) {

  const question =
    getQuestionForStep(
      step.id
    );


  if (question) {

    renderQuestion(
      question
    );

    return;
  }


  showTransition(
    "",
    "Continuer ❤️",
    goToNextStep
  );
}


/* =========================================================
   MESSAGE D'ERREUR
   ========================================================= */

function showLoadingError(message) {

  if (welcomeScreen) {
    welcomeScreen.classList.remove(
      "hidden"
    );
  }

  if (surpriseScreen) {
    surpriseScreen.classList.add(
      "hidden"
    );
  }


  if (welcomeTitle) {
    welcomeTitle.textContent =
      "Oups… ❤️";
  }


  if (welcomeText) {
    welcomeText.innerHTML =
      '<div class="error-message">' +
      escapeHtml(message) +
      "</div>";
  }


  if (startButton) {
    startButton.classList.add(
      "hidden"
    );
  }
}


/* =========================================================
   INITIALISATION
   ========================================================= */

(async function init() {

  try {

    await loadAllData();


    if (welcomeTitle) {
      welcomeTitle.textContent =
        "Bienvenue dans ta surprise ❤️";
    }


    if (welcomeText) {
      welcomeText.textContent =
        "Une petite aventure t’attend… Prends ton temps, ouvre bien les yeux et profite de chaque étape. ❤️";
    }


    if (startButton) {
      startButton.classList.remove(
        "hidden"
      );
    }


  } catch (error) {

    console.error(
      "Erreur The Secret Gift :",
      error
    );


    showLoadingError(
      error.message ||
      "Impossible de charger la surprise."
    );
  }

})();
