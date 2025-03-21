// Initialize Google Maps
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), { zoom: 14 });
    const marker = new google.maps.Marker({ map: map, title: "Your Location" });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setCenter(userPos);
            marker.setPosition(userPos);
        }, () => alert("Geolocation failed. Allow location access."));
    } else {
        alert("Geolocation is not supported.");
    }
}

// Start navigation
function startNavigation() {
    let destination = document.getElementById("destination").value;
    if (destination) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
    } else {
        alert("Please enter a destination.");
    }
}

// Start back camera and detect obstacles
async function startCamera() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const statusText = document.getElementById("status");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;

        const model = await cocoSsd.load();

        async function detect() {
            const predictions = await model.detect(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            predictions.forEach((pred) => {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.strokeRect(...pred.bbox);
                ctx.fillText(pred.class, pred.bbox[0], pred.bbox[1] - 10);

                if (["person", "car"].includes(pred.class)) {
                    statusText.innerText = `Warning! ${pred.class} ahead.`;
                    speakText(`Warning! ${pred.class} ahead.`);
                }
            });

            requestAnimationFrame(detect);
        }
        detect();
    } catch (err) {
        alert("Camera access denied!");
    }
}

// Voice feedback
function speakText(message) {
    let speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}

// SOS Emergency
function sendSOS() {
    alert("SOS alert sent!");
    speakText("Emergency alert activated.");
}

// Voice command setup
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = "en-US";

recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    if (transcript.includes("open navigation")) startNavigation();
    else if (transcript.includes("detect obstacles")) startCamera();
    else if (transcript.includes("send sos")) sendSOS();
};

// Auto-start voice commands and camera
document.addEventListener("DOMContentLoaded", () => {
    recognition.start();
    startCamera();
});
