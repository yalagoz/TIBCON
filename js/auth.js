// Kullanıcı listesi ve şifre
const validUsers = ["Emrah Aytekin", "Ufuk Sarı", "Fuat Şentürk", "Yusuf Alagöz", "Selim Kaya"];
const correctPassword = "1919";

// Bu fonksiyon, bir sayfa yüklendiğinde çağrılacak
function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    // Eğer kullanıcı giriş yapmamışsa ve şu anki sayfa login sayfası değilse, login sayfasına yönlendir
    if (!loggedInUser && window.location.pathname.endsWith('login.html') === false) {
        window.location.href = 'login.html';
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

        // Kullanıcı adı geçerli mi ve şifre doğru mu?
        if (validUsers.includes(username) && password === correctPassword) {
            // Başarılı giriş: Kullanıcıyı sessionStorage'a kaydet ve ana sayfaya yönlendir
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html';
        } else {
            // Hatalı giriş
            errorMessage.textContent = 'Kullanıcı adı veya şifre hatalı!';
        }
    });
}
