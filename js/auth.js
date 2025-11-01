// Kullanıcı listesi ve şifre
const validUsers = ["Emrah Aytekin", "Ufuk Sarı", "Fuat Şentürk", "Yusuf Alagöz", "Selim Kaya"];
const correctPassword = "1919";

// Bu fonksiyon, bir sayfa yüklendiğinde çağrılacak
function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

// Bu fonksiyon, header'daki kullanıcı adını ve avatarı doldurur
function populateUserInfo() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const userNameDisplay = document.getElementById('user-name-display');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userNameDisplay) {
            userNameDisplay.textContent = loggedInUser;
        }
        
        // Basit bir avatar oluşturucu: ismin baş harflerini kullanır
        if (userAvatar) {
            const initials = loggedInUser.split(' ').map(n => n[0]).join('');
            userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=random`;
        }
    }
}

// Bu fonksiyon, çıkış yapma işlemini gerçekleştirir
function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// Eğer şu anki sayfa login.html ise, giriş formu olaylarını dinle
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (validUsers.includes(username) && password === correctPassword) {
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = 'Kullanıcı adı veya şifre hatalı!';
        }
    });
}