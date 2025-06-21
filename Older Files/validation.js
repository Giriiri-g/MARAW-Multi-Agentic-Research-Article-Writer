let validationActive = false;
let loginValidationStarted = false;
const fields = [
  { id: 'name1', headerId: 'name-header', validate: v => v.trim() !== '', errorMsg: 'X Name cannot be empty' },
  { id: 'email1', headerId: 'email-header', validate: v => /^\S+@\S+\.\S+$/.test(v), errorMsg: 'X Please enter a valid email' },
  { id: 'message1', headerId: 'message-header', validate: v => v.trim() !== '', errorMsg: 'X Message cannot be empty' }
];
const loginFields = [
  { id: 'username', headerId: 'username-header', validate: v => v.trim().length >= 3, errorMsg: 'X Username must be at least 3 characters' },
  { id: 'password', headerId: 'password-header', validate: v => v.length >= 6, errorMsg: 'X Password must be at least 6 characters' }
];
function contactpopup(){
  document.getElementById('contactBtn').style.color = '#F55036';
  document.getElementById('contactoverlay').style.display = 'flex';
  validationActive = false;
}
function contactclose(){
  document.getElementById('contactBtn').style.color = '#fff';
  document.getElementById('contactoverlay').style.display = 'none';
  validationActive = false;
  fields.forEach(f => {
    const h = document.getElementById(f.headerId);
    h.style.color = '';
    const e = h.querySelector('.error-field');
    if(e) e.remove();
    document.getElementById(f.id).value = '';
  });
}
function validateField(field){
  const i = document.getElementById(field.id);
  const h = document.getElementById(field.headerId);
  const prev = h.querySelector('.error-field');
  if(prev) prev.remove();
  if(field.validate(i.value)){
    h.style.color = '#52efa6'; return true;
  }
  h.style.color = '#F55036';
  const span = document.createElement('span');
  span.className = 'error-field';
  span.textContent = field.errorMsg;
  h.appendChild(span);
  return false;
}
function validateAll(){
  return fields.map(f=>validateField(f)).every(v=>v);
}
function loginpopup(){
  document.getElementById('login-overlay').style.display = 'flex';
  loginValidationStarted = false;
}
function loginclose(){
  document.getElementById('login-overlay').style.display = 'none';
  loginValidationStarted = false;
  loginFields.forEach(f=>{
    const h=document.getElementById(f.headerId);
    h.style.color = '';
    const e = h.querySelector('.error-field');
    if(e) e.remove();
    document.getElementById(f.id).value='';
  });
}
function validateLoginField(field){
  const i = document.getElementById(field.id);
  const h = document.getElementById(field.headerId);
  const prev = h.querySelector('.error-field');
  if(prev) prev.remove();
  if(field.validate(i.value)){
    h.style.color = '#52efa6'; return true;
  }
  h.style.color = '#F55036';
  const span = document.createElement('span');
  span.className = 'error-field';
  span.textContent = field.errorMsg;
  h.appendChild(span);
  return false;
}
function validateLoginAll(){
  return loginFields.map(f=>validateLoginField(f)).every(v=>v);
}
function trydemo(){
  if(document.getElementById('logout-btn').style.display==='block'){
    window.location='demo.html';
  } else loginpopup();
}
function logout(){
  document.getElementById('loginOpenBtn').style.display='block';
  document.getElementById('logout-btn').style.display='none';
  document.getElementById('user-welc').style.display='none';
  localStorage.removeItem('username');
}
document.addEventListener('DOMContentLoaded',()=>{
  const cForm=document.querySelector('#contactpop form');
  const lForm=document.getElementById('loginForm');
  fields.forEach(f=>{
    document.getElementById(f.id).addEventListener('input',()=>{
      if(validationActive) validateField(f);
    });
  });
  loginFields.forEach(f=>{
    document.getElementById(f.id).addEventListener('input',()=>{
      if(loginValidationStarted) validateLoginField(f);
    });
  });
  cForm.addEventListener('submit',e=>{
    if(!validationActive){ validationActive=true; validateAll(); e.preventDefault(); return; }
    if(!validateAll()) e.preventDefault();
  });
  lForm.addEventListener('submit',e=>{
    if(!loginValidationStarted){ loginValidationStarted=true; validateLoginAll(); e.preventDefault(); return; }
    if(!validateLoginAll()){ e.preventDefault(); return; }
    e.preventDefault(); loginclose();
    document.getElementById('loginOpenBtn').style.display='none';
    document.getElementById('logout-btn').style.display='block';
    document.getElementById('user-welc').style.display='block';
    const u=document.getElementById('username').value.trim();
    localStorage.setItem('username',u);
    document.getElementById('user-welc').textContent=`Welcome, ${u}`;
    loginValidationStarted=false;
  });
});
