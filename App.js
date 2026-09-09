const SUPABASE_URL = "https://djujhfmusguvxqremdpp.supabase.co";
const SUPABASE_KEY = "sb_publishable_oJHpVpdT0-l_05ng5iTweQ_NZj5yuDg";
const SURPRISE_ID = "52889a77-b944-46e9-8a1a-d6f21dad11e8";

const BACKGROUND_MUSIC_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/mixkit-fright-night-871.mp3";

const CHRISTINA_MUSIC_URL =
  "https://djujhfmusguvxqremdpp.supabase.co/storage/v1/object/public/Media/Christina.mp3";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let steps = [];
let currentStepIndex = 0;
let currentStep = null;
let pausedMusicTime = 0;

const backgroundMusic = document.getElementById("background-music");
const christinaAudio = document.getElementById("christina-audio");
const welcomeScreen = document.getElementById("welcome-screen");
const surpriseScreen = document.getElementById("surprise-screen");
const welcomeButton = document.getElementById("start-button");

const stepNumber = document.getElementById("step-number");
const stepTitle = document.getElementById("step-title");
const stepBody = document.getElementById("step-body");

const questionContainer = document.getElementById("question-container");
const mediaContainer = document.getElementById("media-container");
const feedbackContainer = document.getElementById("feedback-container");
const actionContainer = document.getElementById("action-container");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (backgroundMusic) {
      backgroundMusic.src = BACKGROUND_MUSIC_URL;
      backgroundMusic.loop = true;
      backgroundMusic.preload = "auto";
    }

    if (christinaAudio) {
      christinaAudio.src = CHRISTINA_MUSIC_URL;
      christinaAudio.preload = "metadata";
      christinaAudio.style.display = "none";
    }

    await loadSurprise();
  } catch (error) {
    console.error(error);
    showError("Impossible de charger la surprise.");
  }
});

async function loadSurprise() {
  const { error: surpriseError } = await supabaseClient
    .from("surprises")
    .select("*")
    .eq("id", SURPRISE_ID)
    .single();

  if (surpriseError) throw surpriseError;

  const { data: stepsData, error: stepsError } = await supabaseClient
    .from("steps")
    .select("*")
    .eq("surprise_id", SURPRISE_ID)
    .order("step_number", { ascending: true });

  if (stepsError) throw stepsError;

  steps = stepsData || [];

  if (!steps.length) {
    throw new Error("Aucune étape trouvée.");
  }

  showWelcome();
}

function showWelcome() {
  if (welcomeScreen) {
    welcomeScreen.style.display = "flex";
  }

  if (surpriseScreen) {
    surpriseScreen.style.display = "none";
  }
}

if (welcomeButton) {
  welcomeButton.addEventListener("click", async () => {
    if (welcomeScreen) {
      welcomeScreen.style.display = "none";
    }

    if (surpriseScreen) {
      surpriseScreen.style.display = "block";
    }

    try {
      await backgroundMusic.play();
    } catch (error) {
      console.warn("Lecture automatique bloquée :", error);
    }

    await renderStep(0);
  });
}

function pauseBackgroundMusic() {
  if (!backgroundMusic) return;

  pausedMusicTime = backgroundMusic.currentTime;
  backgroundMusic.pause();
}

async function resumeBackgroundMusic() {
  if (!backgroundMusic) return;

  backgroundMusic.currentTime = pausedMusicTime;

  try {
    await backgroundMusic.play();
  } catch (error) {
    console.warn("Impossible de reprendre la musique :", error);
  }
}

function stopBackgroundMusic() {
  if (!backgroundMusic) return;

  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

async function renderStep(index) {
  if (index < 0 || index >= steps.length) return;

  currentStepIndex = index;
  currentStep = steps[index];

  clearStep();

  if (stepNumber) {
    stepNumber.textContent =
      String(currentStep.step_number).padStart(2, "0") +
      " / " +
      String(steps.length).padStart(2, "0");
  }

  if (stepTitle) {
    stepTitle.textContent = currentStep.title || "";
  }

  if (stepBody) {
    stepBody.innerHTML = formatText(currentStep.body || "");
  }

  if (currentStep.step_number === 2) {
    return renderStep2();
  }

  if (
    currentStep.step_number === 3 ||
    currentStep.step_number === 7
  ) {
    return renderQuestionStep();
  }

  if (currentStep.step_number === 4) {
    return renderStep4();
  }

  if (currentStep.step_number === 8) {
    return renderStep8();
  }

  if (currentStep.step_number === 9) {
    return renderFinalStep();
  }

  createContinueButton();
}

function clearStep() {
  if (questionContainer) {
    questionContainer.innerHTML = "";
  }

  if (mediaContainer) {
    mediaContainer.innerHTML = "";
  }

  if (feedbackContainer) {
    feedbackContainer.innerHTML = "";
  }

  if (actionContainer) {
    actionContainer.innerHTML = "";
  }

  if (christinaAudio) {
    christinaAudio.pause();
    christinaAudio.currentTime = 0;
    christinaAudio.style.display = "none";
  }
}

function formatText(text) {
  return (text || "")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function createContinueButton() {
  actionContainer.innerHTML = "";

  const button = document.createElement("button");
  button.className = "action-button";
  button.textContent = "Continuer ❤️";

  button.addEventListener("click", goToNextStep);

  actionContainer.appendChild(button);
}

async function goToNextStep() {
  if (currentStepIndex >= steps.length - 1) {
    stopBackgroundMusic();
    return;
  }

  currentStepIndex++;

  await saveProgress(currentStepIndex + 1);
  await renderStep(currentStepIndex);
}

async function saveProgress(stepValue) {
  try {
    const { data: existingProgress } = await supabaseClient
      .from("progress")
      .select("*")
      .eq("surprise_id", SURPRISE_ID)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existingProgress) {
      await supabaseClient
        .from("progress")
        .update({
          current_step: stepValue,
          updated_at: now
        })
        .eq("id", existingProgress.id);
    } else {
      await supabaseClient
        .from("progress")
        .insert({
          surprise_id: SURPRISE_ID,
          current_step: stepValue,
          updated_at: now
        });
    }
  } catch (error) {
    console.warn("Erreur progression :", error);
  }
}

async function renderStep2() {
  const { data: media, error } = await supabaseClient
    .from("media")
    .select("*")
    .eq("step_id", currentStep.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur médias :", error);
    return createContinueButton();
  }

  const photos = (media || []).filter(
    item =>
      item.media_type === "image" ||
      item.media_type === "photo"
  );

  const captions = [
    "Certains souvenirs commencent simplement…",
    "Puis on découvre peu à peu les différentes facettes d’une personne.",
    "Et certains moments restent surtout pour le sourire qu’ils nous laissent. ❤️",
    "Parce que les souvenirs les plus simples peuvent parfois devenir les plus précieux.",
    "Et puis il y a ces moments qu’on n’oublie pas…"
  ];

  if (!photos.length) {
    return createContinueButton();
  }

  let photoIndex = 0;

  function showPhoto() {
    mediaContainer.innerHTML = "";
    actionContainer.innerHTML = "";

    const image = document.createElement("img");
    image.src = photos[photoIndex].media_url;
    image.alt = "Souvenir";
    image.className = "memory-photo";

    const caption = document.createElement("p");
    caption.className = "memory-caption";
    caption.textContent = captions[photoIndex] || "";

    mediaContainer.appendChild(image);
    mediaContainer.appendChild(caption);

    const button = document.createElement("button");
    button.className = "action-button";
    button.textContent = "Continuer ❤️";

    button.addEventListener("click", () => {
      if (photoIndex < photos.length - 1) {
        photoIndex++;
        showPhoto();
      } else {
        showStep2Transition();
      }
    });

    actionContainer.appendChild(button);
  }

  showPhoto();
}

function showStep2Transition() {
  mediaContainer.innerHTML =
    '<div class="transition-text">' +
    "Mais est-ce que tu te souviens vraiment ? 👀" +
    "<br><br>" +
    "Voyons ça…" +
    "</div>";

  actionContainer.innerHTML = "";

  const button = document.createElement("button");
  button.className = "action-button";
  button.textContent = "Continuer ❤️";

  button.addEventListener("click", renderQuestionStep);

  actionContainer.appendChild(button);
                          }
async function renderQuestionStep() {
  const { data: questions, error } = await supabaseClient
    .from("questions")
    .select("*")
    .eq("step_id", currentStep.id)
    .order("created_at", { ascending: true });

  if (error || !questions || !questions.length) {
    return createContinueButton();
  }

  const question = questions[0];

  questionContainer.innerHTML = "";

  const questionText = document.createElement("div");
  questionText.className = "question-text";
  questionText.textContent = question.question_text;

  questionContainer.appendChild(questionText);

  const { data: choices, error: choiceError } =
    await supabaseClient
      .from("answer_choices")
      .select("*")
      .eq("question_id", question.id)
      .order("choice_order", { ascending: true });

  if (choiceError) {
    console.error("Erreur réponses :", choiceError);
    return;
  }

  choices.forEach(choice => {
    const button = document.createElement("button");

    button.className = "answer-choice";
    button.textContent = choice.choice_text;

    button.addEventListener("click", () => {
      handleAnswer(choice);
    });

    questionContainer.appendChild(button);
  });
}

function handleAnswer(choice) {
  feedbackContainer.innerHTML = "";
  actionContainer.innerHTML = "";

  const feedback = document.createElement("div");

  feedback.className = choice.is_correct
    ? "feedback correct"
    : "feedback wrong";

  feedback.innerHTML = formatText(
    choice.feedback ||
      (choice.is_correct
        ? "✨ Bonne réponse ! ❤️"
        : "Hmm… pas encore. 👀")
  );

  feedbackContainer.appendChild(feedback);

  const button = document.createElement("button");

  button.className = "action-button";
  button.textContent = choice.is_correct
    ? "Continuer ❤️"
    : "Réessayer";

  button.addEventListener(
    "click",
    choice.is_correct
      ? goToNextStep
      : renderQuestionStep
  );

  actionContainer.appendChild(button);
}

async function renderStep4() {
  pauseBackgroundMusic();

  mediaContainer.innerHTML = "";

  const before = document.createElement("div");

  before.className = "media-message";

  before.innerHTML =
    "Cette fois, pas d’énigme. 🎧<br>" +
    "Juste un moment pour écouter… et laisser la musique parler. ❤️<br><br>" +
    "Mets-toi à l’aise, écoute bien jusqu’au bout. " +
    "Peut-être que tu comprendras pourquoi j’ai choisi cette chanson pour toi. ✨";

  mediaContainer.appendChild(before);

  if (christinaAudio) {
    christinaAudio.src = CHRISTINA_MUSIC_URL;
    christinaAudio.controls = true;
    christinaAudio.style.display = "block";

    mediaContainer.appendChild(christinaAudio);
  }

  const after = document.createElement("div");

  after.className = "media-message";

  after.innerHTML =
    "Alors… qu’est-ce que cette chanson t’a fait ressentir ? ❤️<br><br>" +
    "Certaines choses sont difficiles à expliquer avec des mots.<br>" +
    "Parfois, une chanson peut simplement dire ce qu’on n’arrive pas à dire soi-même. 🎧❤️<br><br>" +
    "Mais ne t’arrête pas là…<br>" +
    "<strong>La suite t’attend.</strong> 👀";

  mediaContainer.appendChild(after);

  if (christinaAudio) {
    christinaAudio.onended = resumeBackgroundMusic;
  }

  createContinueButton();
}

async function renderStep8() {
  const { data: media, error } = await supabaseClient
    .from("media")
    .select("*")
    .eq("step_id", currentStep.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur vidéos :", error);
    return createContinueButton();
  }

  const videos = (media || []).filter(
    item => item.media_type === "video"
  );

  if (!videos.length) {
    return createContinueButton();
  }

  let videoIndex = 0;

  function showVideo() {
    mediaContainer.innerHTML = "";
    actionContainer.innerHTML = "";

    const text = document.createElement("div");

    text.className = "media-message";

    text.innerHTML =
      videoIndex === 0
        ? "Tu es arrivé jusqu’ici…<br>" +
          "Alors cette fois, je ne vais pas te poser de question.<br>" +
          "Je veux simplement te laisser regarder. ❤️<br><br>" +
          "🎬 <strong>Un petit souvenir…</strong><br>" +
          "Regarde bien. 👀"
        : "<strong>Et maintenant…</strong><br><br>" +
          "Il y a une autre vidéo que je voulais absolument te montrer.<br>" +
          "Parce que celle-ci me rappelle quelque chose de particulier.<br>" +
          "Un moment que je n’ai pas oublié. ❤️";

    mediaContainer.appendChild(text);

    const video = document.createElement("video");

    video.src = videos[videoIndex].media_url;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.className = "surprise-video";

    mediaContainer.appendChild(video);

    video.addEventListener("ended", () => {
      if (videoIndex < videos.length - 1) {
        videoIndex++;

        const button = document.createElement("button");

        button.className = "action-button";
        button.textContent = "Continuer ❤️";

        button.addEventListener("click", showVideo);

        actionContainer.appendChild(button);
      } else {
        showStep8FinalText();
      }
    });
  }

  showVideo();
}

function showStep8FinalText() {
  mediaContainer.innerHTML =
    '<div class="media-message">' +
    "Tu m’avais dit quelque chose d’important dans cette vidéo.<br>" +
    "Et aujourd’hui, à mon tour, j’avais envie de te rappeler une chose :<br>" +
    "<strong>tu comptes.</strong> ❤️<br><br>" +
    "Peut-être que tu ne comprends pas encore pourquoi j’ai choisi tous ces petits détails pour cette surprise…<br>" +
    "Mais bientôt, tout prendra son sens. ✨<br><br>" +
    "Alors garde encore un peu de patience.<br>" +
    "<strong>Il reste une dernière étape.</strong> 👀❤️" +
    "</div>";

  actionContainer.innerHTML = "";

  const button = document.createElement("button");

  button.className = "action-button";
  button.textContent = "Continuer ❤️";

  button.addEventListener("click", goToNextStep);

  actionContainer.appendChild(button);
}

function renderFinalStep() {
  stopBackgroundMusic();

  mediaContainer.innerHTML =
    '<div class="final-message">' +
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
    "</div>";

  actionContainer.innerHTML = "";
}

function showError(message) {
  document.body.innerHTML =
    '<div class="error-message">' +
    "<h2>Oups…</h2>" +
    "<p>" +
    message +
    "</p>" +
    '<button class="action-button" onclick="location.reload()">' +
    "Réessayer" +
    "</button>" +
    "</div>";
}
