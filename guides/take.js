(function () {
  const guideName = 'take';
  const PROGRESS_KEY = 'thaiStudyProgress_take';
  const FEEDBACK_ENDPOINT = 'https://thai-study-feedback.mangaku01-python.workers.dev/feedback';
  const takeReportQuestion = document.getElementById('takeReportQuestion');
  const lineFeedbackModal = document.getElementById('lineFeedbackModal');
  const lineFeedbackSummary = document.getElementById('lineFeedbackSummary');
  const lineFeedbackText = document.getElementById('lineFeedbackText');
  const lineFeedbackStatus = document.getElementById('lineFeedbackStatus');
  const lineFeedbackCancel = document.getElementById('lineFeedbackCancel');
  const lineFeedbackSend = document.getElementById('lineFeedbackSend');
  let pendingFeedback = null;
  let feedbackSession = 0;

  const vocabulary = [
    ["Take out / take away","เอาออกไป","ao ook bpai","Remove something or carry it outside.","เอาออกไป"],
    ["Take turns","ผลัดกัน","phlat gan","Do something one after another.","เทค เทิร์น"],
    ["Take sides","เข้าข้าง","khao khaang","Support one person or group.","เทค ไซด์"],
    ["Take place","เกิดขึ้น","goet kheun","Happen or occur.","เทค เพลส"],
    ["Take back","นำกลับคืนมา","nam glap kheun maa","Return or bring something back.","เทค แบ็ก"],
    ["Take after","มีหน้าตาคล้าย","mii naa-dtaa khlaai","Look like an older family member.","เทค อาฟเตอร์"],
    ["Take up","เริ่มต้นทำ","roem dton tham","Begin a new activity or hobby.","เทค อัพ"],
    ["Take control","ควบคุม","khuap khum","Gain or exercise control.","เทค คอนโทรล"],
    ["Take over","เข้าควบคุม","khao khuap khum","Assume control from someone else.","เทค โอเวอร์"],
    ["Take time","ใช้เวลา","chai way-laa","Require or use time.","เทค ไทม์"],
    ["Take notes","จด / จดบันทึก","jot / jot ban-theuk","Write important information down.","เทค โน้ต"],
    ["Take a look","ดู / มองดู","duu / mong duu","Look at something.","เทค อะ ลุค"],
    ["Take a guess","เดา / เดาดู","dao / dao duu","Give an answer without certainty.","เทค อะ เกส"],
    ["Take a risk","เสี่ยง","siang","Do something that may have a bad result.","เทค อะ ริสก์"],
    ["Take a chance","ลองเสี่ยงดู","laawng siang duu","Try despite uncertainty.","เทค อะ แชนซ์"],
    ["Take a break","พักเบรก","phak break","Stop working briefly.","เทค อะ เบรก"],
    ["Take a rest","พักผ่อน","phak phaawn","Relax to recover energy.","เทค อะ เรสต์"],
    ["Take a bow","โค้งคำนับ","khong kham-nap","Bend forward to show respect.","เทค อะ บาว"],
    ["Take an exam","สอบ","saawp","Sit for an examination.","เทค แอน เอ็กแซม"],
    ["Take a shower","อาบน้ำ","aap naam","Wash your body in a shower.","เทค อะ ชาวเวอร์"]
  ].map(([en, th, roman, note, sound]) => ({ en, th, roman, note, sound }));

  const state = {
    index: 0,
    score: 0,
    done: false,
    completed: false,
    questions: []
  };

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (saved && Array.isArray(saved.questions) && saved.questions.length === vocabulary.length && saved.questions.every((question) => question && question.item && typeof question.index === 'number') && typeof saved.index === 'number' && saved.index >= 0 && saved.index < vocabulary.length && typeof saved.score === 'number' && saved.score >= 0 && saved.score <= vocabulary.length) {
        state.questions = saved.questions;
        state.index = Math.min(saved.index, state.questions.length - 1);
        state.score = Math.max(saved.score, 0);
        state.completed = saved.completed === true || (saved.answered === true && state.index === state.questions.length - 1);
        if (saved.answered === true && !state.completed) state.index += 1;
        return true;
      }
    } catch (error) {
      // ignore invalid progress
    }
    return false;
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ index: state.index, score: state.score, answered: state.done, completed: state.completed, questions: state.questions }));
    } catch (error) {
      // Continue the quiz if storage is unavailable.
    }
  }

  function buildQuestions() {
    const shuffled = shuffle(vocabulary.map((item, index) => ({ mode: 'vocab', item, index, flip: Math.random() < 0.5 })));
    state.questions = shuffled;
    state.index = 0;
    state.score = 0;
    state.done = false;
    state.completed = false;
  }

  function getOptions(question) {
    const choices = shuffle(vocabulary.map((item, index) => ({ item, index })).filter(({ index }) => index !== question.index)).slice(0, 3);
    const options = shuffle([
      { item: question.item, index: question.index },
      ...choices
    ]).map(({ item, index }) => ({ label: question.flip ? item.en : item.th, index }));
    return options;
  }

  function renderQuestion() {
    const question = state.questions[state.index];
    const prompt = document.getElementById('takePrompt');
    const questionNode = document.getElementById('takeQuestion');
    const answerWrap = document.getElementById('takeAnswers');
    const scoreNode = document.getElementById('takeScore');
    const progressNode = document.getElementById('takeProgress');
    const progressFill = document.getElementById('takeProgressFill');

    if (!question) return;

    state.done = false;
    scoreNode.textContent = `Score: ${state.score}`;
    progressNode.textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    progressFill.style.width = `${((state.index + 1) / state.questions.length) * 100}%`;

    prompt.textContent = question.flip ? 'What does this mean?' : 'Choose the Thai meaning.';
    questionNode.textContent = question.flip ? question.item.th : question.item.en;
    questionNode.className = 'take-question ' + (question.flip ? 'thai' : 'english');

    answerWrap.innerHTML = '';
    getOptions(question).forEach((option, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'take-answer';
      button.dataset.index = String(option.index);
      button.innerHTML = `<span class="letter">${'ABCDE'[idx]}</span>${option.label}`;
      button.addEventListener('click', () => selectAnswer(button, option.index));
      answerWrap.appendChild(button);
    });

    const nextButton = document.getElementById('takeNext');
    nextButton.textContent = state.index === state.questions.length - 1 ? 'See My Score →' : 'Next Question →';
    document.getElementById('takeFeedback').className = 'take-feedback';
  }

  function renderStudyGuide() {
    const studyGrid = document.getElementById('takeStudyGrid');
    studyGrid.innerHTML = vocabulary.map((item, index) => `<article class="study-item"><div>${String(index + 1).padStart(2, '0')}</div><h3>${item.en}</h3><div class="th">${item.th}</div><div>${item.roman}</div><p>${item.note}</p></article>`).join('');
  }

  function openLineFeedback(data) {
    feedbackSession += 1;
    lineFeedbackSend.disabled = false;
    pendingFeedback = data;
    lineFeedbackSummary.textContent = `Question ${data.questionNumber} · ${data.guide}`;
    lineFeedbackText.value = '';
    lineFeedbackStatus.textContent = '';
    lineFeedbackModal.hidden = false;
    lineFeedbackText.focus();
  }

  function closeLineFeedback() {
    feedbackSession += 1;
    lineFeedbackModal.hidden = true;
    document.getElementById(guideName + 'ReportQuestion').focus();
  }

  function selectAnswer(button, chosenIndex) {
    if (state.done) return;
    const question = state.questions[state.index];
    const correctIndex = question.index;
    const isCorrect = chosenIndex === correctIndex;

    if (isCorrect) {
      state.score += 1;
    }
    state.done = true;

    document.querySelectorAll('.take-answer').forEach((node) => {
      const isCorrectNode = Number(node.dataset.index) === correctIndex;
      node.disabled = true;
      if (isCorrectNode) node.classList.add('correct');
      if (!isCorrect && Number(node.dataset.index) === chosenIndex) node.classList.add('wrong');
    });

    const feedback = document.getElementById('takeFeedback');
    const feedbackTitle = document.getElementById('takeFeedbackTitle');
    const feedbackThai = document.getElementById('takeFeedbackThai');
    const feedbackRoman = document.getElementById('takeFeedbackRoman');
    const feedbackMeaning = document.getElementById('takeFeedbackMeaning');
    const feedbackExplain = document.getElementById('takeFeedbackExplain');

    feedbackTitle.textContent = isCorrect ? '✓ Correct' : '✗ Not quite';
    feedbackThai.textContent = question.item.th;
    feedbackRoman.textContent = question.item.roman;
    feedbackMeaning.textContent = question.item.en;
    feedbackExplain.textContent = question.item.note;
    feedback.className = 'take-feedback show ' + (isCorrect ? 'good' : 'bad');

    document.getElementById('takeScore').textContent = `Score: ${state.score}`;
    saveProgress();
  }

  function goNext() {
    if (!state.done) return;

    if (state.index >= state.questions.length - 1) {
      state.completed = true;
      saveProgress();
      showResults();
      return;
    }

    state.index += 1;
    state.done = false;
    saveProgress();
    renderQuestion();
  }

  function showResults() {
    const results = document.getElementById('takeResults');
    const quiz = document.getElementById('takeQuiz');
    const finalScore = document.getElementById('takeFinalScore');
    const resultMessage = document.getElementById('takeResultMessage');

    quiz.hidden = true;
    results.hidden = false;
    finalScore.textContent = `${state.score}/${state.questions.length}`;

    const ratio = state.score / state.questions.length;
    resultMessage.textContent = ratio === 1
      ? 'Perfect score!'
      : ratio >= 0.8
        ? 'Strong work.'
        : ratio >= 0.6
          ? 'Good progress. Review and try again.'
          : 'Study the guide once, then try again.';
  }

  function restart() {
    buildQuestions();
    saveProgress();
    const results = document.getElementById('takeResults');
    const quiz = document.getElementById('takeQuiz');
    results.hidden = true;
    quiz.hidden = false;
    renderQuestion();
  }

  function init() {
    if (!loadProgress()) buildQuestions();
    renderStudyGuide();
    if (state.completed) showResults();
    else renderQuestion();

    document.getElementById('takeNext').addEventListener('click', goNext);
    document.getElementById('takeRestart').addEventListener('click', restart);
    document.getElementById('takeShowGuide').addEventListener('click', () => {
      document.getElementById('takeStudy').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    lineFeedbackCancel.addEventListener('click', closeLineFeedback);
    lineFeedbackModal.addEventListener('click', (event) => {
      if (event.target === lineFeedbackModal) closeLineFeedback();
    });
    lineFeedbackModal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLineFeedback();
      if (event.key === 'Tab') {
        const last = lineFeedbackSend.disabled ? lineFeedbackCancel : lineFeedbackSend;
        if (event.shiftKey && document.activeElement === lineFeedbackText) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          lineFeedbackText.focus();
        }
      }
    });
    lineFeedbackSend.addEventListener('click', async () => {
      if (lineFeedbackSend.disabled) return;
      const session = feedbackSession;
      const feedback = lineFeedbackText.value.trim();
      if (!feedback) return lineFeedbackText.focus();

      const profile = window.thaiStudyShared ? window.thaiStudyShared.getProfile() : null;
      lineFeedbackSend.disabled = true;
      lineFeedbackStatus.textContent = 'Sending…';
      try {
        const response = await fetch(FEEDBACK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...pendingFeedback,
            studentName: profile && profile.name ? profile.name : 'Not provided',
            studentEmail: profile && profile.email ? profile.email : 'Not provided',
            feedback
          })
        });
        if (session !== feedbackSession) return;
        if (!response.ok) throw new Error('send failed');
        lineFeedbackStatus.textContent = '✓ Feedback sent. Thank you.';
        setTimeout(() => {
          if (session === feedbackSession) closeLineFeedback();
        }, 900);
      } catch (error) {
        if (session !== feedbackSession) return;
        lineFeedbackStatus.textContent = 'Could not send feedback. Please try again.';
      } finally {
        if (session === feedbackSession) lineFeedbackSend.disabled = false;
      }
    });
    takeReportQuestion.addEventListener('click', () => {
      const question = state.questions[state.index];
      openLineFeedback({
        guide: 'Take Expressions',
        questionNumber: (state.index + 1) + ' of ' + state.questions.length,
        english: question.item.en,
        thai: question.item.th,
        answer: question.flip ? question.item.en : question.item.th
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window[guideName + 'Guide'] = { renderQuestion, restart, selectAnswer };
})();
