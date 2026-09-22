document.addEventListener('DOMContentLoaded', () => {
  const profileNameNode = document.getElementById('profileName');
  const profileButton = document.getElementById('profileButton');
  const profileCta = document.getElementById('profileCta');
  const profileModal = document.getElementById('profileModal');
  const studentNameInput = document.getElementById('studentName');
  const studentEmailInput = document.getElementById('studentEmail');
  const saveProfileButton = document.getElementById('saveProfile');

  if (window.thaiStudyShared && window.thaiStudyShared.bindProfileModal) {
    window.thaiStudyShared.bindProfileModal({
      profileNameNode,
      profileButton,
      profileCta,
      profileModal,
      studentNameInput,
      studentEmailInput,
      saveProfileButton
    });
  }
});
