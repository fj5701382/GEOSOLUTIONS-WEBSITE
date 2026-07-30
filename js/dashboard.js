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

  /* ── Payment & Countdown Manager ── */
  const PaymentManager = {
    STORAGE_KEY: "geoNextPaymentDate",

    init: function () {
      this.setupModal();
      this.updateTimer();
      // Update timer every minute to avoid too many DOM updates (or every second if you prefer)
      setInterval(() => this.updateTimer(), 60000);
    },

    setupModal: function () {
      const makePaymentBtn = document.getElementById("makePaymentBtn");
      const modalOverlay = document.getElementById("paymentModalOverlay");
      const closeModalBtn = document.getElementById("closePaymentModal");
      const paymentForm = document.getElementById("paystackPaymentForm");
      
      const receiptModalOverlay = document.getElementById("receiptModalOverlay");
      const closeReceiptModal = document.getElementById("closeReceiptModal");
      const printReceiptBtn = document.getElementById("printReceiptBtn");

      if (makePaymentBtn && modalOverlay) {
        makePaymentBtn.addEventListener("click", () => {
          modalOverlay.classList.add("active");
          
          // Auto-fill email if user is logged in
          const emailInput = document.getElementById("payEmail");
          if (emailInput && typeof GeoAuth !== "undefined") {
            const user = GeoAuth.getCurrentUser();
            if (user && user.email) {
              emailInput.value = user.email;
            }
          }
        });
      }

      if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener("click", () => {
          modalOverlay.classList.remove("active");
        });
      }

      if (paymentForm) {
        paymentForm.addEventListener("submit", (e) => {
          e.preventDefault();
          this.processPaymentWithPaystack();
        });
      }
      
      // Receipt Modal Setup
      if (closeReceiptModal && receiptModalOverlay) {
        closeReceiptModal.addEventListener("click", () => {
          receiptModalOverlay.classList.remove("active");
        });
      }
      
      if (printReceiptBtn) {
        printReceiptBtn.addEventListener("click", () => {
          window.print();
        });
      }
    },

    processPaymentWithPaystack: function () {
      const emailInput = document.getElementById("payEmail");
      const email = emailInput ? emailInput.value : "student@geoacademy.edu";
      const amount = 15000; // 15,000 NGN
      
      const submitBtn = document.getElementById("confirmPaymentBtn");
      const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
      const btnLoader = submitBtn ? submitBtn.querySelector(".btn-loader") : null;
      
      // Show loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = "none";
      if (btnLoader) btnLoader.style.display = "inline-block";

      const handler = PaystackPop.setup({
        key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your public key
        email: email,
        amount: amount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        ref: 'GEO_' + Math.floor((Math.random() * 1000000000) + 1),
        callback: (response) => {
          // Reset button state
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.style.display = "inline-block";
          if (btnLoader) btnLoader.style.display = "none";
          
          // Close payment modal
          const modalOverlay = document.getElementById("paymentModalOverlay");
          if (modalOverlay) modalOverlay.classList.remove("active");
          
          // Verify on backend
          this.verifyPaymentOnBackend(response.reference, email, amount);
        },
        onClose: () => {
          // Reset button state
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.style.display = "inline-block";
          if (btnLoader) btnLoader.style.display = "none";
          
          if (window.ProfilePictureManager) {
            window.ProfilePictureManager.showToast("Payment window closed.", true);
          }
        }
      });
      
      handler.openIframe();
    },
    
    verifyPaymentOnBackend: function(reference, email, amount) {
      // In a real scenario, you would make a fetch() call to the PHP backend
      // fetch(\`/php/api/verify_payment.php?reference=\${reference}\`)
      // For this demo, we simulate a successful backend verification
      
      setTimeout(() => {
        // Calculate 30 days from now
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 30);
        
        // Save to localStorage
        localStorage.setItem(this.STORAGE_KEY, newDate.getTime().toString());
        
        // Save receipt to history
        this.savePaymentHistory(reference, email, amount);
        
        // Show success toast
        if (window.ProfilePictureManager) {
          window.ProfilePictureManager.showToast("Payment successful! Access renewed for 30 days.");
        }
        
        // Immediately update the timer UI
        this.updateTimer();
        
        // Show receipt
        this.showReceipt(reference, amount);
      }, 500);
    },
    
    savePaymentHistory: function(reference, email, amount) {
      try {
        const history = JSON.parse(localStorage.getItem("geoPaymentHistory") || "[]");
        history.unshift({
          reference,
          email,
          amount,
          date: new Date().toISOString(),
          status: "success"
        });
        localStorage.setItem("geoPaymentHistory", JSON.stringify(history));
      } catch(e) {
        console.warn("Could not save payment history");
      }
    },
    
    showReceipt: function(reference, amount) {
      const user = typeof GeoAuth !== "undefined" ? GeoAuth.getCurrentUser() : null;
      
      const receiptModal = document.getElementById("receiptModalOverlay");
      if (receiptModal) {
        document.getElementById("receiptRef").textContent = reference;
        document.getElementById("receiptDate").textContent = new Date().toLocaleString();
        document.getElementById("receiptName").textContent = user ? user.fullName : "Student Name";
        document.getElementById("receiptReg").textContent = user ? user.identifier : "GEO/XXXX/XXX";
        
        receiptModal.classList.add("active");
      }
    },

    updateTimer: function () {
      const timerText = document.getElementById("paymentTimerText");
      const btn = document.getElementById("paymentCountdownBtn");
      const pulseIcon = btn ? btn.querySelector(".payment-icon-pulse") : null;
      
      if (!timerText || !btn) return;

      const nextDateStr = localStorage.getItem(this.STORAGE_KEY);
      if (!nextDateStr) {
        timerText.textContent = "Pending";
        btn.classList.remove("payment-due");
        if (pulseIcon) pulseIcon.classList.remove("due");
        return;
      }

      const nextDate = parseInt(nextDateStr, 10);
      const now = new Date().getTime();
      const diff = nextDate - now;

      if (diff <= 0) {
        // Expired
        timerText.textContent = "Payment Due";
        btn.classList.add("payment-due");
        if (pulseIcon) pulseIcon.classList.add("due");
      } else {
        // Active
        btn.classList.remove("payment-due");
        if (pulseIcon) pulseIcon.classList.remove("due");

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        timerText.textContent = `${days}d ${hours}h ${minutes}m`;
      }
    }
  };

  /* ── Teacher Payment Manager ── */
  const TeacherPaymentManager = {
    STORAGE_KEY: "teacherPaymentData",

    init: function () {
      this.setupModal();
      this.setupForm();
    },

    setupModal: function () {
      const paymentBtnNav = document.getElementById("paymentBtnNav");
      const modalOverlay = document.getElementById("paymentModalOverlay");
      const closeModalBtn = document.getElementById("closePaymentModal");

      if (paymentBtnNav && modalOverlay) {
        paymentBtnNav.addEventListener("click", () => {
          modalOverlay.classList.add("active");
          
          /* Update active state in sidebar */
          document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
          paymentBtnNav.classList.add("active");
          
          /* Close sidebar on mobile */
          if (window.innerWidth <= 768) {
            const sidebar = document.querySelector(".sidebar");
            const overlay = document.getElementById("sidebarOverlay");
            if (sidebar) sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("active");
          }
        });
      }

      if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener("click", () => {
          modalOverlay.classList.remove("active");
        });
      }
    },

    setupForm: function () {
      const form = document.getElementById("paymentForm");
      if (!form) return;

      const accountInput = document.getElementById("payAccountNumber");
      
      /* Real-time account number validation */
      if (accountInput) {
        accountInput.addEventListener("input", function(e) {
          /* Remove non-digits */
          this.value = this.value.replace(/\D/g, '');
        });
      }

      const cancelBtn = document.getElementById("cancelPaymentBtn");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          form.reset();
          const modalOverlay = document.getElementById("paymentModalOverlay");
          if (modalOverlay) modalOverlay.classList.remove("active");
        });
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById("submitPaymentBtn");
        const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
        const btnLoader = submitBtn ? submitBtn.querySelector(".btn-loader") : null;

        const fullName = document.getElementById("payFullName").value.trim();
        const bankName = document.getElementById("payBankName").value;
        const accountNumber = document.getElementById("payAccountNumber").value.trim();
        const amount = document.getElementById("payAmount").value;
        const notes = document.getElementById("payNotes").value.trim();

        /* Validation: Account number exactly 10 digits */
        if (accountNumber.length !== 10) {
          if (window.ProfilePictureManager) {
            window.ProfilePictureManager.showToast("Account number must be exactly 10 digits.", true);
          }
          return;
        }

        /* Show loading state */
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.style.display = "none";
        if (btnLoader) btnLoader.style.display = "inline-flex";

        /* Simulate network request */
        setTimeout(() => {
          /* Save data to localStorage */
          const paymentData = {
            fullName,
            bankName,
            accountNumber,
            amount,
            notes,
            timestamp: new Date().toISOString()
          };
          
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(paymentData));
          } catch (err) {
            console.warn("Could not save payment data", err);
          }

          /* Show success notification & Confirmation Message */
          if (window.ProfilePictureManager) {
            window.ProfilePictureManager.showToast("✓ Payment details submitted successfully!");
          }

          /* Clear the form */
          form.reset();

          /* Reset button state */
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.style.display = "inline-block";
          if (btnLoader) btnLoader.style.display = "none";

          /* Close modal */
          const modalOverlay = document.getElementById("paymentModalOverlay");
          if (modalOverlay) {
            modalOverlay.classList.remove("active");
          }
          
          /* Switch back to overview in sidebar */
          const overviewBtn = document.querySelector('[data-target="overviewSection"]');
          if (overviewBtn) overviewBtn.click();
        }, 1500);
      });
    }
  };

  /* ── Initialize on DOM ready ── */
  function initDashboard() {
    /* Initialize profile picture manager */
    ProfilePictureManager.init();
    
    /* Initialize Payment Manager */
    PaymentManager.init();

    /* Initialize Teacher Payment Manager */
    TeacherPaymentManager.init();

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
  window.PaymentManager = PaymentManager;
  window.TeacherPaymentManager = TeacherPaymentManager;
})();
