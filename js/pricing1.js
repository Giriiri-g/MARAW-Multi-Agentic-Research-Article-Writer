
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
  let isSignupMode = false;

  $('.form-footer a:first').click(function (e) {
  e.preventDefault();
  isSignupMode = true;
  $('.login-title').text('Signup');
  $('.login-submit').text('Signup');
});



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

  let validationStarted = false;

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

  function validateAll() {
    return loginFields.map(f => validateField(f)).every(v => v);
  }

  function resetForm() {
  validationStarted = false;
  isSignupMode = false;
  loginFields.forEach(f => {
    $(f.header).css('color', '').find('.error-field').remove();
    $(f.id).val('');
  });

  // Revert button and title text
  $('.login-title').text('Login');
  $('.login-submit').text('Login');
}


  function showLoginPopup() {
    $('#login-overlay').fadeIn();
    $('#login-overlay').css('display', 'flex');
  }

  function hideLoginPopup() {
    $('#login-overlay').fadeOut();
    resetForm();
  }

  $('#authToggleBtn').click(function () {
    if (!isLoggedIn) {
      showLoginPopup();
    } else {
      // Log out
      isLoggedIn = false;
      $('#authToggleBtn').text('Login');
      $('#user-welc').hide().text('');
      localStorage.removeItem('username');
    }
  });

  $('#login-close').click(function () {
    hideLoginPopup();
  });

  $('#login-overlay').click(function (e) {
    if (e.target === this) {
      hideLoginPopup();
    }
  });

  loginFields.forEach(f => {
    $(f.id).on('input', () => {
      if (validationStarted) validateField(f);
    });
  });

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    const valid = validateAll();

    if (!validationStarted) {
      validationStarted = true;
    }

    if (!valid) return;

    // Successful login
    const username = $('#username').val().trim();
    isLoggedIn = true;
    $('#authToggleBtn').text('Logout');
    $('#user-welc').text(`Welcome, ${username}`).show();
    localStorage.setItem('username', username);
    hideLoginPopup();
  });


  // Restore login if user is remembered
  const savedUser = localStorage.getItem('username');
  if (savedUser) {
    isLoggedIn = true;
    $('#authToggleBtn').text('Logout');
    $('#user-welc').text(`Welcome, ${savedUser}`).show();
  }
});



$(document).ready(function () {
  // FIELD CONFIGURATION
  const contactFields = [
    {
      selector: '#name1',
      header: '#name-header',
      validate: v => v.trim() !== '',
      errorMsg: 'Name cannot be empty'
    },
    {
      selector: '#email1',
      header: '#email-header',
      validate: v => /^\S+@\S+\.\S+$/.test(v),
      errorMsg: 'Please enter a valid email'
    },
    {
      selector: '#message1',
      header: '#message-header',
      validate: v => v.trim() !== '',
      errorMsg: 'Message cannot be empty'
    }
  ];

  let contactValidationActive = false;

  // SHOW / HIDE FUNCTIONS
  function showContact() {
    $('#contactoverlay').fadeIn()
    $('#contactoverlay').css('display', 'flex');
    contactValidationActive = false;
  }
  function hideContact() {
    $('#contactoverlay').fadeOut()
    $('#contactoverlay').hide();
    resetContactForm();
  }

  // RESET FORM & ERRORS
  function resetContactForm() {
    contactValidationActive = false;
    contactFields.forEach(f => {
      $(f.header).css('color', '').find('.error-field').remove();
      $(f.selector).val('');
    });
  }

  // VALIDATE A SINGLE FIELD
  function validateContactField(f) {
    const $input = $(f.selector);
    const $hdr = $(f.header);
    $hdr.find('.error-field').remove();

    if (f.validate($input.val())) {
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

  // VALIDATE ALL
  function validateContactAll() {
    return contactFields.map(f => validateContactField(f)).every(ok => ok);
  }

  // OPENERS/CLOSERS
  $('#contactBtn').click(showContact);
  $('#contactoverlay').on('click', e => {
    if (e.target === e.currentTarget) hideContact();
  });
  $('#contactoverlay').find('button[onclick="contactclose()"]').click(hideContact);

  // LIVE VALIDATION
  contactFields.forEach(f => {
    $(f.selector).on('input', () => {
      if (contactValidationActive) validateContactField(f);
    });
  });

  // FORM SUBMIT
  $('#contactoverlay form').on('submit', function (e) {
    e.preventDefault();

    contactValidationActive = true;
    if (!validateContactAll()) return;

    hideContact();
  });
});