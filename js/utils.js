// js/utils.js

/**
 * Firestore'daki 'Users' koleksiyonundan kullanıcıları çeker ve verilen <select> elementini doldurur.
 * @param {string} selectElementId - Kullanıcıların ekleneceği <select> elementinin ID'si.
 * @param {boolean} addPlaceholder - Başa "Kullanıcı Seçin..." gibi bir seçenek eklenip eklenmeyeceği.
 */
async function populateUsersDropdown(selectElementId, addPlaceholder = true) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`Element with ID "${selectElementId}" not found.`);
        return;
    }

    // Mevcut seçenekleri temizle (placeholder hariç)
    selectElement.innerHTML = '';

    if (addPlaceholder) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "Sorumlu Seçin...";
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        selectElement.appendChild(placeholderOption);
    }
    
    try {
        const snapshot = await db.collection('Users').orderBy('User').get();
        if (snapshot.empty) {
            console.warn("Firestore'da 'Users' koleksiyonunda kullanıcı bulunamadı.");
            return;
        }
        
        snapshot.forEach(doc => {
            const user = doc.data();
            const option = document.createElement('option');
            option.value = user.User;
            option.textContent = user.User;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error("Kullanıcılar yüklenirken bir hata oluştu:", error);
    }
}