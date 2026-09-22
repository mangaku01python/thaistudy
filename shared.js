(function () {
  const PROFILE_KEY = 'thaiStudyProfile';

  function safeParse(json) {
    try {
      return JSON.parse(json || 'null');
    } catch (error) {
      return null;
    }
  }

  function getProfile() {
    try {
      return safeParse(localStorage.getItem(PROFILE_KEY));
    } catch (error) {
      return null;
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function syncProfileText(target, fallbackText) {
    if (!target) return;
    const profile = getProfile();
    target.textContent = profile && profile.name ? `Hi, ${profile.name}` : fallbackText;
  }

  function bindProfileModal({
    profileNameNode,
    profileButton,
    profileCta,
    profileModal,
    studentNameInput,
    studentEmailInput,
    saveProfileButton,
    onSaved
  }) {
    if (!profileButton && !profileCta && !profileModal) return;

    function refreshProfileUI() {
      const profile = getProfile();
      if (profileNameNode) {
        profileNameNode.textContent = profile && profile.name ? `Hi, ${profile.name}` : '';
      }
      if (profileButton) {
        profileButton.hidden = !profile;
        profileButton.textContent = 'Edit Profile';
      }
      if (profileCta) {
        profileCta.hidden = !!profile;
      }
    }

    function openModal() {
      const profile = getProfile() || {};
      if (studentNameInput) studentNameInput.value = profile.name || '';
      if (studentEmailInput) studentEmailInput.value = profile.email || '';
      if (profileModal) profileModal.hidden = false;
    }

    if (profileButton) {
      profileButton.addEventListener('click', openModal);
    }

    if (profileCta) {
      profileCta.addEventListener('click', openModal);
    }

    if (saveProfileButton) {
      saveProfileButton.addEventListener('click', () => {
        const name = (studentNameInput ? studentNameInput.value : '').trim();
        if (!name && studentNameInput) {
          studentNameInput.focus();
          return;
        }

        const profile = {
          name,
          email: (studentEmailInput ? studentEmailInput.value : '').trim()
        };

        if (!saveProfile(profile)) return;
        if (profileModal) profileModal.hidden = true;
        refreshProfileUI();

        if (typeof onSaved === 'function') {
          onSaved(profile);
        }
      });
    }

    if (profileModal) {
      profileModal.addEventListener('click', (event) => {
        if (event.target === profileModal) {
          profileModal.hidden = true;
        }
      });
    }

    refreshProfileUI();
  }

  window.thaiStudyShared = {
    PROFILE_KEY,
    getProfile,
    saveProfile,
    clearProfile,
    syncProfileText,
    bindProfileModal
  };
})();
