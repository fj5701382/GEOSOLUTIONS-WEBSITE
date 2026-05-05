/* ============================================================
   dashboard.js
   Profile picture upload and management functionality
   ============================================================ */

(function () {
  "use strict";

  /* ── Profile Picture Manager ── */
  const ProfilePictureManager = {
    /* Storage key for profile image */
    STORAGE_KEY: "geoProfileImage",

    /* Initialize profile picture functionality */
    init: function () {
      this.setupChangePhotoButton();
      this.setupFileInput();
      this.loadProfileImage();
    },

    /* Setup change photo button click handler */
    setupChangePhotoButton: function () {
      const changePhotoBtn = document.getElementById("changePhotoBtn");
      if (!changePhotoBtn) return;

      changePhotoBtn.addEventListener("click", () => {
        const fileInput = document.getElementById("imageUpload");
        if (fileInput) fileInput.click();
      });
    },

    /* Setup file input change handler */
    setupFileInput: function () {
      const fileInput = document.getElementById("imageUpload");
      if (!fileInput) return;

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        /* Validate file type */
        if (!file.type.startsWith("image/")) {
          this.showToast("Please select a valid image file.", true);
          return;
        }

        /* Validate file size (5MB max) */
        if (file.size > 5 * 1024 * 1024) {
          this.showToast("Image file size must be less than 5MB.", true);
          return;
        }

        /* Read and save image */
        this.readAndSaveImage(file);

        /* Reset file input */
        fileInput.value = "";
      });
    },

    /* Read image file and convert to Base64 */
    readAndSaveImage: function (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const base64String = e.target.result;

        /* Save to localStorage */
        try {
          localStorage.setItem(this.STORAGE_KEY, base64String);

          /* Update profile image display */
          this.updateProfileImage(base64String);

          /* Update localStorage user data to reflect new image */
          try {
            const userStr = localStorage.getItem("geoCurrentUser");
            if (userStr) {
              const user = JSON.parse(userStr);
              user.profileImage = base64String;
              localStorage.setItem("geoCurrentUser", JSON.stringify(user));
            }
          } catch (err) {
            console.warn("Could not update user object with new image:", err);
          }

          this.showToast("✓ Profile picture updated successfully!");
        } catch (err) {
          console.warn("Could not save image to localStorage:", err);
          this.showToast("Could not save image. Storage may be full.", true);
        }
      };

      reader.onerror = () => {
        this.showToast("Error reading image file.", true);
      };

      reader.readAsDataURL(file);
    },

    /* Load profile image from localStorage */
    loadProfileImage: function () {
      try {
        const savedImage = localStorage.getItem(this.STORAGE_KEY);
        if (savedImage) {
          this.updateProfileImage(savedImage);
        }
      } catch (err) {
        console.warn("Could not load profile image from localStorage:", err);
      }
    },

    /* Update profile image display */
    updateProfileImage: function (imageDataUrl) {
      const profileImage = document.getElementById("profileImage");
      const profileAvatarLarge = document.querySelector(".profile-avatar-large");

      if (profileImage) {
        profileImage.src = imageDataUrl;
      }

      /* If using profile-avatar-large (initials), replace with image */
      if (profileAvatarLarge && profileAvatarLarge.parentElement) {
        const wrapper = profileAvatarLarge.parentElement;

        /* Create or update image element */
        let img = wrapper.querySelector("img.profile-image");
        if (!img) {
          img = document.createElement("img");
          img.className = "profile-image";
          img.alt = "Profile Picture";
          wrapper.innerHTML = "";
          wrapper.appendChild(img);
        }
        img.src = imageDataUrl;
      }
    },

    /* Show toast notification */
    showToast: function (message, isError = false) {
      let toast = document.getElementById("profileToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "profileToast";
        toast.className = "profile-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.toggle("error", isError);
      toast.classList.add("show");

      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => toast.classList.remove("show"), 3000);
    },
  };

  /* ── Profile Edit Integration ── */
  const ProfileEditIntegration = {
    previousImage: null,

    /* Store current image before entering edit mode */
    captureCurrentImage: function () {
      const profileImage = document.getElementById("profileImage");
      if (profileImage && profileImage.src) {
        this.previousImage = profileImage.src;
      } else {
        const avatarLarge = document.querySelector(".profile-avatar-large");
        if (avatarLarge && avatarLarge.parentElement) {
          const img = avatarLarge.parentElement.querySelector("img");
          if (img) {
            this.previousImage = img.src;
          }
        }
      }
    },

    /* Restore previous image on cancel */
    restoreImage: function () {
      if (this.previousImage) {
        ProfilePictureManager.updateProfileImage(this.previousImage);
      }
    },
  };

  /* ── Initialize on DOM ready ── */
  function initDashboard() {
    /* Initialize profile picture manager */
    ProfilePictureManager.init();

    /* Hook into profile edit functions if they exist */
    const card = document.getElementById("profileCard");
    if (card) {
      /* Observe edit mode changes */
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            if (
              card.classList.contains("profile-editing") &&
              !ProfileEditIntegration._capturedImage
            ) {
              /* Entering edit mode */
              ProfileEditIntegration.captureCurrentImage();
              ProfileEditIntegration._capturedImage = true;
            } else if (!card.classList.contains("profile-editing")) {
              /* Exiting edit mode */
              ProfileEditIntegration._capturedImage = false;
            }
          }
        });
      });

      observer.observe(card, { attributes: true });
    }
  }

  /* Wait for DOM to be ready */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }

  /* Expose to global scope */
  window.ProfilePictureManager = ProfilePictureManager;
  window.ProfileEditIntegration = ProfileEditIntegration;
})();
