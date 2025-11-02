// auth.js (Yeni veritabanı yapısına göre güncellenmiş tam sürüm)

function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

function populateSidebarUser() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const userNameDisplay = document.getElementById('user-name-sidebar');
        const userAvatar = document.getElementById('user-avatar-sidebar');
        
        if (userNameDisplay) userNameDisplay.textContent = loggedInUser;
        
        if (userAvatar) {
            const initials = loggedInUser.split(' ').map(n => n[0]).join('');
            userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&font-size=0.5`;
        }
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

// --- Sadece Login Sayfasında Çalışacak Kodlar ---
if (document.getElementById('login-form')) {
    const db = firebase.firestore();
    const loginForm = document.getElementById('login-form');
    const usernameSelect = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-btn');

    async function populateUserDropdown() {
        try {
            // DEĞİŞTİ: Koleksiyon adı 'Users' olarak güncellendi.
            // DEĞİŞTİ: Sıralama alanı 'User' olarak güncellendi.
            const snapshot = await db.collection('Users').orderBy('User').get();
            
            if (snapshot.empty) {
                console.warn("Veritabanında 'Users' koleksiyonu boş veya bulunamadı.");
                errorMessage.textContent = "Kullanıcı bulunamadı.";
            }

            snapshot.forEach(doc => {
                const user = doc.data();
                const option = document.createElement('option');
                
                // DEĞİŞTİ: Kullanıcı adı alanı 'User' olarak güncellendi.
                option.value = user.User;
                option.textContent = user.User;
                usernameSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Kullanıcılar yüklenirken hata oluştu:", error);
            errorMessage.textContent = "Kullanıcı listesi yüklenemedi.";
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedUsername = usernameSelect.value;
        const enteredPassword = passwordInput.value;
        
        errorMessage.textContent = '';
        loginButton.disabled = true;
        loginButton.textContent = 'Kontrol ediliyor...';

        if (!selectedUsername) {
            errorMessage.textContent = 'Lütfen bir kullanıcı seçin!';
            loginButton.disabled = false;
            loginButton.textContent = 'Giriş Yap';
            return;
        }

        try {
            // DEĞİŞTİ: Koleksiyon adı 'Users' ve sorgu alanı 'User' olarak güncellendi.
            const snapshot = await db.collection('Users').where('User', '==', selectedUsername).limit(1).get();
            
            if (snapshot.empty) {
                errorMessage.textContent = 'Kullanıcı bulunamadı!';
            } else {
                const user = snapshot.docs[0].data();
                
                // DEĞİŞTİ: Şifre alanı 'pass' olarak güncellendi.
                if (user.pass === enteredPassword) {
                    // DEĞİŞTİ: Oturumda saklanacak kullanıcı adı 'User' alanından alınıyor.
                    sessionStorage.setItem('loggedInUser', user.User);
                    window.location.href = 'index.html';
                } else {
                    errorMessage.textContent = 'Şifre hatalı!';
                }
            }
        } catch (error) {
            console.error("Giriş sırasında hata:", error);
            errorMessage.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Giriş Yap';
        }
    });

    populateUserDropdown();
}