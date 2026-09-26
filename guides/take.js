(function () {
  const guideName = 'take';
  const PROGRESS_KEY = 'thaiStudyProgress_take';
  const QUIZ_VERSION = 'six-verbs-50-v1';
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
    ['Take / want / choose', 'เอา', 'ao', 'A general everyday verb for taking something. In orders and choices, it often means want or choose.'],
    ['Receive / accept / collect', 'รับ', 'rap', 'Receive something someone gives you, accept an offer, or collect a person from an agreed place.'],
    ['Pick up with your hand', 'หยิบ', 'yip', 'Reach for and pick up an object. The focus is the hand action, rather than receiving or continuing to hold it.'],
    ['Hold / carry in your hand', 'ถือ', 'theu', 'Keep an object in your hand, whether standing still or carrying it as you walk.'],
    ['Bring / take (formal)', 'นำ', 'nam', 'Bring or take something to a destination. Common in formal instructions; everyday speech often uses เอา instead.'],
    ['Take / accompany a person or animal', 'พา', 'phaa', 'Go with or guide a person or animal somewhere, such as taking a child to school.']
  ].map(([en, th, roman, note]) => ({ en, th, roman, note }));

  const situations = [
    ['At a drink stall, you choose water instead of tea: "I will have water."', 0, 'เอาน้ำเปล่า', 'ao naam bplao', 'เอา expresses what you want to order. You are choosing a drink, before anyone hands it to you.'],
    ['A shopkeeper shows you two shirts. You point to the blue one: "I will take this one."', 0, 'เอาตัวนี้', 'ao dtua nii', 'เอา identifies your choice. หยิบ would describe physically picking the shirt up.'],
    ['A friend asks whether you want ice in your drink. You say, "No ice."', 0, 'ไม่เอาน้ำแข็ง', 'mai ao naam khaeng', 'ไม่เอา means you do not want something. Here you are stating a preference about your drink.'],
    ['Ordering noodles, you tell the cook, "I do not want bean sprouts."', 0, 'ไม่เอาถั่วงอก', 'mai ao thua ngok', 'เอา is the everyday choice for saying what you want or do not want in an order.'],
    ['At a fruit stall, you decide on two mangoes: "I will take two mangoes."', 0, 'เอามะม่วงสองลูก', 'ao ma-muang saawng luuk', 'เอา states your selection and quantity. The situation is an order, rather than receiving the fruit.'],
    ['Your friend offers to buy you a snack. You choose bread: "I want bread."', 0, 'เอาขนมปัง', 'ao kha-nom bpang', 'เอา can mean want when choosing something. There is no hand movement or delivery to describe here.'],
    ['A seller asks which size you want. You decide: "I will take the small size."', 0, 'เอาขนาดเล็ก', 'ao kha-naat lek', 'เอา marks your choice of size. ถือ would mean holding an object, not choosing a size.'],
    ['You are deciding how many tickets to buy: "I will take three tickets."', 0, 'เอาตั๋วสามใบ', 'ao dtua saam bai', 'เอา is natural for telling a seller what you want to buy. รับ would emphasize receiving the tickets.'],
    ['At a bakery, you point to your selection: "I will take that cake."', 0, 'เอาเค้กชิ้นนั้น', 'ao khek chin nan', 'เอา communicates which cake you want. It does not specifically describe lifting the cake with your hand.'],

    ['A courier hands you a parcel. Which verb emphasizes receiving it from the courier?', 1, 'รับพัสดุจากคนส่งของ', 'rap phat-sa-du jaak khon song khawng', 'รับ focuses on receiving something from another person. หยิบ focuses on picking an object up from a place.'],
    ['The cashier hands you your change. Which verb describes receiving it?', 1, 'รับเงินทอน', 'rap ngoen thawn', 'รับ is used when money passes to you from someone else. You are receiving change, rather than choosing it.'],
    ['A friend gives you a birthday present. Which verb emphasizes accepting the gift?', 1, 'รับของขวัญจากเพื่อน', 'rap khawng khwan jaak phuean', 'รับ describes accepting something offered or given to you. ถือ would describe holding it afterward.'],
    ['You go to the station to collect a friend whose train has just arrived. Which verb emphasizes meeting and picking them up?', 1, 'ไปรับเพื่อนที่สถานีรถไฟ', 'bpai rap phuean thii sa-thaa-nii rot fai', 'รับ can mean collect a person from an agreed place. พา would focus on accompanying the friend onward.'],
    ['School has finished. You go there to pick up your child who is waiting for you.', 1, 'ไปรับลูกที่โรงเรียน', 'bpai rap luuk thii roong rian', 'รับ focuses on collecting your child from school. พาลูกไปโรงเรียน describes taking the child to school.'],
    ['A company offers you a job, and you decide to accept the position.', 1, 'รับงานนี้', 'rap ngaan nii', 'รับ can mean accept an offer or job. This is acceptance, not physically picking something up.'],
    ['A receptionist hands back your passport. Which verb emphasizes receiving it back?', 1, 'รับหนังสือเดินทางคืน', 'rap nang-sue doen thaang kheun', 'รับ describes receiving the passport from the receptionist. คืน adds the meaning back or returned.'],
    ['At a ceremony, the organizer hands you a prize. Which verb describes receiving the award?', 1, 'รับรางวัล', 'rap raang wan', 'รับ is used for receiving an award. นำ would need a different meaning, such as taking the prize somewhere.'],
    ['Your phone rings, and you answer the call. Which verb fits this everyday expression?', 1, 'รับโทรศัพท์', 'rap thoo-ra-sap', 'รับโทรศัพท์ means answer the phone. หยิบโทรศัพท์ means physically pick up the device, without necessarily answering.'],

    ['Your keys are on the table. Which verb specifically describes reaching down and picking them up with your hand?', 2, 'หยิบกุญแจจากโต๊ะ', 'yip gun-jae jaak dto', 'หยิบ names the action of picking an object up. ถือ describes keeping it in your hand afterward.'],
    ['You reach to a shelf and pick up a book. Focus on the hand action.', 2, 'หยิบหนังสือจากชั้น', 'yip nang-sue jaak chan', 'หยิบ emphasizes reaching for and lifting the book from its place. No one is handing it to you.'],
    ['A coin has fallen on the floor. You bend down and pick it up with your fingers.', 2, 'หยิบเหรียญจากพื้น', 'yip rian jaak pheun', 'หยิบ fits picking up a small object with your hand. รับ would emphasize receiving it from someone.'],
    ['You reach into your bag and pick out a pen. Which verb describes that movement?', 2, 'หยิบปากกาจากกระเป๋า', 'yip bpaak-gaa jaak gra-bpao', 'หยิบ focuses on taking an object from where it is resting, using your hand.'],
    ['At a buffet, you reach for a spoon on the tray and pick it up.', 2, 'หยิบช้อนจากถาด', 'yip chaawn jaak thaat', 'หยิบ describes the brief action of picking up the spoon. ถือ would describe continuing to hold it.'],
    ['You open a drawer and lift out a pair of scissors with your hand.', 2, 'หยิบกรรไกรจากลิ้นชัก', 'yip gan-grai jaak lin-chak', 'หยิบ makes the hand action explicit. เอา is more general and does not specifically describe picking it up.'],
    ['Your glasses are beside the bed. You reach over and pick them up.', 2, 'หยิบแว่นตาจากข้างเตียง', 'yip waen dtaa jaak khaang dtiang', 'หยิบ is appropriate for reaching for the glasses and lifting them from their place.'],
    ['Your phone is lying on a desk. It is not ringing; you simply pick it up with your hand.', 2, 'หยิบโทรศัพท์จากโต๊ะ', 'yip thoo-ra-sap jaak dto', 'หยิบ describes lifting the phone. รับโทรศัพท์ would normally mean answering a call.'],

    ['You are standing in the rain with an umbrella already in your hand. Which verb describes holding it?', 3, 'ถือร่มอยู่', 'theu rom yuu', 'ถือ describes keeping the umbrella in your hand. หยิบ would describe the earlier action of picking it up.'],
    ['Your friend ties a shoelace while you keep their bag in your hand for a moment.', 3, 'ถือกระเป๋าให้เพื่อน', 'theu gra-bpao hai phuean', 'ถือ focuses on holding the bag for your friend. There is no destination or journey in this situation.'],
    ['You pose for a photo with a cup in your hand. Which verb describes holding the cup?', 3, 'ถือแก้วอยู่', 'theu gaeo yuu', 'ถือ describes the ongoing state of having the cup in your hand, not the action of picking it up.'],
    ['A guide stands at the meeting point with a sign in her hand so visitors can find her.', 3, 'ถือป้ายอยู่', 'theu bpaai yuu', 'ถือ fits holding a sign. The guide is staying at the meeting point, not taking anyone somewhere yet.'],
    ['You walk home with a shopping basket in your hand. Focus on how you carry it.', 3, 'ถือตะกร้ากลับบ้าน', 'theu dta-graa glap baan', 'ถือ means hold or carry in the hand. เอา or นำ could describe transport more generally, but would not specify this manner of carrying.'],
    ['You keep a flashlight in one hand while looking into a dark cupboard.', 3, 'ถือไฟฉายไว้ในมือ', 'theu fai chaai wai nai mue', 'ถือ emphasizes keeping the flashlight in your hand while you use it.'],
    ['You are waiting at a counter with your passport already in your hand.', 3, 'ถือหนังสือเดินทางอยู่', 'theu nang-sue doen thaang yuu', 'ถือ describes holding the passport while waiting. รับ would describe receiving it from someone.'],
    ['During a speech, you keep the microphone in your hand. Which verb describes holding it?', 3, 'ถือไมโครโฟนอยู่', 'theu mai-khroo-foon yuu', 'ถือ describes the continuing act of holding the microphone, rather than picking it up or accepting it.'],

    ['An official exam notice says, "Please bring your identification card." Choose the formal verb for bringing it.', 4, 'กรุณานำบัตรประชาชนมาด้วย', 'ga-ru-naa nam bat bpra-chaa-chon maa duai', 'นำ suits formal written instructions about bringing an object. เอา is common in everyday speech; the formal register is the clue here.'],
    ['A clinic sends a formal instruction to bring your medical documents to the appointment.', 4, 'กรุณานำเอกสารมาที่คลินิก', 'ga-ru-naa nam ek-ga-saan maa thii khli-nik', 'นำ is the formal choice for bringing documents to a destination. หยิบ would focus only on picking them up.'],
    ['An office notice formally asks visitors to take completed forms to the counter.', 4, 'กรุณานำแบบฟอร์มไปที่เคาน์เตอร์', 'ga-ru-naa nam baep fawm bpai thii khao-dtoe', 'นำ fits an official instruction to move documents to a destination. เอา could express this in a more conversational style.'],
    ['A library notice formally asks readers to bring returned books to the service desk.', 4, 'กรุณานำหนังสือมาที่จุดบริการ', 'ga-ru-naa nam nang-sue maa thii jut baw-ri-gaan', 'นำ is appropriate for the formal wording of a notice. ถือ would stress carrying the books in your hands.'],
    ['A school letter formally asks students to bring their own water bottles.', 4, 'กรุณานำขวดน้ำมาเอง', 'ga-ru-naa nam khuat naam maa eng', 'นำ is commonly used in written instructions about bringing things. เอา is also possible in casual conversation.'],
    ['At a security checkpoint, a formal instruction asks you to take your bag to the inspection point.', 4, 'กรุณานำกระเป๋าไปที่จุดตรวจ', 'ga-ru-naa nam gra-bpao bpai thii jut dtruat', 'นำ fits formal directions about moving an object to another place. It does not specify carrying the bag in your hand.'],
    ['A conference email formally asks participants to bring a laptop.', 4, 'กรุณานำคอมพิวเตอร์มาด้วย', 'ga-ru-naa nam khawm-phiu-dtoe maa duai', 'นำ is the best match for a formal written request to bring equipment. The distinction from เอา here is register.'],
    ['An official workplace instruction says to take used batteries to the collection point.', 4, 'กรุณานำถ่านเก่าไปที่จุดรับ', 'ga-ru-naa nam thaan gao bpai thii jut rap', 'นำ describes taking items to a destination in formal instructions. รับ in จุดรับ refers to the collection point, not your action of taking the batteries there.'],

    ['You leave home with your child and accompany them to school. Which verb emphasizes taking the child there?', 5, 'พาลูกไปโรงเรียน', 'phaa luuk bpai roong rian', 'พา describes accompanying a person to a destination. รับ would focus on collecting the child from a place.'],
    ['Your dog needs a checkup. You go with the dog to the vet.', 5, 'พาหมาไปหาหมอ', 'phaa maa bpai haa maw', 'พา is used for taking an animal somewhere with you. The focus is accompanying the dog, not holding it in your hand.'],
    ['A friend is visiting your town. You go with them to the market to show them around.', 5, 'พาเพื่อนไปตลาด', 'phaa phuean bpai dta-laat', 'พา means take or guide someone somewhere. You accompany your friend on the visit.'],
    ['Your grandmother has an appointment. You accompany her to the hospital.', 5, 'พายายไปโรงพยาบาล', 'phaa yaai bpai roong pha-yaa-baan', 'พา emphasizes going with a person to a destination. This is more than meeting her at a pickup point.'],
    ['You walk with a new coworker and show them the way to the meeting room.', 5, 'พาเพื่อนร่วมงานไปห้องประชุม', 'phaa phuean ruam ngaan bpai hawng bpra-chum', 'พา fits guiding or accompanying someone to a place. เอา is not the usual choice for accompanying a person.'],
    ['A parent goes with the children to the zoo for the day.', 5, 'พาเด็กไปสวนสัตว์', 'phaa dek bpai suan sat', 'พา describes taking people on an outing and accompanying them. It does not mean picking an object up.'],
    ['You leave home with your dog for its evening walk.', 5, 'พาหมาไปเดินเล่น', 'phaa maa bpai doen len', 'พา is natural for taking an animal out with you. ถือ would instead emphasize holding something in your hand.'],
    ['A hotel employee walks with a guest to the guest\'s room and shows the way.', 5, 'พาแขกไปที่ห้อง', 'phaa khaek bpai thii hawng', 'พา describes escorting someone to a destination. รับ would emphasize welcoming or collecting the guest, rather than accompanying them to the room.']
  ].map(([en, answerIndex, full, roman, note], index) => ({ en, answerIndex, full, roman, note, index }));

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
      if (saved && saved.version === QUIZ_VERSION && Array.isArray(saved.questions) && saved.questions.length === situations.length && saved.questions.every((question) => question && Number.isInteger(question.index) && question.index >= 0 && question.index < situations.length) && new Set(saved.questions.map((question) => question.index)).size === situations.length && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < situations.length && Number.isInteger(saved.score) && saved.score >= 0 && saved.score <= situations.length) {
        state.questions = saved.questions.map((question) => situations[question.index]);
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
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: QUIZ_VERSION, index: state.index, score: state.score, answered: state.done, completed: state.completed, questions: state.questions }));
    } catch (error) {
      // Continue the quiz if storage is unavailable.
    }
  }

  function buildQuestions() {
    const shuffled = shuffle(situations);
    state.questions = shuffled;
    state.index = 0;
    state.score = 0;
    state.done = false;
    state.completed = false;
  }

  function getOptions() {
    return shuffle(vocabulary.map((item, index) => ({ label: item.th, index })));
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

    prompt.textContent = 'Choose the Thai verb that best fits the situation.';
    questionNode.textContent = question.en;
    questionNode.className = 'take-question english';

    answerWrap.innerHTML = '';
    getOptions().forEach((option, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'take-answer';
      button.dataset.index = String(option.index);
      button.innerHTML = `<span class="letter">${'ABCDEF'[idx]}</span>${option.label}`;
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
    const correctIndex = question.answerIndex;
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
    const answer = vocabulary[correctIndex];
    feedbackThai.textContent = question.full;
    feedbackRoman.textContent = question.roman;
    feedbackMeaning.textContent = `${answer.th} (${answer.roman}) — ${answer.en}`;
    feedbackExplain.textContent = question.note;
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
    if (!loadProgress()) {
      buildQuestions();
      saveProgress();
    }
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
        english: question.en,
        thai: question.full,
        answer: vocabulary[question.answerIndex].th
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window[guideName + 'Guide'] = { renderQuestion, restart, selectAnswer };
})();
