document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.classList.add("was-validated");
    });
  });

document.addEventListener("DOMContentLoaded", function () {
const loginForm = document.getElementById("loginForm");
const authArea = document.getElementById("authArea");

loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = loginForm.querySelector("input[type='text']").value;

    if (!username) return;


    authArea.innerHTML = `
    <span class="text-white mr-2">Welcome ${username}</span>
    <button class="btn btn-danger btn-sm" id="logoutBtn">Logout</button>
    `;


    $('#loginModal').modal('hide');
});


document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "logoutBtn") {
    authArea.innerHTML = `
        <button class="btn btn-primary" data-toggle="modal" data-target="#loginModal" style="background-color: transparent; border: none; font-size: large;">
        Login
        </button>
    `;
    }
});
});



var nav = $("#navbarSupportedContent");
var btn = $(".custom_menu-btn");
btn.click
btn.click(function (e) {

    e.preventDefault();
    nav.toggleClass("lg_nav-toggle");
    document.querySelector(".custom_menu-btn").classList.toggle("menu_btn-style")
});


function toggleReadMore() {
    const moreContent = document.getElementById("moreContent");
    const readMoreLink = document.getElementById("readMoreLink");

    if (moreContent.style.display === "none") {
      moreContent.style.display = "block";
      readMoreLink.innerText = "Read less ↑";
    } else {
      moreContent.style.display = "none";
      readMoreLink.innerText = "Read more ↓";
    }
  }

function getCurrentYear() {
    var d = new Date();
    var currentYear = d.getFullYear()

    $("#displayDate").html(currentYear);
}

getCurrentYear();

document.getElementById("newsletterForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const emailInput = document.getElementById("newsletterEmail").value.trim();
    const errorDisplay = document.getElementById("newsletterError");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailInput)) {
      errorDisplay.textContent = "Please enter a valid email address.";
      errorDisplay.style.display = "block";
    } else {
      errorDisplay.style.display = "none";
      alert("Thank you for subscribing!");
      this.reset();
    }
  });

  (function() {
    'use strict';
    const form = document.getElementById('contact_form');
    form.addEventListener('submit', function(e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  })();