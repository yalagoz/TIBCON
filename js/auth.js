// auth.js (Hata tamamen düzeltilmiş sürüm)

/**
 * Kullanıcının giriş yapıp yapmadığını kontrol eder.
 * Giriş yapmamışsa login sayfasına yönlendirir.
 */
function checkAuth() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    // Eğer kullanıcı giriş yapmamışsa VE login sayfasında değilse yönlendir.
    if (!loggedInUser && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * Sidebar'daki kullanıcı adı ve avatarını doldurur.
 * Ayrıca şifre değiştirme modalını açmak için olay dinleyicisini ekler.
 */
function populateSidebarUser() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const userNameDisplay = document.getElementById('user-name-sidebar');
        const userAvatar = document.getElementById('user-avatar-sidebar');
        
        if (userNameDisplay) userNameDisplay.textContent = loggedInUser;
        
        if (userAvatar) {
            const initials = loggedInUser.split(' ').map(n => n[0]).join('') || '?';
            userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&font-size=0.5`;
        }
        
        const userInfoContainer = document.getElementById('user-info-container');
        if (userInfoContainer) {
            userInfoContainer.addEventListener('click', () => {
                const passwordModal = new bootstrap.Modal(document.getElementById('passwordChangeModal'));
                document.getElementById('password-change-form').reset();
                const messageDiv = document.getElementById('password-change-message');
                messageDiv.textContent = '';
                messageDiv.className = 'mt-3';
                passwordModal.show();
            });
        }
    }
}

/**
 * Kullanıcı oturumunu sonlandırır ve login sayfasına yönlendirir.
 */
function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

/**
 * Şifre değiştirme formunu yönetir ve Firestore'da şifreyi günceller.
 * @param {Event} e - Form submit olayı
 */
async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageDiv = document.getElementById('password-change-message');
    const saveBtn = document.getElementById('save-password-btn');

    messageDiv.textContent = ''; // Mesajları temizle
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        messageDiv.textContent = 'Lütfen tüm alanları doldurun.';
        messageDiv.className = 'alert alert-warning';
        return;
    }
    if (newPassword !== confirmPassword) {
        messageDiv.textContent = 'Yeni şifreler eşleşmiyor!';
        messageDiv.className = 'alert alert-danger';
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Kaydediliyor...';

    const currentUser = sessionStorage.getItem('loggedInUser');

    try {
        // 'db' değişkeni firebase-config.js'den geldiği için burada doğrudan kullanılıyor.
        const snapshot = await db.collection('Users').where('User', '==', currentUser).limit(1).get();

        if (snapshot.empty) {
            throw new Error('Mevcut kullanıcı bulunamadı.');
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.pass !== currentPassword) {
            messageDiv.textContent = 'Mevcut şifreniz hatalı!';
            messageDiv.className = 'alert alert-danger';
            return;
        }

        await db.collection('Users').doc(userDoc.id).update({ pass: newPassword });

        messageDiv.textContent = 'Şifreniz başarıyla güncellendi!';
        messageDiv.className = 'alert alert-success';

        setTimeout(() => {
            const passwordModalEl = document.getElementById('passwordChangeModal');
            const passwordModal = bootstrap.Modal.getInstance(passwordModalEl);
            if (passwordModal) passwordModal.hide();
        }, 2000);

    } catch (error) {
        console.error("Şifre değiştirme hatası:", error);
        messageDiv.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        messageDiv.className = 'alert alert-danger';
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Kaydet';
    }
}


// --- SAYFAYA ÖZEL KODLARI ÇALIŞTIRMA ---

if (document.getElementById('login-form')) {
    // --- Sadece Login Sayfasında Çalışacak Kodlar ---
    const loginForm = document.getElementById('login-form');
    const usernameSelect = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.getElementById('login-btn');

    async function populateUserDropdown() {
        try {
            const snapshot = await db.collection('Users').orderBy('User').get();
            if (snapshot.empty) {
                console.warn("Veritabanında 'Users' koleksiyonu boş veya bulunamadı.");
                errorMessage.textContent = "Kullanıcı bulunamadı.";
            }
            snapshot.forEach(doc => {
                const user = doc.data();
                const option = document.createElement('option');
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
            const snapshot = await db.collection('Users').where('User', '==', selectedUsername).limit(1).get();
            if (snapshot.empty) {
                errorMessage.textContent = 'Kullanıcı bulunamadı!';
            } else {
                const user = snapshot.docs[0].data();
                if (user.pass === enteredPassword) {
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

} else {
    // --- Diğer Sayfalarda (index, siparisler vb.) Çalışacak Kodlar ---
    const passwordForm = document.getElementById('password-change-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleChangePassword);
    }
}