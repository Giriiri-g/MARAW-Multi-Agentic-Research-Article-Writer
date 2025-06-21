const el = document.querySelector(".typeJsText");
const text = el.dataset.typetext;
const typingSpeed = 20;      // ms per character when typing
const deletingSpeed = 10;    // ms per character when deleting
const pauseDuration = 1000;  // ms to wait after full text is typed

let index = 0;
let isDeleting = false;

function typeLoop() {
  if (!isDeleting) {
    // add next character
    el.innerHTML = text.substring(0, index + 1);
    index++;

    if (index === text.length) {
      // pause at full text, then start deleting
      return setTimeout(() => {
        isDeleting = true;
        typeLoop();
      }, pauseDuration);
    }
  } else {
    // remove one character
    el.innerHTML = text.substring(0, index - 1);
    index--;

    if (index === 0) {
      // once fully deleted, switch back to typing
      isDeleting = false;
    }
  }

  // schedule next tick
  setTimeout(
    typeLoop,
    isDeleting ? deletingSpeed : typingSpeed
  );
}

// kick it off
typeLoop();

function isInViewport(el) {
  const top = $(el).offset().top;
  const bottom = top + $(el).outerHeight();
  const scrollTop = $(window).scrollTop();
  const viewportHeight = $(window).height();

  return bottom > scrollTop && top < scrollTop + viewportHeight;
}

function animateOnScroll() {
  $('.animated-box').each(function () {
    if (isInViewport(this)) {
      $(this).addClass('visible');
    }
  });
}

$(document).ready(function () {
  animateOnScroll(); // Trigger on load
  $(window).on('scroll resize', animateOnScroll);
});



$(document).ready(function () {
  let isLoggedIn = false;

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
    loginFields.forEach(f => {
      $(f.header).css('color', '').find('.error-field').remove();
      $(f.id).val('');
    });
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


$(document).ready(function() {
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
    const $hdr   = $(f.header);
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
  $('#contactoverlay form').on('submit', function(e) {
    e.preventDefault();

    contactValidationActive = true;
    if (!validateContactAll()) return;

    hideContact();
  });
});


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