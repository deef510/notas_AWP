// app.js

// Verificaciones iniciales y registro del Service Worker
document.addEventListener('DOMContentLoaded', function() {
    console.log('Servidor:', window.location.href);
    
    // Animación del título
    const title = document.querySelector('h1');
    if (title) {
        title.style.opacity = '0';
        title.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            title.style.transition = 'all 1s ease';
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, 100);
    }

    // Verificar y registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/AWP/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado correctamente:', registration);
            })
            .catch(error => {
                console.error('Error al registrar Service Worker:', error);
            });
    }

    // Verificar características disponibles
    console.log('Cámara disponible:', 'mediaDevices' in navigator);
    console.log('Geolocalización disponible:', 'geolocation' in navigator);
    console.log('Notificaciones disponibles:', 'Notification' in window);

    // Solicitar permisos de notificación
    if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('Notificaciones permitidas');
            }
        });
    }

    // Cargar notas existentes con animación
    renderNotes();
});

// Función para animar el botón de guardar
function animateSaveButton() {
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.classList.add('processing');
        saveBtn.style.transform = 'scale(0.98)';
        setTimeout(() => {
            saveBtn.classList.remove('processing');
            saveBtn.style.transform = 'scale(1)';
        }, 1000);
    }
}

// Funciones para características del dispositivo
async function takePicture() {
    animateButton('camera');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        Swal.fire({
            title: '¡Cámara activada!',
            text: 'La cámara se activó correctamente',
            icon: 'success',
            timer: 1500,
            position: 'top-end',
            toast: true,
            showConfirmButton: false
        });
        
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.stop();
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo acceder a la cámara: ' + error.message,
            icon: 'error',
            confirmButtonColor: '#4285f4'
        });
    }
}

async function recordAudio() {
    animateButton('audio');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        Swal.fire({
            title: '¡Micrófono activado!',
            text: 'El micrófono se activó correctamente',
            icon: 'success',
            timer: 1500,
            position: 'top-end',
            toast: true,
            showConfirmButton: false
        });
        
        const audioTrack = stream.getAudioTracks()[0];
        audioTrack.stop();
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo acceder al micrófono: ' + error.message,
            icon: 'error',
            confirmButtonColor: '#4285f4'
        });
    }
}

function getLocation() {
    animateButton('location');
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const locationText = `\nUbicación: ${latitude}, ${longitude}`;
                document.getElementById('noteContent').value += locationText;
                
                Swal.fire({
                    title: '¡Ubicación agregada!',
                    text: 'La ubicación se agregó correctamente',
                    icon: 'success',
                    timer: 1500,
                    position: 'top-end',
                    toast: true,
                    showConfirmButton: false
                });
            },
            error => {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo obtener la ubicación: ' + error.message,
                    icon: 'error',
                    confirmButtonColor: '#4285f4'
                });
            }
        );
    } else {
        Swal.fire({
            title: 'Error',
            text: 'Tu navegador no soporta geolocalización',
            icon: 'error',
            confirmButtonColor: '#4285f4'
        });
    }
}

// Función para animar botones de medios
function animateButton(type) {
    const button = document.querySelector(`.media-btn[data-type="${type}"]`);
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/AWP/images/icon-192.png'
        });
    }
}

function saveNote() {
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (!titleInput.value || !contentInput.value) {
        Swal.fire({
            title: '¡Campos incompletos!',
            text: 'Por favor completa todos los campos',
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#4285f4'
        });
        return;
    }

    // Animar botón de guardar
    animateSaveButton();

    const note = {
        id: Date.now(),
        title: titleInput.value,
        content: contentInput.value,
        date: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.unshift(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    titleInput.value = '';
    contentInput.value = '';
    
    renderNotes();

    Swal.fire({
        title: '¡Nota guardada!',
        text: 'Tu nota se ha guardado correctamente',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });
}


function deleteNote(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4285f4',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const noteElement = document.querySelector(`[data-note-id="${id}"]`);
            if (noteElement) {
                // Animar la eliminación
                noteElement.style.transition = 'all 0.5s ease';
                noteElement.style.transform = 'scale(0.8)';
                noteElement.style.opacity = '0';
                
                setTimeout(() => {
                    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
                    const updatedNotes = notes.filter(note => note.id !== id);
                    localStorage.setItem('notes', JSON.stringify(updatedNotes));
                    renderNotes();
                    
                    Swal.fire({
                        title: '¡Eliminada!',
                        text: 'La nota ha sido eliminada',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        position: 'top-end',
                        toast: true
                    });
                }, 500);
            }
        }
    });
}

function renderNotes() {
    const notesList = document.getElementById('notesList');
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; animation: fadeIn 0.5s ease-out;">
                No hay notas guardadas
            </div>
        `;
        return;
    }

    notesList.innerHTML = notes.map((note, index) => `
        <div class="note-card" data-note-id="${note.id}" 
             style="animation: slideIn 0.5s ease-out ${index * 0.1}s both;">
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                <small class="date">${note.date}</small>
                <button onclick="deleteNote(${note.id})" 
                        class="delete-btn"
                        style="background: #dc3545; color: white; border: none; 
                               padding: 5px 10px; border-radius: 4px; cursor: pointer;
                               transition: all 0.3s ease;">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function checkOnlineStatus() {
    const updateOnlineStatus = () => {
        if (!navigator.onLine) {
            Swal.fire({
                title: 'Sin conexión',
                text: 'Estás trabajando en modo offline',
                icon: 'warning',
                toast: true,
                position: 'top-end',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }
    }

    window.addEventListener('online', () => {
        Swal.fire({
            title: '¡Conectado!',
            text: 'La conexión se ha restablecido',
            icon: 'success',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
    });
    window.addEventListener('offline', updateOnlineStatus);
}

checkOnlineStatus();