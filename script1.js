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