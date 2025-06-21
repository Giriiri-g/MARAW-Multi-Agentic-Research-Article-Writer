    const popup = document.getElementById('popup');

    // Open popup on click when closed
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup.classList.contains('closed')) {
        popup.classList.remove('closed');
        popup.classList.add('open');
        document.getElementsByClassName('popup-content')[0].style.display = 'flex';
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (popup.classList.contains('open') && !popup.contains(e.target)) {
        popup.classList.remove('open');
        popup.classList.add('closing');
        popup.addEventListener('animationend', () => {
          popup.classList.remove('closing');
          popup.classList.add('closed');
        }, { once: true });
      }
    });