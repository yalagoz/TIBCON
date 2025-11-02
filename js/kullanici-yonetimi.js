// js/kullanici-yonetimi.js (ŞİFRESİZ - Yeniden Yazılmış, Temiz Sürüm)

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('password-change-form');
    if (!form) return;

    try {
        checkAuth();
        populateSidebarUser();
    } catch(e) {
        console.error("Auth fonksiyonları yüklenirken hata:", e);
    }

    const oldPasswordInput = document.getElementById('old-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const saveBtn = document.getElementById('save-password-btn');
    const messageArea = document.getElementById('message-area');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPass = oldPasswordInput.value;
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;

        messageArea.innerHTML = '';
        saveBtn.disabled = true;
        saveBtn.textContent = 'İşleniyor...';

        // Girdi Kontrolleri
        if (!oldPass || !newPass || !confirmPass) {
            showMessage('Lütfen tüm alanları doldurun.', 'warning');
            resetButton();
            return;
        }
        if (newPass !== confirmPass) {
            showMessage('Yeni parolalar eşleşmiyor!', 'danger');
            resetButton();
            return;
        }
        if (newPass.length < 4) {
            showMessage('Yeni parola en az 4 karakter olmalıdır!', 'warning');
            resetButton();
            return;
        }

        try {
            const loggedInUsername = sessionStorage.getItem('loggedInUser');
            if (!loggedInUsername) {
                throw new Error("Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.");
            }

            const userQuery = await db.collection('Users').where('User', '==', loggedInUsername).limit(1).get();

            if (userQuery.empty) {
                throw new Error("Kullanıcı veritabanında bulunamadı.");
            }

            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const storedPass = userData.pass;

            // DEĞİŞTİ: Artık sadece düz metin karşılaştırması yapılıyor.
            if (oldPass !== storedPass) {
                showMessage('Mevcut parolanız hatalı!', 'danger');
                resetButton();
                return;
            }

            // DEĞİŞTİ: Yeni parola şifrelenmeden, doğrudan veritabanına yazılıyor.
            await db.collection('Users').doc(userDoc.id).update({
                pass: newPass
            });

            showMessage('Parolanız başarıyla güncellendi!', 'success');
            form.reset();

        } catch (error) {
            console.error("Parola güncelleme hatası:", error);
            showMessage(`Bir hata oluştu: ${error.message}`, 'danger');
        } finally {
            resetButton();
        }
    });

    function showMessage(message, type = 'info') {
        messageArea.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }

    function resetButton() {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Parolayı Güncelle';
    }
});