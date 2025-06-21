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


// Tool Carousal Script

class Carousel {
  constructor() {
    this.container = document.getElementById('carouselContainer');
    this.track = document.getElementById('carouselTrack');
    this.cards = document.querySelectorAll('.tool-card');
    this.currentOffset = 0;
    this.containerWidth = 0;
    this.trackWidth = 0;
    this.maxOffset = 0;
    this.isScrolling = false;
    this.autoScrollDirection = 1; // 1 for right, -1 for left

    this.init();
    this.calculateDimensions();
    this.startAutoScroll();
  }

  init() {
    // Wheel event for manual scrolling
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.handleWheelScroll(e.deltaY);
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
      e.preventDefault();
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      this.setOffset(startOffset + diff);
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
  }

  calculateDimensions() {
    this.containerWidth = this.container.offsetWidth;
    this.trackWidth = this.cards.length * this.containerWidth;
    this.maxOffset = this.trackWidth - this.containerWidth;
  }

  handleWheelScroll(delta) {
    this.stopAutoScroll();
    const scrollAmount = delta * 2; // Adjust sensitivity
    this.setOffset(this.currentOffset + scrollAmount);

    // Restart auto-scroll after a delay
    clearTimeout(this.autoScrollTimeout);
    this.autoScrollTimeout = setTimeout(() => {
      this.startAutoScroll();
    }, 2000);
  }

  setOffset(newOffset) {
    // Handle infinite loop by wrapping around
    if (newOffset > this.maxOffset) {
      this.currentOffset = 0;
    } else if (newOffset < 0) {
      this.currentOffset = this.maxOffset;
    } else {
      this.currentOffset = newOffset;
    }

    this.updatePosition();
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
          this.currentOffset = 0;
        } else {
          this.currentOffset += scrollSpeed;
        }
      } else {
        // Scrolling left
        if (this.currentOffset <= 0) {
          this.currentOffset = this.maxOffset;
        } else {
          this.currentOffset -= scrollSpeed;
        }
      }

      this.updatePosition();
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