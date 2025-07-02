const el = document.querySelector(".typeJsText");
const text = el.dataset.typetext;
const typingSpeed = 20; // ms per character

let index = 0;

function typeOnce() {
  el.innerHTML = text.substring(0, index + 1);
  index++;

  if (index < text.length) {
    setTimeout(typeOnce, typingSpeed);
  }
}

typeOnce();


// 
// Login Popup + Contact Popup Script
// 


$(document).ready(function () {
  let isLoggedIn = false;
  let currentForm = 'login'; // 'login' or 'signup'

  // Login form validation fields
  const loginFields = [
    {
      id: '#username',
      header: '#username-header',
      validate: v => v.trim().length >= 3,
      errorMsg: 'X Username must be at least 3 characters'
    },
    {
      id: '#password',
      header: '#password-header',
      validate: v => v.length >= 6,
      errorMsg: 'X Password must be at least 6 characters'
    }
  ];

  // Signup form validation fields
  const signupFields = [
    {
      id: '#fullname',
      header: '#fullname-header',
      validate: v => v.trim().length >= 2,
      errorMsg: 'X Full name must be at least 2 characters'
    },
    {
      id: '#email',
      header: '#email-header',
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      errorMsg: 'X Please enter a valid email address'
    },
    {
      id: '#signup-username',
      header: '#signup-username-header',
      validate: v => v.trim().length >= 3,
      errorMsg: 'X Username must be at least 3 characters'
    },
    {
      id: '#signup-password',
      header: '#signup-password-header',
      validate: v => v.length >= 6,
      errorMsg: 'X Password must be at least 6 characters'
    },
    {
      id: '#confirm-password',
      header: '#confirm-password-header',
      validate: v => v === $('#signup-password').val(),
      errorMsg: 'X Passwords do not match'
    }
  ];

  let loginValidationStarted = false;
  let signupValidationStarted = false;

  // Validation functions
  function validateField(f) {
    const val = $(f.id).val();
    const $header = $(f.header);
    $header.find('.error-field').remove();

    if (f.validate(val)) {
      $header.css('color', '#52efa6');
      return true;
    } else {
      $header.css('color', '#f43c33');
      $('<span>')
        .addClass('error-field')
        .text(f.errorMsg)
        .appendTo($header);
      return false;
    }
  }

  function validateLoginForm() {
    return loginFields.map(f => validateField(f)).every(v => v);
  }

  function validateSignupForm() {
    return signupFields.map(f => validateField(f)).every(v => v);
  }

  function resetLoginForm() {
    loginValidationStarted = false;
    loginFields.forEach(f => {
      $(f.header).css('color', '').find('.error-field').remove();
      $(f.id).val('');
    });
  }

  function resetSignupForm() {
    signupValidationStarted = false;
    signupFields.forEach(f => {
      $(f.header).css('color', '').find('.error-field').remove();
      $(f.id).val('');
    });
  }

  function resetAllForms() {
    resetLoginForm();
    resetSignupForm();
  }

  // Form switching functions
  function showLoginForm() {
    currentForm = 'login';
    $('#signup-body').hide();
    $('#login-body').fadeIn(300);
  }

  function showSignupForm() {
    currentForm = 'signup';
    $('#login-body').hide();
    $('#signup-body').fadeIn(300);
  }

  // Popup management
  function showAuthPopup() {
    $('#login-overlay').fadeIn();
    $('#login-overlay').css('display', 'flex');
    if (currentForm === 'login') {
      showLoginForm();
    } else {
      showSignupForm();
    }
  }

  function hideAuthPopup() {
    $('#login-overlay').fadeOut();
    resetAllForms();
    currentForm = 'login'; // Reset to login for next time
  }

  // Check if username/email already exists (simulate database check)
  function isUsernameTaken(username) {
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return existingUsers.some(user => user.username.toLowerCase() === username.toLowerCase());
  }

  function isEmailTaken(email) {
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // User management functions
  function registerUser(userData) {
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    existingUsers.push({
      fullname: userData.fullname,
      email: userData.email,
      username: userData.username,
      password: userData.password, // In real app, this would be hashed
      dateRegistered: new Date().toISOString()
    });
    localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
  }

  function authenticateUser(username, password) {
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return existingUsers.find(user =>
      user.username.toLowerCase() === username.toLowerCase() &&
      user.password === password
    );
  }

  function loginUser(username) {
    isLoggedIn = true;
    $('#authToggleBtn').text('Logout');
    $('#user-welc').text(`Welcome, ${username}`).show();
    localStorage.setItem('currentUser', username);
    hideAuthPopup();
  }

  // Event handlers
  $('#authToggleBtn').click(function () {
    if (!isLoggedIn) {
      showAuthPopup();
    } else {
      // Log out
      isLoggedIn = false;
      $('#authToggleBtn').text('Login');
      $('#user-welc').hide().text('');
      localStorage.removeItem('currentUser');
    }
  });

  $('#login-close, #signup-close').click(function () {
    hideAuthPopup();
  });

  $('#login-overlay').click(function (e) {
    if (e.target === this) {
      hideAuthPopup();
    }
  });

  // Form switching links
  $(document).on('click', 'a[href="#"]', function (e) {
    e.preventDefault();

    if ($(this).text().includes('Create New Account')) {
      showSignupForm();
    } else if ($(this).text().includes('Already have an account')) {
      showLoginForm();
    }
  });

  // Real-time validation setup
  loginFields.forEach(f => {
    $(f.id).on('input', () => {
      if (loginValidationStarted) validateField(f);
    });
  });

  signupFields.forEach(f => {
    $(f.id).on('input', () => {
      if (signupValidationStarted) validateField(f);
    });
  });

  // Login form submission
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    const valid = validateLoginForm();

    if (!loginValidationStarted) {
      loginValidationStarted = true;
    }

    if (!valid) return;

    const username = $('#username').val().trim();
    const password = $('#password').val();

    // Check if user exists first
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = existingUsers.find(user =>
      user.username.toLowerCase() === username.toLowerCase()
    );

    if (!userExists) {
      // Username not found
      $('#username-header').css('color', '#f43c33');
      $('#username-header').find('.error-field').remove();
      $('<span>')
        .addClass('error-field')
        .text('X Username not found')
        .appendTo('#username-header');
      return;
    }

    // User exists, now check password
    if (userExists.password !== password) {
      // Incorrect password
      $('#password-header').css('color', '#f43c33');
      $('#password-header').find('.error-field').remove();
      $('<span>')
        .addClass('error-field')
        .text('X Incorrect password')
        .appendTo('#password-header');
      return;
    }

    // Both username and password are correct
    loginUser(userExists.username);
  });

  // Signup form submission
  $('#signupForm').on('submit', function (e) {
    e.preventDefault();

    const valid = validateSignupForm();

    if (!signupValidationStarted) {
      signupValidationStarted = true;
    }

    if (!valid) return;

    const formData = {
      fullname: $('#fullname').val().trim(),
      email: $('#email').val().trim(),
      username: $('#signup-username').val().trim(),
      password: $('#signup-password').val()
    };

    // Check for existing users
    let hasError = false;

    if (isUsernameTaken(formData.username)) {
      $('#signup-username-header').css('color', '#f43c33');
      $('#signup-username-header').find('.error-field').remove();
      $('<span>')
        .addClass('error-field')
        .text('X Username is already taken')
        .appendTo('#signup-username-header');
      hasError = true;
    }

    if (isEmailTaken(formData.email)) {
      $('#email-header').css('color', '#f43c33');
      $('#email-header').find('.error-field').remove();
      $('<span>')
        .addClass('error-field')
        .text('X Email is already registered')
        .appendTo('#email-header');
      hasError = true;
    }

    if (hasError) return;

    // Register the user
    registerUser(formData);

    // Show success message and auto-login
    alert(`Welcome ${formData.fullname}! Your account has been created successfully.`);
    loginUser(formData.username);
  });

  // Restore login if user is remembered
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    isLoggedIn = true;
    $('#authToggleBtn').text('Logout');
    $('#user-welc').text(`Welcome, ${savedUser}`).show();
  }

  // Utility function to clear all stored data (for testing)
  window.clearAllUsers = function () {
    localStorage.removeItem('registeredUsers');
    localStorage.removeItem('currentUser');
    console.log('All user data cleared');
  };

  // Utility function to view all registered users (for testing)
  window.viewAllUsers = function () {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    console.log('Registered users:', users);
    return users;
  };
});


$(document).ready(function () {
  // ENHANCED FIELD CONFIGURATION
  const contactFields = [
    {
      selector: '#name1',
      header: '#name-header',
      validate: v => {
        const trimmed = v.trim();
        return trimmed.length >= 2 && /^[a-zA-Z\s'-]+$/.test(trimmed);
      },
      errorMsg: 'Please enter a valid name (2+ characters, letters only)',
      required: true
    },
    {
      selector: '#email1',
      header: '#email-header',
      validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      errorMsg: 'Please enter a valid email address',
      required: true
    },
    {
      selector: '#phone1',
      header: '#phone-header',
      validate: v => v.trim() === '' || /^[\d\s\-\(\)\.]+$/.test(v),
      errorMsg: 'Please enter a valid phone number',
      required: false
    },
    {
      selector: '#subject1',
      header: '#subject-header',
      validate: v => v.trim() !== '',
      errorMsg: 'Please select a subject',
      required: true
    },
    {
      selector: '#message1',
      header: '#message-header',
      validate: v => v.trim().length >= 10,
      errorMsg: 'Message must be at least 10 characters long',
      required: true
    }
  ];

  let contactValidationActive = false;
  let attachedFiles = [];


  // MESSAGE CHARACTER COUNTER
  function updateCharCounter() {
    const message = $('#message1').val();
    const counter = $('#message-counter');
    const current = message.length;
    const max = 1000;

    counter.text(`${current} / ${max} characters`);

    if (current > max * 0.9) {
      counter.addClass('danger').removeClass('warning');
    } else if (current > max * 0.75) {
      counter.addClass('warning').removeClass('danger');
    } else {
      counter.removeClass('warning danger');
    }
  }

  // FILE HANDLING
  function handleFiles(files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        showMessage(`File "${file.name}" is too large. Maximum size is 5MB.`, 'error');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        showMessage(`File "${file.name}" is not supported. Please use PDF, DOC, DOCX, JPG, or PNG.`, 'error');
        return;
      }

      attachedFiles.push(file);
      displayFileList();
    });
  }

  function displayFileList() {
    const fileList = $('#file-list');
    fileList.empty();

    attachedFiles.forEach((file, index) => {
      const fileItem = $(`
                        <div class="file-item">
                            <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                            <button type="button" class="file-remove" data-index="${index}">×</button>
                        </div>
                    `);
      fileList.append(fileItem);
    });
  }

  // SHOW/HIDE FUNCTIONS
  function showContact() {
    $('#contactoverlay').fadeIn().css('display', 'flex');
    contactValidationActive = false;
  }

  function hideContact() {
    $('#contactoverlay').fadeOut();
    setTimeout(() => {
      resetContactForm();
    }, 300);
  }

  // RESET FORM & ERRORS
  function resetContactForm() {
    contactValidationActive = false;
    attachedFiles = [];

    contactFields.forEach(f => {
      $(f.header).css('color', '').find('.error-field').remove();
      $(f.selector).val('');
    });

    $('#country-code').val('+1');
    $('#newsletter').prop('checked', false);
    $('#privacy').prop('checked', false);
    $('#form-messages').empty();
    $('#file-list').empty();
    updateCharCounter();
  }

  // VALIDATE A SINGLE FIELD
  function validateContactField(f) {
    const $input = $(f.selector);
    const $hdr = $(f.header);
    const value = $input.val();

    $hdr.find('.error-field').remove();

    if (!f.required && value.trim() === '') {
      $hdr.css('color', '');
      return true;
    }

    if (f.validate(value)) {
      $hdr.css('color', '#52efa6');
      return true;
    } else {
      $hdr.css('color', '#f43c33');
      $('<span>')
        .addClass('error-field')
        .text(f.errorMsg)
        .appendTo($hdr);
      return false;
    }
  }

  // VALIDATE ALL FIELDS
  function validateContactAll() {
    let isValid = true;

    contactFields.forEach(f => {
      if (!validateContactField(f)) {
        isValid = false;
      }
    });

    // Validate privacy checkbox
    if (!$('#privacy').is(':checked')) {
      showMessage('You must agree to the Privacy Policy to continue.', 'error');
      isValid = false;
    }

    return isValid;
  }

  // SHOW MESSAGES
  function showMessage(message, type = 'info') {
    const messageDiv = $(`
                    <div class="${type}-message">
                        ${message}
                    </div>
                `);

    $('#form-messages').empty().append(messageDiv);

    setTimeout(() => {
      messageDiv.fadeOut(() => messageDiv.remove());
    }, 5000);
  }

  // UPDATE SUBMIT BUTTON STATE
  function updateSubmitButton(isSubmitting = false) {
    const button = $('#contact-submit');

    if (isSubmitting) {
      button.prop('disabled', true).text('Sending...');
    } else {
      button.prop('disabled', false).text('Send Message');
    }
  }

  // SIMULATE FORM SUBMISSION WITH AUTO-REPLY
  function submitForm() {
    updateSubmitButton(true);

    const formData = {
      name: $('#name1').val(),
      email: $('#email1').val(),
      phone: $('#country-code').val() + ' ' + $('#phone1').val(),
      subject: $('#subject1').val(),
      message: $('#message1').val(),
      newsletter: $('#newsletter').is(':checked'),
      files: attachedFiles
    };

    // Simulate API call
    setTimeout(() => {
      updateSubmitButton(false);

      // Simulate success (90% chance) or error (10% chance)
      if (Math.random() > 0.1) {
        showMessage('Thank you! Your message has been sent successfully. You should receive a confirmation email shortly. We\'ll get back to you within 24-48 hours.', 'success');
        setTimeout(() => {
          hideContact();
        }, 3000);
      } else {
        showMessage('Sorry, there was an error sending your message. Please try again.', 'error');
      }
    }, 1500);
  }

  // EVENT LISTENERS

  // Form openers/closers
  $('#contactBtn').click(showContact);
  $('#contactoverlay').on('click', e => {
    if (e.target === e.currentTarget) hideContact();
  });
  window.contactclose = hideContact;

  // File handling events
  $('#file-select-btn').on('click', () => $('#file-input').click());
  $('#file-input').on('change', e => handleFiles(e.target.files));

  // File removal
  $(document).on('click', '.file-remove', function () {
    const index = $(this).data('index');
    attachedFiles.splice(index, 1);
    displayFileList();
  });

  // Live validation
  contactFields.forEach(f => {
    $(f.selector).on('input change', () => {
      if (contactValidationActive) {
        validateContactField(f);
      }
    });
  });

  // Message counter
  $('#message1').on('input', updateCharCounter);

  // Form submission
  $('#contact-form').on('submit', function (e) {
    e.preventDefault();

    contactValidationActive = true;

    if (!validateContactAll()) {
      showMessage('Please fix the errors above before submitting.', 'error');
      return;
    }

    submitForm();
  });

  // Initialize
  updateCharCounter();
});


// 
// Slide 2 Scripts
// 



const modules = [
  { element: document.getElementById('module1'), speed: 0.3, initialOffset: 500 },
  { element: document.getElementById('module2'), speed: 0.6, initialOffset: 700 },
  { element: document.getElementById('module3'), speed: 1.0, initialOffset: 900 }
];

// Set initial positions (off-screen to the right with opacity)
modules.forEach((module, index) => {
  module.element.style.transform = `translateX(${module.initialOffset}px)`;
  module.element.style.opacity = '0';
});

// Smooth scroll animation
function updateAnimation() {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;

  modules.forEach((module, index) => {
    const moduleElement = module.element;
    const moduleRect = moduleElement.getBoundingClientRect();
    const moduleTop = scrollY + moduleRect.top;

    // Calculate when module enters viewport
    const triggerPoint = moduleTop - windowHeight * 0.8;
    const moduleProgress = Math.max(0, Math.min(1, (scrollY - triggerPoint) / (windowHeight * 0.6)));

    // Fast fade in for each module individually
    const opacity = Math.min(moduleProgress * 3, 1);

    // Fast slide with exponential easing
    const easedProgress = moduleProgress < 0.5
      ? 2 * moduleProgress * moduleProgress
      : 1 - Math.pow(-2 * moduleProgress + 2, 2) / 2;
    const slideDistance = module.initialOffset * (1 - easedProgress);

    // Apply transforms and opacity
    if (moduleProgress >= 0.8) {
      moduleElement.style.transform = 'translateX(0px)';
      moduleElement.style.opacity = '1';
      moduleElement.classList.add('aligned');
    } else {
      moduleElement.style.transform = `translateX(${slideDistance}px)`;
      moduleElement.style.opacity = opacity;
      moduleElement.classList.remove('aligned');
    }
  });
}

// Throttled scroll event for better performance
let ticking = false;
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateAnimation();
      ticking = false;
    });
    ticking = true;
  }
}

// Event listeners
window.addEventListener('scroll', onScroll);
window.addEventListener('resize', updateAnimation);

// Initial animation state
updateAnimation();


// 
// Tool Carousal Script
// 


class Carousel {
  constructor() {
    this.container = document.getElementById('carouselContainer');
    this.track = document.getElementById('carouselTrack');
    this.cards = document.querySelectorAll('.tool-card');
    this.toolsSection = document.querySelector('.tools-section');
    this.currentOffset = 0;
    this.containerWidth = 0;
    this.trackWidth = 0;
    this.maxOffset = 0;
    this.autoScrollDirection = 1; // 1 for right, -1 for left
    this.isAtEnd = false;
    this.isAtBeginning = true;
    this.isInViewport = false;

    this.init();
    this.calculateDimensions();
    this.checkViewportPosition();
    this.startAutoScroll();
  }

  init() {
    // Wheel event for manual scrolling
    this.container.addEventListener('wheel', (e) => {
      const shouldPreventDefault = this.handleWheelScroll(e.deltaY);
      if (shouldPreventDefault) {
        e.preventDefault();
      }
    });

    // Touch events for mobile
    let startX = 0;
    let startOffset = 0;

    this.container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startOffset = this.currentOffset;
      this.stopAutoScroll();
    });

    this.container.addEventListener('touchmove', (e) => {
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      const newOffset = startOffset + diff;

      // Only prevent default if we're within carousel bounds and in viewport
      if (this.isInViewport && newOffset >= 0 && newOffset <= this.maxOffset) {
        e.preventDefault();
        this.setOffset(newOffset);
      }
    });

    this.container.addEventListener('touchend', () => {
      this.startAutoScroll();
    });

    // Pause auto-scroll on hover
    this.container.addEventListener('mouseenter', () => this.stopAutoScroll());
    this.container.addEventListener('mouseleave', () => this.startAutoScroll());

    // Recalculate on window resize
    window.addEventListener('resize', () => {
      this.calculateDimensions();
    });

    // Track scroll position to determine when to activate carousel
    window.addEventListener('scroll', () => {
      this.checkViewportPosition();
    });
  }

  calculateDimensions() {
    this.containerWidth = this.container.offsetWidth;
    this.trackWidth = this.cards.length * this.containerWidth;
    this.maxOffset = this.trackWidth - this.containerWidth;
    this.updateBoundaryStates();
    this.checkViewportPosition();
  }

  checkViewportPosition() {
    const rect = this.toolsSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const sectionCenter = rect.top + (rect.height / 2);
    const viewportCenter = viewportHeight / 2;

    // Check if the center of the tools section is at or past the center of the viewport
    this.isInViewport = sectionCenter <= viewportCenter;

    // Start or stop auto-scroll based on viewport position
    if (this.isInViewport && !this.autoScrollInterval) {
      this.startAutoScroll();
    } else if (!this.isInViewport && this.autoScrollInterval) {
      this.stopAutoScroll();
    }
  }

  handleWheelScroll(delta) {
    // Only handle carousel scrolling if the tools section is in the middle of viewport
    if (!this.isInViewport) {
      return false; // Allow normal page scrolling
    }

    const scrollAmount = delta * 2; // Adjust sensitivity
    const newOffset = this.currentOffset + scrollAmount;

    // Check if we're trying to scroll beyond boundaries
    if (delta > 0) { // Scrolling right/down
      if (this.currentOffset >= this.maxOffset) {
        // At the end, allow page scrolling
        return false; // Don't prevent default
      }
    } else { // Scrolling left/up
      if (this.currentOffset <= 0) {
        // At the beginning, allow page scrolling
        return false; // Don't prevent default
      }
    }

    // Within carousel bounds, handle internally
    this.stopAutoScroll();
    this.setOffset(newOffset);

    // Restart auto-scroll after a delay
    clearTimeout(this.autoScrollTimeout);
    this.autoScrollTimeout = setTimeout(() => {
      this.startAutoScroll();
    }, 2000);

    return true; // Prevent default
  }

  setOffset(newOffset) {
    // Clamp to boundaries instead of wrapping
    this.currentOffset = Math.max(0, Math.min(this.maxOffset, newOffset));
    this.updatePosition();
    this.updateBoundaryStates();
  }

  updateBoundaryStates() {
    this.isAtBeginning = this.currentOffset <= 0;
    this.isAtEnd = this.currentOffset >= this.maxOffset;
  }

  updatePosition() {
    this.track.style.transform = `translateX(-${this.currentOffset}px)`;
  }

  startAutoScroll() {
    if (this.autoScrollInterval) return;

    this.autoScrollInterval = setInterval(() => {
      const scrollSpeed = 1; // pixels per frame

      if (this.autoScrollDirection === 1) {
        // Scrolling right
        if (this.currentOffset >= this.maxOffset) {
          // Stop at the end instead of looping
          this.stopAutoScroll();
          return;
        }
        this.currentOffset += scrollSpeed;
      } else {
        // Scrolling left
        if (this.currentOffset <= 0) {
          // Stop at the beginning instead of looping
          this.stopAutoScroll();
          return;
        }
        this.currentOffset -= scrollSpeed;
      }

      this.updatePosition();
      this.updateBoundaryStates();
    }, 16); // ~60fps
  }

  stopAutoScroll() {
    clearInterval(this.autoScrollInterval);
    this.autoScrollInterval = null;
  }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Carousel();
});


// Author Section


let authorCurrentCard = 0;
const authorTotalCards = 2;

function authorUpdateCarousel() {
  const cards = document.querySelectorAll('.author-card');
  const indicators = document.querySelectorAll('.author-indicator');

  cards.forEach((card, index) => {
    card.classList.remove('author-active', 'author-prev');
    if (index === authorCurrentCard) {
      card.classList.add('author-active');
    } else if (index < authorCurrentCard) {
      card.classList.add('author-prev');
    }
  });

  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('author-active', index === authorCurrentCard);
  });
}

function authorChangeCard(direction) {
  authorCurrentCard += direction;

  if (authorCurrentCard >= authorTotalCards) {
    authorCurrentCard = 0;
  } else if (authorCurrentCard < 0) {
    authorCurrentCard = authorTotalCards - 1;
  }

  authorUpdateCarousel();
}

function authorGoToCard(index) {
  authorCurrentCard = index;
  authorUpdateCarousel();
}

// Auto-advance carousel every 5 seconds
const authorCarouselInterval = setInterval(() => {
  authorChangeCard(1);
}, 5000);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.target.closest('.author-carousel-container')) {
    if (e.key === 'ArrowLeft') {
      authorChangeCard(-1);
    } else if (e.key === 'ArrowRight') {
      authorChangeCard(1);
    }
  }
});



// Demo Section


function playDemo() {
  const button = document.querySelector('.demo-play-button');
  const placeholder = document.querySelector('.demo-video-placeholder');

  // Add click effect
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1.1)';
  }, 150);

  // Simulate video loading
  setTimeout(() => {
    placeholder.innerHTML = '<div style="width: 100%; height: 100%; background: linear-gradient(45deg, #F43C33, #d63027); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">Demo Video Playing...</div>';
  }, 300);

  console.log('Demo video would start playing here');
}

function tryNow() {
  const button = document.querySelector('.demo-cta-button');
  button.style.transform = 'translateY(-3px) scale(0.98)';
  setTimeout(() => {
    button.style.transform = 'translateY(-3px) scale(1)';
  }, 150);

  console.log('Redirecting to demo/trial page');
}

// Add scroll-triggered animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.demo-video-container, .demo-content-container');
  animatedElements.forEach(el => observer.observe(el));
});