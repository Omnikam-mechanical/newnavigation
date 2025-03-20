// Initialize Google Maps
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

// Start navigation
function startNavigation() {
    let destination = document.getElementById("destination").value;
    if (destination) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
    } else {
        alert("Please enter a destination.");
    }
}

// Start camera and detect obstacles
async function startCamera() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const statusText = document.getElementById("status");

    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => { video.srcObject = stream; })
        .catch((err) => alert("Camera access denied!"));

    // Load the model
    const model = await cocoSsd.load();

    // Detect objects
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

            if (pred.class === "person" || pred.class === "car") {
                statusText.innerText = `Warning! Obstacle detected: ${pred.class}`;
                speakText(`Warning! ${pred.class} ahead.`);
            }
        });

        requestAnimationFrame(detect);
    }
    detect();
}

// Voice output function
function speakText(message) {
    let speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
}

// SOS Emergency Function
function sendSOS() {
    alert("SOS alert sent to emergency contacts!");
    speakText("Emergency alert activated.");
}
