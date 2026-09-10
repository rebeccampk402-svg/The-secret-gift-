/* =========================================================
   THE SECRET GIFT — Garden
   9-step personalized surprise
   ========================================================= */

const SUPABASE_URL = "https://djujhfmusguvxqremdpp.supabase.co";
const SUPABASE_KEY = "sb_publishable_oJHpVpdT0-l_05ng5iTweQ_NZj5yuDg";
const SURPRISE_ID = "52889a77-b944-46e9-8a1a-d6f21dad11e8";

const BACKGROUND_MUSIC_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/mixkit-fright-night-871.mp3";

const CHRISTINA_MUSIC_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/Christina.mp3";

const VIDEO_1_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/VID-20260818-WA0024.mp4";

const VIDEO_2_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/VID-20260209-WA0001.mp4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let steps = [];
let questions = [];
let answers = [];
let media = [];

let currentStepIndex = 0;
let totalSteps = 9;
let stepTwoQuestionIndex = 0;
let stepEightVideoIndex = 0;
let pausedMusicTime = 0;

const welcomeScreen = document.getElementById("welcome-screen");
const surpriseScreen = document.getElementById("surprise-screen");
const welcomeTitle = document.getElementById("welcome-title");
const welcomeText = document.getElementById("welcome-text");
const startButton = document.getElementById("start-button");

const stepNumber = document.getElementById("step-number");
const stepTitle = document.getElementById("step-title");
const stepBody = document.getElementById("step-body");

const questionContainer = document.getElementById("question-container");
const feedbackContainer = document.getElementById("feedback-container");
const mediaContainer = document.getElementById("media-container");
const actionContainer = document.getElementById("action-container");

const backgroundMusic = document.getElementById("background-music");
const christinaAudio = document.getElementById("christina-audio");

if (backgroundMusic) backgroundMusic.loop = true;


/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */

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
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function clearAreas() {
  questionContainer.innerHTML = "";
  feedbackContainer.innerHTML = "";
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";
}

function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

function isImage(item) {
  return ["image", "photo", "picture", "img"].includes(
    normalizeType(item.media_type)
  );
}

function isVideo(item) {
  return ["video", "mp4", "movie"].includes(
    normalizeType(item.media_type)
  );
}

function isAudio(item) {
  return ["audio", "mp3", "music", "sound"].includes(
    normalizeType(item.media_type)
  );
}

function getStepMedia(stepId) {
  return media
    .filter((item) => item.step_id === stepId)
    .sort((a, b) => {
      const orderA = Number(a.media_order ?? a.display_order ?? 999);
      const orderB = Number(b.media_order ?? b.display_order ?? 999);

      if (orderA !== orderB) return orderA - orderB;

      return (
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
      );
    });
}

function getQuestionsForStep(stepId) {
  return questions
    .filter((q) => q.step_id === stepId)
    .sort((a, b) => {
      const aOrder = Number(a.question_order ?? a.order ?? 999);
      const bOrder = Number(b.question_order ?? b.order ?? 999);

      if (aOrder !== bOrder) return aOrder - bOrder;

      return (
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
      );
    });
}

function getAnswersForQuestion(questionId) {
  return answers
    .filter((a) => a.question_id === questionId)
    .sort((a, b) => {
      const aOrder = Number(a.choice_order ?? 999);
      const bOrder = Number(b.choice_order ?? 999);

      return aOrder - bOrder;
    });
}

function addButton(text, handler, className = "primary-button") {
  const button = document.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = text;

  button.addEventListener("click", handler);

  actionContainer.appendChild(button);

  return button;
}

function setMessage(html, className = "message") {
  const p = document.createElement("p");

  p.className = className;
  p.innerHTML = html;

  return p;
}

function animateStepChange(callback) {
  const card = surpriseScreen.querySelector(".card");

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
  }, 250);
}


/* ---------------------------------------------------------
   Music
   --------------------------------------------------------- */

function startBackgroundMusic() {
  if (!backgroundMusic) return;

  if (!backgroundMusic.src) {
    backgroundMusic.src = BACKGROUND_MUSIC_URL;
  }

  backgroundMusic.loop = true;

  const promise = backgroundMusic.play();

  if (promise?.catch) {
    promise.catch(() => {});
  }
}

function pauseBackgroundMusic() {
  if (!backgroundMusic) return;

  pausedMusicTime = backgroundMusic.currentTime || 0;
  backgroundMusic.pause();
}

function resumeBackgroundMusic() {
  if (!backgroundMusic || currentStepIndex >= totalSteps) return;

  try {
    backgroundMusic.currentTime = pausedMusicTime;
  } catch (_) {}

  const promise = backgroundMusic.play();

  if (promise?.catch) {
    promise.catch(() => {});
  }
}


/* ---------------------------------------------------------
   Supabase
   --------------------------------------------------------- */

async function loadAllData() {
  const surpriseResult = await supabaseClient
    .from("surprises")
    .select("*")
    .eq("id", SURPRISE_ID)
    .maybeSingle();

  if (surpriseResult.error) {
    throw surpriseResult.error;
  }

  if (!surpriseResult.data) {
    throw new Error(
      "La surprise Garden est introuvable dans Supabase."
    );
  }

  const stepsResult = await supabaseClient
    .from("steps")
    .select("*")
    .eq("surprise_id", SURPRISE_ID)
    .order("step_number", { ascending: true });

  if (stepsResult.error) {
    throw stepsResult.error;
  }

  steps = stepsResult.data || [];
  totalSteps = steps.length || 9;

  if (!steps.length) {
    throw new Error(
      "Aucune étape n'a été trouvée."
    );
  }

  const stepIds = steps.map((s) => s.id);

  const questionsResult = await supabaseClient
    .from("questions")
    .select("*")
    .in("step_id", stepIds);

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  questions = questionsResult.data || [];

  const questionIds = questions.map((q) => q.id);

  if (questionIds.length) {
    const answersResult = await supabaseClient
      .from("answer_choices")
      .select("*")
      .in("question_id", questionIds);

    if (answersResult.error) {
      throw answersResult.error;
    }

    answers = answersResult.data || [];
  } else {
    answers = [];
  }

  const mediaResult = await supabaseClient
    .from("media")
    .select("*")
    .in("step_id", stepIds)
    .order("created_at", { ascending: true });

  if (mediaResult.error) {
    throw mediaResult.error;
  }

  media = mediaResult.data || [];

  if (backgroundMusic) {
    backgroundMusic.src = BACKGROUND_MUSIC_URL;
    backgroundMusic.load();
  }

  const stepFour = steps.find(
    (s) => Number(s.step_number) === 4
  );

  const christina = stepFour
    ? getStepMedia(stepFour.id).find(isAudio)
    : null;

  if (christinaAudio) {
    christinaAudio.src =
      christina?.media_url || CHRISTINA_MUSIC_URL;

    christinaAudio.preload = "metadata";
    christinaAudio.style.display = "none";
    christinaAudio.load();
  }
}

async function saveProgress(number) {
  try {
    const existing = await supabaseClient
      .from("progress")
      .select("id")
      .eq("surprise", SURPRISE_ID)
      .maybeSingle();

    if (existing.error) return;

    const payload = {
      surprise: SURPRISE_ID,
      current_step: number,
      updated_at: new Date().toISOString()
    };

    if (existing.data?.id) {
      await supabaseClient
        .from("progress")
        .update(payload)
        .eq("id", existing.data.id);
    } else {
      await supabaseClient
        .from("progress")
        .insert(payload);
    }
  } catch (_) {}
}


/* ---------------------------------------------------------
   Welcome
   --------------------------------------------------------- */

function showWelcome() {
  welcomeScreen.classList.remove("hidden");
  surpriseScreen.classList.add("hidden");

  startButton.classList.remove("hidden");

  welcomeTitle.textContent =
    "Bienvenue dans ta surprise ❤️";

  welcomeText.textContent =
    "Une petite aventure t’attend… Prends ton temps, ouvre bien les yeux et profite de chaque étape. ❤️";
}

startButton.addEventListener("click", async () => {
  currentStepIndex = 0;
  stepTwoQuestionIndex = 0;
  stepEightVideoIndex = 0;

  welcomeScreen.classList.add("hidden");
  surpriseScreen.classList.remove("hidden");

  startBackgroundMusic();

  await renderCurrentStep();
});


/* ---------------------------------------------------------
   Main renderer
   --------------------------------------------------------- */

async function renderCurrentStep() {
  clearAreas();

  const step = steps[currentStepIndex];

  if (!step) {
    finishSurprise();
    return;
  }

  const number = Number(
    step.step_number || currentStepIndex + 1
  );

  stepNumber.textContent =
    String(number).padStart(2, "0") +
    " / " +
    String(totalSteps).padStart(2, "0");

  stepTitle.textContent = step.title || "";

  if (step.body_text) {
    stepBody.innerHTML =
      '<p class="message">' +
      formatText(step.body_text) +
      "</p>";
  } else {
    stepBody.innerHTML = "";
  }

  await saveProgress(number);

  switch (number) {
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
  }
}

function goToNextStep() {
  animateStepChange(async () => {
    currentStepIndex += 1;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    if (currentStepIndex >= steps.length) {
      finishSurprise();
    } else {
      await renderCurrentStep();
    }
  });
}

function finishSurprise() {
  pauseBackgroundMusic();

  if (christinaAudio) {
    christinaAudio.pause();
  }

  currentStepIndex = steps.length;
                            }
/* ---------------------------------------------------------
   ÉTAPE 1 — Bienvenue
   --------------------------------------------------------- */

function renderStepOne() {
  stepBody.innerHTML = `
    <p class="message">
      Quand tu es prêt…<br>
      la surprise peut commencer. ✨
    </p>
  `;

  addButton("Continuer ❤️", async () => {
    await goToNextStep();
  });
}


/* ---------------------------------------------------------
   ÉTAPE 2 — A Blast from the Past
   --------------------------------------------------------- */

function renderStepTwo(step) {
  const stepQuestions = getQuestionsForStep(step.id);

  /*
     La phrase de transition apparaît d'abord,
     avant les 5 questions.
  */

  if (stepTwoQuestionIndex === -1) {
    renderStepTwoIntro(stepQuestions);
    return;
  }

  if (
    stepTwoQuestionIndex >= 0 &&
    stepTwoQuestionIndex < stepQuestions.length
  ) {
    renderStepTwoQuestion(
      stepQuestions[stepTwoQuestionIndex],
      stepQuestions
    );
    return;
  }

  /*
     Si aucune question n'a été trouvée dans Supabase,
     on affiche quand même un message explicite.
  */

  if (!stepQuestions.length) {
    questionContainer.innerHTML = `
      <div class="error-message">
        Les questions de cette étape n'ont pas encore été trouvées.
      </div>
    `;

    return;
  }
}


function renderStepTwoIntro(stepQuestions) {
  stepBody.innerHTML = `
    <p class="message">
      Remonte dans tes souvenirs et découvre la première partie
      de ta surprise. ❤️
    </p>

    <div class="transition-text">
      <strong>Mais est-ce que tu te souviens vraiment ? 👀</strong>
      <br>
      Voyons ça…
    </div>
  `;

  addButton("Commencer ❤️", () => {
    stepTwoQuestionIndex = 0;
    renderCurrentStep();
  });
}


function renderStepTwoQuestion(question, allQuestions) {
  const choices = getAnswersForQuestion(question.id);

  questionContainer.innerHTML = "";

  const questionElement = document.createElement("div");
  questionElement.className = "question";

  questionElement.innerHTML =
    "<strong>" +
    formatText(question.question_text || "") +
    "</strong>";

  questionContainer.appendChild(questionElement);

  if (!choices.length) {
    questionContainer.innerHTML += `
      <div class="error-message">
        Les réponses de cette question ne sont pas disponibles.
      </div>
    `;
    return;
  }

  choices.forEach((choice) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "choice-button";

    button.textContent = choice.choice_text || "";

    button.addEventListener("click", () => {
      handleAnswer(choice, allQuestions);
    });

    questionContainer.appendChild(button);
  });
}


function handleAnswer(choice, allQuestions) {
  const buttons =
    questionContainer.querySelectorAll("button");

  buttons.forEach((button) => {
    button.disabled = true;
  });

  const isCorrect = Boolean(choice.is_correct);

  feedbackContainer.innerHTML = `
    <div class="feedback ${isCorrect ? "correct" : "wrong"}">
      ${formatText(
        choice.feedback ||
        (isCorrect
          ? "✨ Bonne réponse ! ❤️"
          : "Hmm… pas encore. 👀")
      )}
    </div>
  `;

  if (isCorrect) {
    if (
      stepTwoQuestionIndex <
      allQuestions.length - 1
    ) {
      addButton("Question suivante ❤️", () => {
        stepTwoQuestionIndex += 1;
        renderCurrentStep();
      });
    } else {
      addButton("Continuer ❤️", async () => {
        await goToNextStep();
      });
    }
  } else {
    addButton("Réessayer 👀", () => {
      renderCurrentStep();
    }, "secondary-button");
  }
}


/* ---------------------------------------------------------
   ÉTAPE 3 — A Little Challenge
   --------------------------------------------------------- */

function renderStepThree(step) {
  stepBody.innerHTML = `
    <p class="message">
      Un petit défi t’attend… Réfléchis bien,
      la réponse se cache peut-être dans les indices. 👀❤️
    </p>

    <div class="transition-text">
      Je suis un mot qui peut désigner quelque chose
      que l’on imagine les yeux fermés…<br><br>

      Je peux être un désir, un espoir, une vision de ce que
      l’on aimerait voir devenir réel.<br><br>

      Je peux sembler lointain, mais il suffit parfois d’y croire
      pour commencer à s’en rapprocher.<br><br>

      Je suis un petit mot venu d’une autre langue,
      mais entre nous, il signifie bien plus qu’une simple traduction. ❤️<br><br>

      <strong>Qui suis-je ?</strong>
    </div>
  `;

  const stepQuestions = getQuestionsForStep(step.id);

  if (!stepQuestions.length) {
    questionContainer.innerHTML = `
      <div class="error-message">
        La question de cette étape n'a pas été trouvée.
      </div>
    `;
    return;
  }

  const question = stepQuestions[0];
  const choices = getAnswersForQuestion(question.id);

  const questionElement = document.createElement("div");
  questionElement.className = "question";

  questionElement.innerHTML =
    "<strong>" +
    formatText(question.question_text || "") +
    "</strong>";

  questionContainer.appendChild(questionElement);

  choices.forEach((choice) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.choice_text || "";

    button.addEventListener("click", () => {
      buttonsDisabled(questionContainer);

      feedbackContainer.innerHTML = `
        <div class="feedback ${
          choice.is_correct ? "correct" : "wrong"
        }">
          ${formatText(
            choice.feedback ||
            (
              choice.is_correct
                ? "✨ Tu l’as trouvé… ❤️"
                : "Hmm… pas encore. 👀"
            )
          )}
        </div>
      `;

      if (choice.is_correct) {
        addButton("Continuer ❤️", async () => {
          await goToNextStep();
        });
      } else {
        addButton(
          "Réessayer 👀",
          () => renderCurrentStep(),
          "secondary-button"
        );
      }
    });

    questionContainer.appendChild(button);
  });
}


function buttonsDisabled(container) {
  container
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = true;
    });
}


/* ---------------------------------------------------------
   ÉTAPE 4 — Écoute bien…
   --------------------------------------------------------- */

function renderStepFour(step) {
  pauseBackgroundMusic();

  stepBody.innerHTML = `
    <p class="message">
      Cette fois, pas d’énigme. Juste un moment pour écouter
      et laisser la musique parler. ❤️
    </p>
  `;

  const before = document.createElement("div");

  before.className = "transition-text";

  before.innerHTML = `
    Cette fois, pas d’énigme. 🎧<br>
    Juste un moment pour écouter… et laisser la musique parler. ❤️<br><br>

    Mets-toi à l’aise, écoute bien jusqu’au bout.
    Peut-être que tu comprendras pourquoi j’ai choisi
    cette chanson pour toi. ✨
  `;

  mediaContainer.appendChild(before);

  if (!christinaAudio) {
    renderStepFourFallback();
    return;
  }

  christinaAudio.src = CHRISTINA_MUSIC_URL;
  christinaAudio.controls = true;
  christinaAudio.style.display = "block";

  const audioWrapper = document.createElement("div");
  audioWrapper.className = "media-block";

  audioWrapper.appendChild(christinaAudio);
  mediaContainer.appendChild(audioWrapper);

  const after = document.createElement("div");

  after.className = "transition-text";

  after.innerHTML = `
    <strong>Alors… qu’est-ce que cette chanson t’a fait ressentir ? ❤️</strong><br><br>

    Certaines choses sont difficiles à expliquer avec des mots.
    Parfois, une chanson peut simplement dire ce qu’on n’arrive
    pas à dire soi-même. 🎧❤️<br><br>

    Mais ne t’arrête pas là…<br>
    <strong>La suite t’attend. 👀</strong>
  `;

  mediaContainer.appendChild(after);

  const continueButton = document.createElement("button");

  continueButton.type = "button";
  continueButton.className = "primary-button";
  continueButton.textContent = "Continuer ❤️";
  continueButton.disabled = true;

  actionContainer.appendChild(continueButton);

  let finished = false;

  const finishAudio = async () => {
    if (finished) return;

    finished = true;

    christinaAudio.pause();

    resumeBackgroundMusic();

    continueButton.disabled = false;

    continueButton.onclick = async () => {
      await goToNextStep();
    };
  };

  christinaAudio.addEventListener(
    "ended",
    finishAudio,
    { once: true }
  );

  christinaAudio.addEventListener(
    "error",
    () => {
      continueButton.disabled = false;
      continueButton.onclick = async () => {
        resumeBackgroundMusic();
        await goToNextStep();
      };
    },
    { once: true }
  );

  const playPromise = christinaAudio.play();

  if (playPromise?.catch) {
    playPromise.catch(() => {
      /*
         Le navigateur peut empêcher la lecture automatique.
         Le contrôle audio reste visible pour Garden.
      */
      continueButton.disabled = false;

      continueButton.onclick = async () => {
        christinaAudio.pause();
        resumeBackgroundMusic();
        await goToNextStep();
      };
    });
  }
}


function renderStepFourFallback() {
  mediaContainer.innerHTML += `
    <div class="error-message">
      Impossible de charger Christina.mp3.
    </div>
  `;

  addButton("Continuer ❤️", async () => {
    resumeBackgroundMusic();
    await goToNextStep();
  });
}


/* ---------------------------------------------------------
   ÉTAPE 5 — Un message pour toi ❤️
   --------------------------------------------------------- */

function renderStepFive() {
  stepBody.innerHTML = `
    <p class="message">
      Après les souvenirs, le défi et la musique,
      quelques mots que je voulais spécialement te laisser. ❤️
    </p>

    <div class="final-message">
      Après les souvenirs, le défi et la musique…<br><br>

      J’avais encore quelques mots que je voulais spécialement te laisser. ❤️<br><br>

      Il y a des personnes qui passent simplement dans notre vie.<br>
      Et puis il y a celles qui, sans forcément le savoir,
      finissent par y laisser une petite trace. ✨<br><br>

      Tu fais partie de ces personnes.<br><br>

      Je ne vais pas tout t’expliquer maintenant…<br>
      Parce qu’il reste encore quelques petites choses à découvrir. 👀❤️<br><br>

      Alors garde encore un peu de patience.<br>
      <strong>La suite arrive…</strong> ✨
    </div>
  `;

  addButton("Continuer ❤️", async () => {
    await goToNextStep();
  });
}


/* ---------------------------------------------------------
   ÉTAPE 6 — Quelques mots pour toi ❤️
   --------------------------------------------------------- */

function renderStepSix() {
  stepBody.innerHTML = `
    <p class="message">
      Il y a encore quelque chose que j’aimerais te faire découvrir…
      Prends encore un instant. ✨
    </p>

    <div class="final-message">
      Après les souvenirs, le défi et la musique…<br><br>

      J’avais encore quelques mots que je voulais spécialement te laisser. ❤️<br><br>

      Il y a des personnes qui passent simplement dans notre vie.<br>
      Et puis il y a celles qui, sans forcément le savoir,<br>
      finissent par y laisser une petite trace. ✨<br><br>

      Tu fais partie de ces personnes.<br><br>

      Je ne vais pas tout t’expliquer maintenant…<br>
      Parce qu’il reste encore quelques petites choses à découvrir. 👀❤️<br><br>

      Alors garde encore un peu de patience.<br>
      La suite arrive… ✨
    </div>
  `;

  addButton("Continuer ❤️", async () => {
    await goToNextStep();
  });
}
/* ---------------------------------------------------------
   ÉTAPE 7 — The Final Clue
   --------------------------------------------------------- */

function renderStepSeven(step) {
  stepBody.innerHTML = `
    <p class="message">
      Un dernier indice avant de découvrir qui se cache
      derrière cette aventure. Réfléchis bien… ❤️
    </p>
  `;

  const stepQuestions = getQuestionsForStep(step.id);

  if (!stepQuestions.length) {
    questionContainer.innerHTML = `
      <div class="error-message">
        La question de cette étape n'a pas été trouvée.
      </div>
    `;
    return;
  }

  const question = stepQuestions[0];
  const choices = getAnswersForQuestion(question.id);

  const questionElement = document.createElement("div");
  questionElement.className = "question";

  questionElement.innerHTML =
    "<strong>" +
    formatText(
      question.question_text ||
      "Qui penses-tu être derrière tout ça ?"
    ) +
    "</strong>";

  questionContainer.appendChild(questionElement);

  choices.forEach((choice) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.choice_text || "";

    button.addEventListener("click", () => {
      buttonsDisabled(questionContainer);

      feedbackContainer.innerHTML = `
        <div class="feedback ${
          choice.is_correct ? "correct" : "wrong"
        }">
          ${formatText(
            choice.feedback ||
            (
              choice.is_correct
                ? "👀 Alors… tu avais deviné ? Oui. ❤️"
                : "Hmm… tu es sûr de ton choix ? 👀"
            )
          )}
        </div>
      `;

      if (choice.is_correct) {
        addButton("Continuer ❤️", async () => {
          await goToNextStep();
        });
      } else {
        addButton(
          "Réessayer 👀",
          () => renderCurrentStep(),
          "secondary-button"
        );
      }
    });

    questionContainer.appendChild(button);
  });
}


/* ---------------------------------------------------------
   ÉTAPE 8 — Joyeux anniversaire, Garden ! 🎉❤️
   --------------------------------------------------------- */

function renderStepEight(step) {
  stepEightVideoIndex = 0;

  stepBody.innerHTML = `
    <p class="message">
      Tu es arrivé jusqu’ici…
      Alors cette fois, je veux simplement te laisser regarder. ❤️
    </p>
  `;

  renderFirstVideo();
}


function renderFirstVideo() {
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  const intro = document.createElement("div");

  intro.className = "transition-text";

  intro.innerHTML = `
    Tu es arrivé jusqu’ici…<br>
    Alors cette fois, je ne vais pas te poser de question.<br>
    Je veux simplement te laisser regarder. ❤️<br><br>

    🎬 <strong>Un petit souvenir…</strong><br>
    Regarde bien. 👀
  `;

  mediaContainer.appendChild(intro);

  const wrapper = document.createElement("div");
  wrapper.className = "media-block";

  const video = document.createElement("video");

  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = VIDEO_1_URL;

  wrapper.appendChild(video);
  mediaContainer.appendChild(wrapper);

  video.addEventListener("ended", () => {
    renderVideoTransition();
  });

  addButton("Continuer ❤️", () => {
    video.pause();
    renderVideoTransition();
  });
}


function renderVideoTransition() {
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  const transition = document.createElement("div");

  transition.className = "transition-text";

  transition.innerHTML = `
    <strong>Et maintenant…</strong><br><br>

    Il y a une autre vidéo que je voulais absolument te montrer.<br>
    Parce que celle-ci me rappelle quelque chose de particulier.<br>
    Un moment que je n’ai pas oublié. ❤️
  `;

  mediaContainer.appendChild(transition);

  addButton("Voir la suite 🎬", () => {
    renderSecondVideo();
  });
}


function renderSecondVideo() {
  mediaContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "media-block";

  const video = document.createElement("video");

  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = VIDEO_2_URL;

  wrapper.appendChild(video);
  mediaContainer.appendChild(wrapper);

  const afterMessage = document.createElement("div");

  afterMessage.className = "transition-text";

  afterMessage.innerHTML = `
    Tu m’avais dit quelque chose d’important dans cette vidéo.<br><br>

    Et aujourd’hui, à mon tour, j’avais envie de te rappeler une chose :<br>
    <strong>tu comptes. ❤️</strong><br><br>

    Peut-être que tu ne comprends pas encore pourquoi j’ai choisi
    tous ces petits détails pour cette surprise…<br>
    Mais bientôt, tout prendra son sens. ✨<br><br>

    Alors garde encore un peu de patience.<br>
    <strong>Il reste une dernière étape. 👀❤️</strong>
  `;

  mediaContainer.appendChild(afterMessage);

  video.addEventListener("ended", () => {
    addFinalVideoButton();
  });

  addFinalVideoButton();
}


function addFinalVideoButton() {
  if (
    actionContainer.querySelector(
      '[data-final-video-button="true"]'
    )
  ) {
    return;
  }

  const button = document.createElement("button");

  button.type = "button";
  button.className = "primary-button";
  button.dataset.finalVideoButton = "true";
  button.textContent = "Continuer ❤️";

  button.addEventListener("click", async () => {
    await goToNextStep();
  });

  actionContainer.appendChild(button);
}


/* ---------------------------------------------------------
   ÉTAPE 9 — Enfin… tu sais qui je suis ❤️
   --------------------------------------------------------- */

function renderStepNine() {
  pauseBackgroundMusic();

  stepBody.innerHTML = `
    <p class="message">
      La dernière étape de cette aventure…
      Celle où tous les petits détails vont enfin prendre leur sens. ❤️
    </p>

    <div class="final-message">

      Alors…<br><br>

      Tu as trouvé les indices.<br>
      Tu as traversé les souvenirs.<br>
      Tu as relevé le défi.<br>
      Tu as écouté.<br>
      Tu as regardé.<br>
      Et maintenant, tu sais qui se cachait derrière tout ça. ❤️<br><br>

      <strong>C’était moi. Rebecca.</strong><br><br>

      Mais au fond, cette surprise n’a jamais été seulement
      une façon de te souhaiter un joyeux anniversaire.<br><br>

      Je voulais créer quelque chose que tu pourrais découvrir
      petit à petit.<br>
      Quelque chose qui te ferait sourire, réfléchir,
      peut-être même te rappeler certains moments. ✨<br><br>

      Et si tu te demandes encore pourquoi j’ai choisi le mot
      <strong>« Sueño »</strong>…<br><br>

      C’est parce qu’un sueño, c’est un rêve.<br>
      Quelque chose que l’on imagine, que l’on espère,
      que l’on aimerait voir devenir réel.<br><br>

      Et parfois, certains rêves commencent simplement par
      une rencontre, un souvenir, une personne qui prend une
      place particulière dans notre histoire. ❤️<br><br>

      Alors aujourd’hui, pour tes <strong>22 ans</strong>…<br><br>

      Je voulais simplement te dire :<br>
      <strong>Joyeux anniversaire, Garden. 🎂❤️</strong><br><br>

      J’espère que cette nouvelle année de ta vie sera remplie
      de beaux rêves, de belles rencontres, de réussite et de
      moments que tu n’oublieras jamais.<br><br>

      Et surtout…<br>
      <strong>n’arrête jamais de rêver. 🌙✨</strong><br><br>

      Parce qu’on ne sait jamais jusqu’où un simple
      <strong>sueño</strong> peut nous mener.<br><br>

      ❤️ <strong>Fin de la surprise.</strong>
    </div>
  `;

  actionContainer.innerHTML = `
    <div class="transition-text">
      🌙✨
    </div>
  `;
}


/* ---------------------------------------------------------
   Étape générique — sécurité
   --------------------------------------------------------- */

function renderGenericStep(step) {
  if (step.body_text) {
    stepBody.innerHTML = `
      <p class="message">
        ${formatText(step.body_text)}
      </p>
    `;
  }

  const stepMedia = getStepMedia(step.id);

  stepMedia.forEach((item) => {
    renderMediaItem(item);
  });

  addButton("Continuer ❤️", async () => {
    await goToNextStep();
  });
}


/* ---------------------------------------------------------
   Affichage média Supabase
   --------------------------------------------------------- */

function renderMediaItem(item) {
  if (!item.media_url) return;

  const wrapper = document.createElement("div");

  wrapper.className = "media-block";

  if (isImage(item)) {
    const image = document.createElement("img");

    image.src = item.media_url;
    image.alt = item.caption || "Souvenir";

    wrapper.appendChild(image);

    if (item.caption) {
      const caption = document.createElement("p");

      caption.className = "caption";
      caption.textContent = item.caption;

      wrapper.appendChild(caption);
    }
  }

  else if (isVideo(item)) {
    const video = document.createElement("video");

    video.src = item.media_url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";

    wrapper.appendChild(video);

    if (item.caption) {
      const caption = document.createElement("p");

      caption.className = "caption";
      caption.textContent = item.caption;

      wrapper.appendChild(caption);
    }
  }

  else if (isAudio(item)) {
    const audio = document.createElement("audio");

    audio.src = item.media_url;
    audio.controls = true;
    audio.preload = "metadata";

    wrapper.appendChild(audio);

    if (item.caption) {
      const caption = document.createElement("p");

      caption.className = "caption";
      caption.textContent = item.caption;

      wrapper.appendChild(caption);
    }
  }

  if (wrapper.children.length) {
    mediaContainer.appendChild(wrapper);
  }
}


/* ---------------------------------------------------------
   Gestion des erreurs
   --------------------------------------------------------- */

function showError(message) {
  if (welcomeScreen) {
    welcomeScreen.classList.remove("hidden");
  }

  if (surpriseScreen) {
    surpriseScreen.classList.add("hidden");
  }

  if (welcomeText) {
    welcomeText.innerHTML = `
      <span class="error-message">
        ${escapeHtml(message)}
      </span>
    `;
  }
}


/* ---------------------------------------------------------
   Initialisation
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAllData();

    showWelcome();

  } catch (error) {
    console.error(
      "Erreur lors du chargement de la surprise :",
      error
    );

    showError(
      "Oups… Impossible de charger la surprise. Réessayer ❤️"
    );
  }
});
