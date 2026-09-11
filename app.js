// ============================================================
// THE SECRET GIFT — APP.JS
// Partie 1 / 3
// ============================================================

const SUPABASE_URL = "https://djujhfmusguvxqremdpp.supabase.co";
const SUPABASE_KEY = "sb_publishable_oJHpVpdT0-l_05ng5iTweQ_NZj5yuDg";

const SURPRISE_ID = "52889a77-b944-46e9-8a1a-d6f21dad11e8";

const BACKGROUND_MUSIC_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/mixkit-fright-night-871.mp3";

const CHRISTINA_AUDIO_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/Christina.mp3";

const VIDEO_1_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/VID-20260818-WA0024.mp4";

const VIDEO_2_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/VID-20260209-WA0001.mp4";

const supabaseLib = window.supabase;

if (!supabaseLib) {
  throw new Error("Supabase n’a pas été chargé.");
}

const supabaseClient = supabaseLib.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ============================================================
// ÉTAT DE L'APPLICATION
// ============================================================

let surprise = null;
let steps = [];
let questions = [];
let answers = [];
let media = [];

let currentStepIndex = 0;
let totalSteps = 0;

let stepTwoQuestionIndex = -2;
let stepEightVideoIndex = 0;

let pausedMusicTime = 0;


// ============================================================
// ÉLÉMENTS HTML
// ============================================================

const welcomeScreen = document.getElementById("welcome-screen");
const surpriseScreen = document.getElementById("surprise-screen");

const welcomeTitle = document.getElementById("welcome-title");
const welcomeText = document.getElementById("welcome-text");

const startButton = document.getElementById("start-button");

const stepNumber = document.getElementById("step-number");
const stepTitle = document.getElementById("step-title");
const stepBody = document.getElementById("step-body");

const questionContainer =
  document.getElementById("question-container");

const feedbackContainer =
  document.getElementById("feedback-container");

const mediaContainer =
  document.getElementById("media-container");

const actionContainer =
  document.getElementById("action-container");

const backgroundMusic =
  document.getElementById("background-music");

const christinaAudio =
  document.getElementById("christina-audio");


// ============================================================
// OUTILS
// ============================================================

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatText(value) {
  return escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}


function addButton(
  text,
  callback,
  className = ""
) {
  actionContainer.innerHTML = "";

  const button = document.createElement("button");

  button.type = "button";
  button.textContent = text;

  if (className) {
    button.className = className;
  }

  button.addEventListener("click", callback);

  actionContainer.appendChild(button);

  return button;
}


function isImage(item) {
  if (!item) {
    return false;
  }

  const type = String(item.media_type || "").toLowerCase();
  const url = String(item.media_url || "").toLowerCase();

  return (
    type.includes("image") ||
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/.test(url)
  );
}


function isVideo(item) {
  if (!item) {
    return false;
  }

  const type = String(item.media_type || "").toLowerCase();
  const url = String(item.media_url || "").toLowerCase();

  return (
    type.includes("video") ||
    /\.(mp4|webm|mov|m4v)(\?.*)?$/.test(url)
  );
}


function getQuestionsForStep(stepId) {
  return questions
    .filter((question) => question.step_id === stepId)
    .sort((a, b) => {
      const aOrder =
        Number(a.question_order ?? a.question_number ?? a.id ?? 0);

      const bOrder =
        Number(b.question_order ?? b.question_number ?? b.id ?? 0);

      return aOrder - bOrder;
    });
}


function getAnswersForQuestion(questionId) {
  return answers
    .filter((answer) => answer.question_id === questionId)
    .sort((a, b) => {
      const aOrder = Number(a.choice_order ?? 0);
      const bOrder = Number(b.choice_order ?? 0);

      return aOrder - bOrder;
    });
}


function getStepMedia(stepId) {
  return media
    .filter((item) => item.step_id === stepId)
    .sort((a, b) => {
      const aOrder = Number(a.media_order ?? a.order ?? 0);
      const bOrder = Number(b.media_order ?? b.order ?? 0);

      return aOrder - bOrder;
    });
}


// ============================================================
// MUSIQUE DE FOND
// ============================================================

function prepareBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.src = BACKGROUND_MUSIC_URL;
  backgroundMusic.loop = true;
  backgroundMusic.preload = "auto";
}


async function startBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  try {
    if (!backgroundMusic.src) {
      prepareBackgroundMusic();
    }

    await backgroundMusic.play();
  } catch (error) {
    console.warn(
      "Lecture automatique de la musique bloquée :",
      error
    );
  }
}


function pauseBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  pausedMusicTime = backgroundMusic.currentTime || 0;

  backgroundMusic.pause();
}


async function resumeBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  try {
    if (
      Number.isFinite(pausedMusicTime) &&
      pausedMusicTime >= 0
    ) {
      backgroundMusic.currentTime = pausedMusicTime;
    }

    await backgroundMusic.play();
  } catch (error) {
    console.warn(
      "Impossible de reprendre la musique :",
      error
    );
  }
}


function stopBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}


// ============================================================
// SUPABASE — CHARGEMENT
// ============================================================

async function loadSurprise() {
  const { data, error } = await supabaseClient
    .from("surprises")
    .select("*")
    .eq("id", SURPRISE_ID)
    .single();

  if (error) {
    throw error;
  }

  surprise = data;
}


async function loadSteps() {
  const { data, error } = await supabaseClient
    .from("steps")
    .select("*")
    .eq("surprise_id", SURPRISE_ID)
    .order("step_number", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  steps = data || [];
  totalSteps = steps.length;
}


async function loadQuestions() {
  if (!steps.length) {
    questions = [];
    return;
  }

  const stepIds = steps.map((step) => step.id);

  const { data, error } = await supabaseClient
    .from("questions")
    .select("*")
    .in("step_id", stepIds);

  if (error) {
    throw error;
  }

  questions = data || [];
}


async function loadAnswers() {
  if (!questions.length) {
    answers = [];
    return;
  }

  const questionIds = questions.map(
    (question) => question.id
  );

  const { data, error } = await supabaseClient
    .from("answer_choices")
    .select("*")
    .in("question_id", questionIds)
    .order("choice_order", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  answers = data || [];
}


async function loadMedia() {
  if (!steps.length) {
    media = [];
    return;
  }

  const stepIds = steps.map((step) => step.id);

  const { data, error } = await supabaseClient
    .from("media")
    .select("*")
    .in("step_id", stepIds);

  if (error) {
    throw error;
  }

  media = data || [];
}


async function loadAllData() {
  await loadSurprise();
  await loadSteps();
  await loadQuestions();
  await loadAnswers();
  await loadMedia();
}


// ============================================================
// PROGRESSION
// ============================================================

async function saveProgress() {
  try {
    const currentStep = steps[currentStepIndex];

    if (!currentStep) {
      return;
    }

    const payload = {
      surprise_id: SURPRISE_ID,
      current_step: currentStepIndex + 1,
      updated_at: new Date().toISOString()
    };

    await supabaseClient
      .from("progress")
      .upsert(payload, {
        onConflict: "surprise_id"
      });
  } catch (error) {
    console.warn(
      "La progression n’a pas pu être enregistrée :",
      error
    );
  }
}


// ============================================================
// AFFICHAGE ERREUR
// ============================================================

function showError(message) {
  welcomeScreen.classList.remove("hidden");
  surpriseScreen.classList.add("hidden");

  welcomeTitle.textContent =
    "Oups… Impossible de charger la surprise.";

  welcomeText.textContent = message;

  startButton.classList.add("hidden");
}


// ============================================================
// ÉCRAN D'ACCUEIL
// ============================================================

function showWelcome() {
  welcomeScreen.classList.remove("hidden");
  surpriseScreen.classList.add("hidden");

  welcomeTitle.textContent =
    "Bienvenue dans ta surprise ❤️";

  welcomeText.textContent =
    "Une petite aventure t’attend… Prends ton temps, ouvre bien les yeux et profite de chaque étape. ❤️";

  startButton.classList.remove("hidden");
}


// ============================================================
// BOUTON COMMENCER
// ============================================================

if (startButton) {
  startButton.addEventListener("click", async () => {
    currentStepIndex = 0;

    // -2 = commencer par les 5 photos de l'étape 2
    stepTwoQuestionIndex = -2;

    stepEightVideoIndex = 0;

    welcomeScreen.classList.add("hidden");
    surpriseScreen.classList.remove("hidden");

    startBackgroundMusic();

    await renderCurrentStep();
  });
}


// ============================================================
// RENDU PRINCIPAL
// ============================================================

async function renderCurrentStep() {
  if (!steps.length) {
    showError(
      "Aucune étape n’a été trouvée pour cette surprise."
    );

    return;
  }

  const step = steps[currentStepIndex];

  if (!step) {
    showError(
      "Cette étape n’existe pas."
    );

    return;
  }

  totalSteps = steps.length;

  stepNumber.textContent =
    `${String(currentStepIndex + 1).padStart(2, "0")} / ${String(totalSteps).padStart(2, "0")}`;

  stepTitle.textContent = step.title || "";

  stepBody.innerHTML =
    formatText(
      step.body_text ||
      step.body ||
      ""
    );

  questionContainer.innerHTML = "";
  feedbackContainer.innerHTML = "";
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  if (currentStepIndex === 0) {
    renderStepOne(step);
    return;
  }

  if (currentStepIndex === 1) {
    renderStepTwo(step);
    return;
  }

  if (currentStepIndex === 2) {
    renderStepThree(step);
    return;
  }

  if (currentStepIndex === 3) {
    renderStepFour(step);
    return;
  }

  if (currentStepIndex === 4) {
    renderStepFive(step);
    return;
  }

  if (currentStepIndex === 5) {
    renderStepSix(step);
    return;
  }

  if (currentStepIndex === 6) {
    renderStepSeven(step);
    return;
  }

  if (currentStepIndex === 7) {
    renderStepEight(step);
    return;
  }

  if (currentStepIndex === 8) {
    renderStepNine(step);
    return;
  }

  addButton(
    "Continuer ❤️",
    () => goToNextStep()
  );
}


// ============================================================
// PASSAGE À L'ÉTAPE SUIVANTE
// ============================================================

async function goToNextStep() {
  if (currentStepIndex >= steps.length - 1) {
    return;
  }

  currentStepIndex += 1;

  if (currentStepIndex === 1) {
    stepTwoQuestionIndex = -2;
  }

  if (currentStepIndex === 7) {
    stepEightVideoIndex = 0;
  }

  await saveProgress();
  await renderCurrentStep();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ============================================================
// ÉTAPE 1 — BIENVENUE
// ============================================================

function renderStepOne(step) {
  stepTitle.textContent =
    "Bienvenue dans ta surprise ❤️";

  stepBody.innerHTML = `
    <p>
      Une petite aventure t’attend…<br>
      Prends ton temps, ouvre bien les yeux et profite de chaque étape. ❤️
    </p>
  `;

  addButton(
    "Continuer ❤️",
    () => goToNextStep()
  );
}


// ============================================================
// ÉTAPE 2 — A BLAST FROM THE PAST
// ============================================================

function renderStepTwo(step) {
  const stepQuestions =
    getQuestionsForStep(step.id);

  const stepPhotos =
    getStepMedia(step.id).filter(isImage);

  const captions = [
    "Certains souvenirs commencent simplement…",

    "Puis on découvre peu à peu les différentes facettes d’une personne.",

    "Et certains moments restent surtout pour le sourire qu’ils nous laissent. ❤️",

    "Parce que les souvenirs les plus simples peuvent parfois devenir les plus précieux.",

    "Et puis il y a ces moments qu’on n’oublie pas…"
  ];

  // Les photos apparaissent avant les questions.
  if (stepTwoQuestionIndex === -2) {
    renderStepTwoPhotos(
      stepPhotos,
      captions
    );

    return;
  }

  // Transition avant les questions.
  if (stepTwoQuestionIndex === -1) {
    renderStepTwoIntro();

    return;
  }

  // Les 5 questions, une par une.
  if (
    stepQuestions.length &&
    stepTwoQuestionIndex < stepQuestions.length
  ) {
    renderStepTwoQuestion(
      stepQuestions[stepTwoQuestionIndex],
      stepQuestions
    );

    return;
  }

  questionContainer.innerHTML = `
    <div class="error-message">
      Les questions de cette étape ne sont pas disponibles.
    </div>
  `;
}


// ============================================================
// ÉTAPE 2 — PHOTOS
// ============================================================

function renderStepTwoPhotos(
  photos,
  captions
) {
  if (!photos.length) {
    stepTwoQuestionIndex = -1;

    renderCurrentStep();

    return;
  }

  let photoIndex = 0;

  const showPhoto = () => {
    mediaContainer.innerHTML = "";
    actionContainer.innerHTML = "";

    const image =
      document.createElement("img");

    image.src =
      photos[photoIndex].media_url;

    image.alt =
      `Souvenir ${photoIndex + 1}`;

    image.className =
      "memory-photo";

    const caption =
      document.createElement("p");

    caption.className =
      "memory-caption";

    caption.textContent =
      photos[photoIndex].caption ||
      captions[photoIndex] ||
      "";

    mediaContainer.appendChild(image);

    mediaContainer.appendChild(caption);

    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent =
      photoIndex < photos.length - 1
        ? "Continuer ❤️"
        : "Voir la suite ❤️";

    button.addEventListener(
      "click",
      () => {
        if (
          photoIndex <
          photos.length - 1
        ) {
          photoIndex += 1;

          showPhoto();
        } else {
          stepTwoQuestionIndex = -1;

          renderCurrentStep();
        }
      }
    );

    actionContainer.appendChild(button);
  };

  showPhoto();
}


// ============================================================
// ÉTAPE 2 — TRANSITION
// ============================================================

function renderStepTwoIntro() {
  mediaContainer.innerHTML = "";

  stepBody.innerHTML = `
    <p>
      Remonte dans tes souvenirs et découvre la première partie
      de ta surprise. ❤️
    </p>

    <div class="transition-text">
      <strong>
        Mais est-ce que tu te souviens vraiment ? 👀
      </strong>
      <br><br>
      Voyons ça…
    </div>
  `;

  addButton(
    "Commencer ❤️",
    () => {
      stepTwoQuestionIndex = 0;

      renderCurrentStep();
    }
  );
}


// ============================================================
// ÉTAPE 2 — QUESTIONS
// ============================================================

function renderStepTwoQuestion(
  question,
  allQuestions
) {
  questionContainer.innerHTML = "";

  feedbackContainer.innerHTML = "";

  actionContainer.innerHTML = "";

  const questionElement =
    document.createElement("div");

  questionElement.className =
    "question-text";

  questionElement.innerHTML =
    formatText(
      question.question_text || ""
    );

  questionContainer.appendChild(
    questionElement
  );

  const choices =
    getAnswersForQuestion(
      question.id
    );

  if (!choices.length) {
    questionContainer.innerHTML += `
      <div class="error-message">
        Les réponses de cette question ne sont pas disponibles.
      </div>
    `;

    return;
  }

  choices.forEach(
    (choice) => {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "answer-choice";

      button.textContent =
        choice.choice_text || "";

      button.addEventListener(
        "click",
        () => {
          handleStepTwoAnswer(
            choice,
            allQuestions
          );
        }
      );

      questionContainer.appendChild(
        button
      );
    }
  );
}


// ============================================================
// ÉTAPE 2 — RÉPONSE
// ============================================================

function handleStepTwoAnswer(
  choice,
  allQuestions
) {
  const buttons =
    questionContainer.querySelectorAll(
      "button"
    );

  buttons.forEach(
    (button) => {
      button.disabled = true;
    }
  );

  const isCorrect =
    choice.is_correct === true ||
    choice.is_correct === "true" ||
    choice.is_correct === 1 ||
    choice.is_correct === "1";

  feedbackContainer.innerHTML = `
    <div class="feedback ${
      isCorrect ? "correct" : "wrong"
    }">
      ${formatText(
        choice.feedback ||
        (
          isCorrect
            ? "✨ Bonne réponse ! ❤️"
            : "Hmm… pas encore. 👀"
        )
      )}
    </div>
  `;

  if (isCorrect) {
    if (
      stepTwoQuestionIndex <
      allQuestions.length - 1
    ) {
      addButton(
        "Question suivante ❤️",
        () => {
          stepTwoQuestionIndex += 1;

          renderCurrentStep();
        }
      );
    } else {
      addButton(
        "Continuer ❤️",
        () => goToNextStep()
      );
    }

    return;
  }

  addButton(
    "Réessayer 👀",
    () => renderCurrentStep()
  );
}


// ============================================================
// FIN PARTIE 1
// ============================================================
// ============================================================
// ÉTAPE 3 — A LITTLE CHALLENGE
// ============================================================

function renderStepThree(step) {
  stepTitle.textContent =
    "A Little Challenge 🧩";

  stepBody.innerHTML = `
    <p>
      Un petit défi t’attend… Réfléchis bien, la réponse se cache
      peut-être dans les indices. 👀❤️
    </p>

    <div class="riddle">
      Je suis un mot qui peut désigner quelque chose que l’on imagine
      les yeux fermés…<br><br>

      Je peux être un désir, un espoir, une vision de ce que l’on
      aimerait voir devenir réel.<br><br>

      Je peux sembler lointain, mais il suffit parfois d’y croire
      pour commencer à s’en rapprocher.<br><br>

      Je suis un petit mot venu d’une autre langue,<br>
      mais entre nous, il signifie bien plus qu’une simple traduction. ❤️
      <br><br>

      <strong>Qui suis-je ?</strong>
    </div>
  `;

  const stepQuestions =
    getQuestionsForStep(step.id);

  const question =
    stepQuestions[0];

  if (!question) {
    addButton(
      "Continuer ❤️",
      () => goToNextStep()
    );

    return;
  }

  renderGenericQuestion(
    question,
    () => goToNextStep()
  );
}


// ============================================================
// QUESTION GÉNÉRIQUE
// ============================================================

function renderGenericQuestion(
  question,
  onSuccess
) {
  questionContainer.innerHTML = "";

  feedbackContainer.innerHTML = "";

  actionContainer.innerHTML = "";

  const questionElement =
    document.createElement("div");

  questionElement.className =
    "question-text";

  questionElement.innerHTML =
    formatText(
      question.question_text || ""
    );

  questionContainer.appendChild(
    questionElement
  );

  const choices =
    getAnswersForQuestion(
      question.id
    );

  if (!choices.length) {
    questionContainer.innerHTML += `
      <div class="error-message">
        Les réponses de cette question ne sont pas disponibles.
      </div>
    `;

    return;
  }

  choices.forEach(
    (choice) => {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "answer-choice";

      button.textContent =
        choice.choice_text || "";

      button.addEventListener(
        "click",
        () => {
          handleGenericAnswer(
            choice,
            onSuccess
          );
        }
      );

      questionContainer.appendChild(
        button
      );
    }
  );
}


function handleGenericAnswer(
  choice,
  onSuccess
) {
  questionContainer
    .querySelectorAll("button")
    .forEach(
      (button) => {
        button.disabled = true;
      }
    );

  const isCorrect =
    choice.is_correct === true ||
    choice.is_correct === "true" ||
    choice.is_correct === 1 ||
    choice.is_correct === "1";

  feedbackContainer.innerHTML = `
    <div class="feedback ${
      isCorrect ? "correct" : "wrong"
    }">
      ${formatText(
        choice.feedback ||
        (
          isCorrect
            ? "✨ Bonne réponse ! ❤️"
            : "Hmm… pas encore. 👀"
        )
      )}
    </div>
  `;

  if (isCorrect) {
    addButton(
      "Continuer ❤️",
      onSuccess
    );
  } else {
    addButton(
      "Réessayer 👀",
      () => renderCurrentStep()
    );
  }
}


// ============================================================
// ÉTAPE 4 — ÉCOUTE BIEN
// ============================================================

function renderStepFour(step) {
  stepTitle.textContent =
    "Écoute bien… 🎧";

  stepBody.innerHTML = `
    <p>
      Cette fois, pas d’énigme. Juste un moment pour écouter
      et laisser la musique parler. ❤️
    </p>
  `;

  questionContainer.innerHTML = "";

  feedbackContainer.innerHTML = "";

  mediaContainer.innerHTML = "";

  actionContainer.innerHTML = "";

  pauseBackgroundMusic();

  if (!christinaAudio) {
    addButton(
      "Continuer ❤️",
      () => goToNextStep()
    );

    return;
  }

  christinaAudio.pause();

  christinaAudio.currentTime = 0;

  christinaAudio.src =
    CHRISTINA_AUDIO_URL;

  christinaAudio.load();

  const before =
    document.createElement("div");

  before.className =
    "audio-message";

  before.innerHTML = `
    <p>
      Cette fois, pas d’énigme. 🎧<br><br>

      Juste un moment pour écouter…
      et laisser la musique parler. ❤️<br><br>

      Mets-toi à l’aise, écoute bien jusqu’au bout.
      Peut-être que tu comprendras pourquoi j’ai choisi
      cette chanson pour toi. ✨
    </p>
  `;

  mediaContainer.appendChild(before);

  const audio =
    document.createElement("audio");

  audio.src =
    CHRISTINA_AUDIO_URL;

  audio.controls = true;

  audio.preload = "metadata";

  audio.style.display = "block";

  audio.style.width = "100%";

  audio.style.maxWidth = "650px";

  audio.style.margin =
    "25px auto";

  mediaContainer.appendChild(audio);

  const after =
    document.createElement("div");

  after.className =
    "audio-message";

  after.innerHTML = `
    <p>
      Alors… qu’est-ce que cette chanson t’a fait ressentir ? ❤️
      <br><br>

      Certaines choses sont difficiles à expliquer avec des mots.
      Parfois, une chanson peut simplement dire ce qu’on n’arrive
      pas à dire soi-même. 🎧❤️
      <br><br>

      Mais ne t’arrête pas là…<br>
      <strong>La suite t’attend. 👀</strong>
    </p>
  `;

  after.style.display = "none";

  mediaContainer.appendChild(after);

  const continueButton =
    document.createElement("button");

  continueButton.type =
    "button";

  continueButton.textContent =
    "Continuer ❤️";

  continueButton.disabled =
    true;

  continueButton.addEventListener(
    "click",
    () => {
      christinaAudio.pause();

      resumeBackgroundMusic();

      goToNextStep();
    }
  );

  actionContainer.appendChild(
    continueButton
  );

  const finishAudio =
    () => {
      after.style.display =
        "block";

      continueButton.disabled =
        false;

      pausedMusicTime =
        backgroundMusic
          ? backgroundMusic.currentTime
          : 0;

      resumeBackgroundMusic();
    };

  audio.addEventListener(
    "ended",
    finishAudio,
    { once: true }
  );

  audio.play().catch(
    (error) => {
      console.warn(
        "Lecture automatique de Christina bloquée :",
        error
      );
    }
  );
}


// ============================================================
// ÉTAPE 5 — UN MESSAGE POUR TOI
// ============================================================

function renderStepFive(step) {
  stepTitle.textContent =
    "Un message pour toi ❤️";

  stepBody.innerHTML = `
    <p>
      Après les souvenirs, le défi et la musique,
      quelques mots que je voulais spécialement te laisser. ❤️
    </p>

    <div class="message">
      Après les souvenirs, le défi et la musique…<br>
      J’avais encore quelques mots que je voulais spécialement te laisser. ❤️
      <br><br>

      Il y a des personnes qui passent simplement dans notre vie.
      <br>
      Et puis il y a celles qui, sans forcément le savoir,
      finissent par y laisser une petite trace. ✨
      <br><br>

      Tu fais partie de ces personnes.
      <br><br>

      Je ne vais pas tout t’expliquer maintenant…
      <br>
      Parce qu’il reste encore quelques petites choses à découvrir. 👀❤️
      <br><br>

      Alors garde encore un peu de patience.
      <br>
      <strong>La suite arrive… ✨</strong>
    </div>
  `;

  addButton(
    "Continuer ❤️",
    () => goToNextStep()
  );
}


// ============================================================
// ÉTAPE 6 — QUELQUES MOTS POUR TOI
// ============================================================

function renderStepSix(step) {
  stepTitle.textContent =
    "Quelques mots pour toi ❤️";

  stepBody.innerHTML = `
    <p>
      Il y a encore quelque chose que j’aimerais te faire découvrir…
      Prends encore un instant. ✨
    </p>

    <div class="message">
      Après les souvenirs, le défi et la musique…<br>
      J’avais encore quelques mots que je voulais spécialement te laisser. ❤️
      <br><br>

      Il y a des personnes qui passent simplement dans notre vie.
      <br>
      Et puis il y a celles qui, sans forcément le savoir,
      finissent par y laisser une petite trace. ✨
      <br><br>

      Tu fais partie de ces personnes.
      <br><br>

      Je ne vais pas tout t’expliquer maintenant…
      <br>
      Parce qu’il reste encore quelques petites choses à découvrir. 👀❤️
      <br><br>

      Alors garde encore un peu de patience.
      <br>
      <strong>La suite arrive… ✨</strong>
    </div>
  `;

  addButton(
    "Continuer ❤️",
    () => goToNextStep()
  );
}


// ============================================================
// ÉTAPE 7 — THE FINAL CLUE
// ============================================================

function renderStepSeven(step) {
  stepTitle.textContent =
    "The Final Clue 👀";

  stepBody.innerHTML = `
    <p>
      Un dernier indice avant de découvrir qui se cache
      derrière cette aventure. Réfléchis bien… ❤️
    </p>
  `;

  const stepQuestions =
    getQuestionsForStep(step.id);

  const question =
    stepQuestions[0];

  if (!question) {
    addButton(
      "Continuer ❤️",
      () => goToNextStep()
    );

    return;
  }

  questionContainer.innerHTML = "";

  feedbackContainer.innerHTML = "";

  const questionText =
    document.createElement("div");

  questionText.className =
    "question-text";

  questionText.innerHTML =
    formatText(
      question.question_text ||
      "Qui penses-tu être derrière tout ça ?"
    );

  questionContainer.appendChild(
    questionText
  );

  const choices =
    getAnswersForQuestion(
      question.id
    );

  choices.forEach(
    (choice) => {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "answer-choice";

      button.textContent =
        choice.choice_text || "";

      button.addEventListener(
        "click",
        () => {
          handleStepSevenAnswer(
            choice
          );
        }
      );

      questionContainer.appendChild(
        button
      );
    }
  );
}


// ============================================================
// ÉTAPE 7 — RÉPONSE
// ============================================================

function handleStepSevenAnswer(choice) {
  questionContainer
    .querySelectorAll("button")
    .forEach(
      (button) => {
        button.disabled = true;
      }
    );

  const isCorrect =
    choice.is_correct === true ||
    choice.is_correct === "true" ||
    choice.is_correct === 1 ||
    choice.is_correct === "1";

  const defaultCorrect = `
    👀 Alors… tu avais deviné ?
    <br><br>

    <strong>Oui. C’était moi. ❤️</strong>
    <br>
    Rebecca.
    <br><br>

    Mais attends…
    <br>
    Ce n’est pas encore la fin.
    <br><br>

    Maintenant que tu sais qui se cache derrière tout ça,
    il ne reste plus qu’une seule chose à découvrir…
    <br><br>

    <strong>Pourquoi ? ✨</strong>
  `;

  const defaultWrong = `
    Hmm… 👀
    <br><br>

    Tu es sûr de ton choix ?
    <br><br>

    Relis bien les petits indices laissés depuis le début…
    <br><br>

    <strong>
      Quelqu’un a préparé tout ça en pensant à toi. ❤️
    </strong>
    <br><br>

    Tu peux encore réfléchir.
  `;

  feedbackContainer.innerHTML = `
    <div class="feedback ${
      isCorrect ? "correct" : "wrong"
    }">
      ${
        choice.feedback
          ? formatText(choice.feedback)
          : (
              isCorrect
                ? defaultCorrect
                : defaultWrong
            )
      }
    </div>
  `;

  if (isCorrect) {
    addButton(
      "Continuer ❤️",
      () => goToNextStep()
    );
  } else {
    addButton(
      "Réessayer 👀",
      () => renderCurrentStep()
    );
  }
}


// ============================================================
// FIN PARTIE 2
// ============================================================
// ============================================================
// ÉTAPE 8 — JOYEUX ANNIVERSAIRE, GARDEN !
// ============================================================

function renderStepEight(step) {
  stepTitle.textContent =
    "Joyeux anniversaire, Garden ! 🎉❤️";

  stepBody.innerHTML = `
    <p>
      Tu es arrivé jusqu’ici…
      Alors cette fois, je veux simplement te laisser regarder. ❤️
    </p>
  `;

  questionContainer.innerHTML = "";
  feedbackContainer.innerHTML = "";
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  stepEightVideoIndex = 0;

  renderFirstVideo();
}


// ============================================================
// PREMIÈRE VIDÉO
// ============================================================

function renderFirstVideo() {
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  const intro =
    document.createElement("div");

  intro.className =
    "video-intro";

  intro.innerHTML = `
    <p>
      Tu es arrivé jusqu’ici…<br><br>

      Alors cette fois, je ne vais pas te poser de question.
      <br>
      Je veux simplement te laisser regarder. ❤️
      <br><br>

      🎬 <strong>Un petit souvenir…</strong>
      <br>
      Regarde bien. 👀
    </p>
  `;

  mediaContainer.appendChild(
    intro
  );

  const video =
    document.createElement("video");

  video.src =
    VIDEO_1_URL;

  video.controls = true;

  video.playsInline = true;

  video.preload = "metadata";

  video.style.display =
    "block";

  video.style.width =
    "100%";

  video.style.maxWidth =
    "700px";

  video.style.maxHeight =
    "65vh";

  video.style.margin =
    "25px auto";

  video.style.borderRadius =
    "18px";

  mediaContainer.appendChild(
    video
  );

  let finished = false;

  const continueToTransition =
    () => {
      if (finished) {
        return;
      }

      finished = true;

      renderVideoTransition();
    };

  video.addEventListener(
    "ended",
    continueToTransition,
    { once: true }
  );

  const button =
    document.createElement("button");

  button.type =
    "button";

  button.textContent =
    "Continuer ❤️";

  button.addEventListener(
    "click",
    () => {
      video.pause();

      continueToTransition();
    }
  );

  actionContainer.appendChild(
    button
  );

  video.play().catch(
    (error) => {
      console.warn(
        "Lecture automatique de la première vidéo bloquée :",
        error
      );
    }
  );
}


// ============================================================
// TRANSITION ENTRE LES DEUX VIDÉOS
// ============================================================

function renderVideoTransition() {
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  stepBody.innerHTML = `
    <div class="transition-text">
      <p>
        <strong>Et maintenant…</strong>
      </p>

      <p>
        Il y a une autre vidéo que je voulais absolument te montrer.
        <br><br>

        Parce que celle-ci me rappelle quelque chose de particulier.
        <br>
        Un moment que je n’ai pas oublié. ❤️
      </p>
    </div>
  `;

  addButton(
    "Voir la suite 🎬❤️",
    () => {
      renderSecondVideo();
    }
  );
}


// ============================================================
// DEUXIÈME VIDÉO
// ============================================================

function renderSecondVideo() {
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  stepBody.innerHTML = `
    <p>
      Regarde bien cette fois… ❤️
    </p>
  `;

  const video =
    document.createElement("video");

  video.src =
    VIDEO_2_URL;

  video.controls = true;

  video.playsInline = true;

  video.preload = "metadata";

  video.style.display =
    "block";

  video.style.width =
    "100%";

  video.style.maxWidth =
    "700px";

  video.style.maxHeight =
    "65vh";

  video.style.margin =
    "25px auto";

  video.style.borderRadius =
    "18px";

  mediaContainer.appendChild(
    video
  );

  const finalMessage =
    document.createElement("div");

  finalMessage.className =
    "video-final-message";

  finalMessage.innerHTML = `
    <p>
      Tu m’avais dit quelque chose d’important dans cette vidéo.
      <br><br>

      Et aujourd’hui, à mon tour, j’avais envie de te rappeler
      une chose :
      <br><br>

      <strong>tu comptes. ❤️</strong>
      <br><br>

      Peut-être que tu ne comprends pas encore pourquoi j’ai choisi
      tous ces petits détails pour cette surprise…
      <br>
      Mais bientôt, tout prendra son sens. ✨
      <br><br>

      Alors garde encore un peu de patience.
      <br>

      <strong>Il reste une dernière étape. 👀❤️</strong>
    </p>
  `;

  finalMessage.style.display =
    "none";

  mediaContainer.appendChild(
    finalMessage
  );

  let videoEnded = false;

  const showFinalMessage =
    () => {
      if (videoEnded) {
        return;
      }

      videoEnded = true;

      finalMessage.style.display =
        "block";

      addButton(
        "Continuer ❤️",
        () => goToNextStep()
      );
    };

  video.addEventListener(
    "ended",
    showFinalMessage,
    { once: true }
  );

  video.play().catch(
    (error) => {
      console.warn(
        "Lecture automatique de la deuxième vidéo bloquée :",
        error
      );
    }
  );
}


// ============================================================
// ÉTAPE 9 — RÉVÉLATION FINALE
// ============================================================

function renderStepNine(step) {
  stepTitle.textContent =
    "Enfin… tu sais qui je suis ❤️";

  stepBody.innerHTML = `
    <div class="final-message">

      <p>
        Alors…
      </p>

      <p>
        Tu as trouvé les indices.<br>
        Tu as traversé les souvenirs.<br>
        Tu as relevé le défi.<br>
        Tu as écouté.<br>
        Tu as regardé.<br>
        Et maintenant, tu sais qui se cachait derrière tout ça. ❤️
      </p>

      <p>
        <strong>C’était moi. Rebecca.</strong>
      </p>

      <p>
        Mais au fond, cette surprise n’a jamais été seulement
        une façon de te souhaiter un joyeux anniversaire.
      </p>

      <p>
        Je voulais créer quelque chose que tu pourrais découvrir
        petit à petit.
        <br>
        Quelque chose qui te ferait sourire, réfléchir,
        peut-être même te rappeler certains moments. ✨
      </p>

      <p>
        Et si tu te demandes encore pourquoi j’ai choisi le mot
        <strong>« Sueño »</strong>…
      </p>

      <p>
        C’est parce qu’un sueño, c’est un rêve.
        <br>
        Quelque chose que l’on imagine, que l’on espère,
        que l’on aimerait voir devenir réel.
      </p>

      <p>
        Et parfois, certains rêves commencent simplement par
        une rencontre, un souvenir, une personne qui prend une
        place particulière dans notre histoire. ❤️
      </p>

      <p>
        Alors aujourd’hui, pour tes <strong>22 ans</strong>…
        <br><br>

        Je voulais simplement te dire :
        <br>

        <strong>
          Joyeux anniversaire, Garden. 🎂❤️
        </strong>
      </p>

      <p>
        J’espère que cette nouvelle année de ta vie sera remplie
        de beaux rêves, de belles rencontres, de réussite et de
        moments que tu n’oublieras jamais.
      </p>

      <p>
        Et surtout…
        <br><br>

        <strong>
          n’arrête jamais de rêver. 🌙✨
        </strong>
      </p>

      <p>
        Parce qu’on ne sait jamais jusqu’où un simple
        <strong>sueño</strong> peut nous mener.
      </p>

      <p>
        ❤️ <strong>Fin de la surprise.</strong>
      </p>

    </div>
  `;

  questionContainer.innerHTML = "";

  feedbackContainer.innerHTML = "";

  mediaContainer.innerHTML = "";

  actionContainer.innerHTML = "";

  stopBackgroundMusic();
}


// ============================================================
// RENDU DES MÉDIAS SUPABASE
// ============================================================

function renderDatabaseMedia(step) {
  const items =
    getStepMedia(step.id);

  if (!items.length) {
    return;
  }

  items.forEach(
    (item) => {
      if (isImage(item)) {
        const image =
          document.createElement("img");

        image.src =
          item.media_url;

        image.alt =
          item.title ||
          "Souvenir";

        image.loading =
          "lazy";

        image.style.display =
          "block";

        image.style.width =
          "100%";

        image.style.maxWidth =
          "650px";

        image.style.margin =
          "20px auto";

        mediaContainer.appendChild(
          image
        );
      }

      if (isVideo(item)) {
        const video =
          document.createElement("video");

        video.src =
          item.media_url;

        video.controls =
          true;

        video.playsInline =
          true;

        video.preload =
          "metadata";

        video.style.display =
          "block";

        video.style.width =
          "100%";

        video.style.maxWidth =
          "700px";

        video.style.margin =
          "20px auto";

        mediaContainer.appendChild(
          video
        );
      }
    }
  );
}


// ============================================================
// INITIALISATION
// ============================================================

async function initializeApp() {
  try {
    prepareBackgroundMusic();

    showWelcome();

    await loadAllData();

    if (!steps.length) {
      throw new Error(
        "Aucune étape n’a été trouvée dans Supabase."
      );
    }

    totalSteps =
      steps.length;

    console.log(
      "The Secret Gift chargé avec succès.",
      {
        surprise,
        steps,
        questions,
        answers,
        media
      }
    );

  } catch (error) {
    console.error(
      "Erreur de chargement :",
      error
    );

    showError(
      "Impossible de charger la surprise pour le moment. Vérifie ta connexion puis réessaie."
    );
  }
}


// ============================================================
// LANCEMENT
// ============================================================

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );
} else {
  initializeApp();
}


// ============================================================
// FIN DE THE SECRET GIFT
// ============================================================
