// Initialize Google Maps & Get User Location
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), { zoom: 14 });
    const marker = new google.maps.Marker({ map: map, title: "Your Location" });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setCenter(userPos);
            marker.setPosition(userPos);
        }, () => alert("Geolocation failed. Please allow location access."));
    } else {
        alert("Geolocation is not supported.");
    }
}

// Automatically Start Back Camera & Object Detection
async function startCamera() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const statusText = document.getElementById("status");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } // Use back camera
        });
        video.srcObject = stream;
    } catch (error) {
        alert("Camera access denied! Please allow permissions.");
        return;
    }

    // Load AI Model for Object Detection
    const model = await cocoSsd.load();

    // Detect Objects Continuously
    async function detect() {
        const predictions = await model.detect(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        predictions.forEach((pred) => {
            ctx.beginPath();
            ctx.rect(...pred.bbox);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            ctx.fillStyle = "red";
            ctx.stroke();
            ctx.fillText(pred.class, pred.bbox[0], pred.bbox[1] - 10);

            if (pred.class === "person" || pred.class === "car" || pred.class === "bicycle") {
                statusText.innerText = `Warning! Obstacle detected: ${pred.class}`;
                speakText(`Warning! ${pred.class} ahead.`);
            }
        });

        requestAnimationFrame(detect);
    }
    detect();
}

// Voice Recognition for Destination Input
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;

// Start Voice Input for Destination
function voiceInputDestination() {
    speakText("Please say your destination.");
    recognition.start();
}

// Capture & Process Voice Input for Destination
recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("destination").value = transcript;
    speakText(`Destination set to ${transcript}. Starting navigation.`);
    startNavigation();
};

// Start Navigation in Google Maps
function startNavigation() {
    let destination = document.getElementById("destination").value;
    if (destination) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, "_blank");
    } else {
        speakText("Please enter a destination.");
    }
}

// Function for Voice Feedback
function speakText(message) {
    let speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}

// Automatically Start Camera, Object Detection & Voice Command on Page Load
document.addEventListener("DOMContentLoaded", () => {
    startCamera();
    voiceInputDestination();
});
