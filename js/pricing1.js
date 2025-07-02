
// Add smooth scrolling and interactive effects
document.querySelectorAll('.pricing-plan-button').forEach(button => {
  button.addEventListener('click', function (e) {
    e.preventDefault();

    // Add click animation
    this.style.transform = 'translateY(-2px) scale(0.98)';
    setTimeout(() => {
      this.style.transform = 'translateY(-2px) scale(1)';
    }, 150);

    // Log action (replace with actual functionality)
    console.log('Plan selected:', this.textContent);
  });
});

// Add hover effects for cards
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mouseenter', function () {
    this.style.transform = 'translateY(-8px)';
  });

  card.addEventListener('mouseleave', function () {
    this.style.transform = 'translateY(0)';
  });
});

// Mobile menu toggle (if needed)
const navbar = document.querySelector('.pricing-navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  if (window.scrollY > lastScrollY) {
    navbar.style.transform = 'translateY(-100%)';
  } else {
    navbar.style.transform = 'translateY(0)';
  }
  lastScrollY = window.scrollY;
});


// 
// Login Popup + Contact Popup Scripts
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
  $('#contactfooter').click(showContact);
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