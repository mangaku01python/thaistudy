(function () {
  const guideName = 'vision';
  const PROGRESS_KEY = 'thaiStudyProgress_vision';
  const FEEDBACK_ENDPOINT = 'https://thai-study-feedback.mangaku01-python.workers.dev/feedback';
  const visionReportQuestion = document.getElementById('visionReportQuestion');
  const lineFeedbackModal = document.getElementById('lineFeedbackModal');
  const lineFeedbackSummary = document.getElementById('lineFeedbackSummary');
  const lineFeedbackText = document.getElementById('lineFeedbackText');
  const lineFeedbackStatus = document.getElementById('lineFeedbackStatus');
  const lineFeedbackCancel = document.getElementById('lineFeedbackCancel');
  const lineFeedbackSend = document.getElementById('lineFeedbackSend');
  let pendingFeedback = null;
  let feedbackSession = 0;

  const vocab = [
    { en: 'See / notice', th: 'เห็น', roman: 'hen', note: 'Visual perception: notice something without deliberately directing your eyes.' },
    { en: 'Watch / check / examine', th: 'ดู', roman: 'duu', note: 'An intentional action: watch TV, check a phone or examine an engine.' },
    { en: 'Look / direct your gaze', th: 'มอง', roman: 'mong', note: 'Direct your eyes toward a person, object, place or direction.' },
    { en: 'Take a look / observe', th: 'มองดู', roman: 'mong duu', note: 'Look at or observe something with attention.' },
    { en: 'Be able to see / visible', th: 'มองเห็น', roman: 'mong hen', note: 'Emphasizes that something can be seen or is visible.' }
  ];

  const situations = [
    ["I see a car.", 0, 'ฉันเห็นรถ', 'chan hen rot', 'Use เห็น for visually noticing the car.'],
    ['Watch television.', 1, 'ดูทีวี', 'duu thii-wii', 'Use ดู for intentionally watching.'],
    ['Look to your left before crossing the road.', 2, 'มองไปทางซ้ายก่อนข้ามถนน', 'mong bpai thaang saai gaawn khaam tha-non', 'Use มอง to direct your eyes toward a direction.'],
    ['Can you see the mountain?', 4, 'คุณมองเห็นภูเขาไหม', 'khun mong hen phuu-khao mai', 'Use มองเห็น for being able to see.'],
    ['Take a look at this.', 3, 'มองดูนี่', 'mong duu nii', 'มองดู means take a look or observe.'],
    ['Check your phone.', 1, 'ดูโทรศัพท์ของคุณ', 'duu thoo-ra-sap khawng khun', 'Use ดู for checking something.'],
    ['Look toward the door.', 2, 'มองไปทางประตู', 'mong bpai thaang bpra-dtuu', 'มอง directs the gaze toward the door.'],
    ['Yesterday I saw an accident.', 0, 'เมื่อวานฉันเห็นอุบัติเหตุ', 'muea-waan chan hen u-bat-ti-het', 'เห็น describes visual perception.'],
    ['Examine the motorcycle engine.', 1, 'ดูเครื่องยนต์มอเตอร์ไซค์', 'duu khrueang-yon maw-dter-sai', 'Use ดู when examining the engine.'],
    ['Look straight ahead.', 2, 'มองไปข้างหน้า', 'mong bpai khaang naa', 'Use มอง to direct your eyes forward.'],
    ['Observe what he is doing.', 3, 'มองดูว่าเขากำลังทำอะไร', 'mong duu waa khao gam-lang tham a-rai', 'มองดู fits deliberate observation.'],
    ['Watch a movie.', 1, 'ดูหนัง', 'duu nang', 'Use ดู for watching a movie.'],
    ['I see a bird in the tree.', 0, 'ฉันเห็นนกบนต้นไม้', 'chan hen nok bon dton-mai', 'เห็น means visually notice.'],
    ['I cannot see the road clearly.', 4, 'ฉันมองเห็นถนนไม่ชัด', 'chan mong hen tha-non mai chat', 'มองเห็น expresses visibility.'],
    ['He is looking, but he does not see it.', 2, 'เขามอง แต่ไม่เห็น', 'khao mong dtae mai hen', 'มอง is looking; เห็น is the result of seeing.']
  ].map(([en, answerIndex, full, roman, note]) => ({ en, answerIndex, full, roman, note }));

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
      if (saved && Array.isArray(saved.questions) && saved.questions.length === situations.length && saved.questions.every((question) => question && typeof question.answerIndex === 'number' && typeof question.en === 'string') && typeof saved.index === 'number' && saved.index >= 0 && saved.index < situations.length && typeof saved.score === 'number' && saved.score >= 0 && saved.score <= situations.length) {
        state.questions = saved.questions;
        state.index = Math.min(saved.index, state.questions.length - 1);
        state.score = Math.max(saved.score, 0);
        state.completed = saved.completed === true || (saved.answered === true && state.index === state.questions.length - 1);
        if (saved.answered === true && !state.completed) state.index += 1;
        return true;
      }
    } catch (error) {
      // ignore invalid storage
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
    state.questions = shuffle(situations.map((item, index) => ({ ...item, index })));
    state.index = 0;
    state.score = 0;
    state.done = false;
    state.completed = false;
  }

  function getOptions(question) {
    const options = shuffle(vocab.map((item, index) => ({ label: item.th, index })))
      .filter(({ index }) => index !== question.answerIndex);
    const correct = { label: vocab[question.answerIndex].th, index: question.answerIndex };
    return shuffle([correct, ...options.slice(0, 3)]);
  }

  function renderQuestion() {
    const question = state.questions[state.index];
    const prompt = document.getElementById('visionPrompt');
    const questionNode = document.getElementById('visionQuestion');
    const answerWrap = document.getElementById('visionAnswers');
    const scoreNode = document.getElementById('visionScore');
    const progressNode = document.getElementById('visionProgress');
    const progressFill = document.getElementById('visionProgressFill');
    const feedback = document.getElementById('visionFeedback');

    state.done = false;
    scoreNode.textContent = `Score: ${state.score}`;
    progressNode.textContent = `Question ${state.index + 1} of ${state.questions.length}`;
    progressFill.style.width = `${((state.index + 1) / state.questions.length) * 100}%`;

    prompt.textContent = 'Which word fits this situation?';
    questionNode.textContent = question.en;
    questionNode.className = 'vision-question english';

    answerWrap.innerHTML = '';
    getOptions(question).forEach((option, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vision-answer';
      button.dataset.index = String(option.index);
      button.innerHTML = `<span class="letter">${'ABCDE'[idx]}</span>${option.label}`;
      button.addEventListener('click', () => selectAnswer(button, option.index));
      answerWrap.appendChild(button);
    });

    feedback.className = 'vision-feedback';
    document.getElementById('visionNext').textContent = state.index === state.questions.length - 1 ? 'See My Score →' : 'Next Question →';
  }

  function renderStudyGuide() {
    const studyGrid = document.getElementById('visionStudyGrid');
    studyGrid.innerHTML = vocab.map((item, index) => `<article class="study-item"><div>${String(index + 1).padStart(2, '0')}</div><h3>${item.en}</h3><div class="th">${item.th}</div><div>${item.roman}</div><p>${item.note}</p></article>`).join('');
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
    const correctIndex = question.answerIndex;
    const isCorrect = chosenIndex === correctIndex;

    if (isCorrect) state.score += 1;
    state.done = true;

    document.querySelectorAll('.vision-answer').forEach((node) => {
      const idx = Number(node.dataset.index);
      node.disabled = true;
      if (idx === correctIndex) node.classList.add('correct');
      if (!isCorrect && idx === chosenIndex) node.classList.add('wrong');
    });

    const feedback = document.getElementById('visionFeedback');
    const title = document.getElementById('visionFeedbackTitle');
    const thai = document.getElementById('visionFeedbackThai');
    const roman = document.getElementById('visionFeedbackRoman');
    const meaning = document.getElementById('visionFeedbackMeaning');
    const explain = document.getElementById('visionFeedbackExplain');

    const correctWord = vocab[correctIndex];
    title.textContent = isCorrect ? '✓ Correct' : '✗ Not quite';
    thai.textContent = correctWord.th;
    roman.textContent = correctWord.roman;
    meaning.textContent = correctWord.en;
    explain.textContent = question.note;
    feedback.className = 'vision-feedback show ' + (isCorrect ? 'good' : 'bad');

    document.getElementById('visionScore').textContent = `Score: ${state.score}`;
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
    const results = document.getElementById('visionResults');
    const quiz = document.getElementById('visionQuiz');
    const finalScore = document.getElementById('visionFinalScore');
    const resultMessage = document.getElementById('visionResultMessage');

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
    document.getElementById('visionQuiz').hidden = false;
    document.getElementById('visionResults').hidden = true;
    renderQuestion();
  }

  function init() {
    if (!loadProgress()) buildQuestions();
    renderStudyGuide();
    if (state.completed) showResults();
    else renderQuestion();

    document.getElementById('visionNext').addEventListener('click', goNext);
    document.getElementById('visionRestart').addEventListener('click', restart);
    document.getElementById('visionShowGuide').addEventListener('click', () => {
      document.getElementById('visionStudy').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    visionReportQuestion.addEventListener('click', () => {
      const question = state.questions[state.index];
      const answer = vocab[question.answerIndex];
      openLineFeedback({
        guide: 'See, Look, Watch & Observe',
        questionNumber: (state.index + 1) + ' of ' + state.questions.length,
        english: question.en,
        thai: question.full,
        answer: answer.th
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window[guideName + 'Guide'] = { renderQuestion, restart, selectAnswer };
})();
