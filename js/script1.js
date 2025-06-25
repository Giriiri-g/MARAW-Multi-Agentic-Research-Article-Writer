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

// 
// Login Popup + Contact Popup Script
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