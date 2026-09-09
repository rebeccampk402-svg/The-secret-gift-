# The Secret Gift

**The Secret Gift** is a single personalized interactive surprise application.

The application is designed to host many different surprises inside one shared experience. Each surprise can have its own recipient, steps, questions, answers, feedback, photos, audio, videos and final reveal.

## Current prototype

- Recipient: Garden
- Occasion: Birthday
- Current prototype: 9 steps
- Backend: Supabase
- Frontend: HTML, CSS and JavaScript
- Hosting: Cloudflare Pages
- Repository: GitHub

## Current 9-step experience

1. Bienvenue dans ta surprise ❤️
2. A Blast from the Past 📸
3. A Little Challenge 🧩
4. Écoute bien… 🎧
5. Un message pour toi ❤️
6. Quelques mots pour toi ❤️
7. Dernier défi avant la surprise 👀
8. Joyeux anniversaire, Garden ! 🎉❤️
9. Enfin… tu sais qui je suis ❤️

## Main features

- Full-screen magical visual atmosphere
- Shared background image
- Step-by-step navigation
- Multiple-choice questions
- Correct and incorrect feedback
- Retry behavior for incorrect answers
- Photos displayed in sequence
- Audio and video media
- Background music
- Background music pauses during Christina Perri's “Human” and resumes at the same position
- Final reveal
- Progress saved in Supabase

## Supabase tables used

- `surprise`
- `steps`
- `question`
- `answers`
- `media`
- `progress`

Important column names used by the current prototype:

- `steps.created_at`
- `media.created_at`
- `progress.updated_at`

## Background music

The prototype background music is:

`mixkit-fright-night-871.mp3`

It starts when the recipient presses **Commencer ❤️**, loops automatically, pauses for `Christina.mp3` on step 4, then resumes from the same playback position.

## Project structure

```text
Le-cadeau-secret/
├── README.md
├── index.html
├── style.css
├── app.js
└── assets/
    └── welcome-reference.png
```

## Deployment

The project is intended to be deployed from the `main` branch through Cloudflare Pages.
