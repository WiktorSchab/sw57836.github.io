let map, marker;
const puzzleBoard = document.getElementById('puzzle-board');
const puzzleSlots = document.getElementById('puzzle-slots');
const puzzleSection = document.getElementById('puzzle-section');

const canvas = document.getElementById('puzzle-canvas');
const ctx = canvas.getContext('2d');

let fullImage = new Image();

// MAPA
function initMap() {
  map = L.map('map').setView([52.2297, 21.0122], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    crossOrigin: true
  }).addTo(map);
} /* Funckcja wygenerowana z copilot */

// Pobieranie lokalizacji od użytkownika
document.getElementById('btn-location').addEventListener('click', () => {
  Notification.requestPermission();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const latlng = [latitude, longitude];

      map.setView(latlng, 15);

      if (marker) marker.setLatLng(latlng);
      else marker = L.marker(latlng).addTo(map);

      document.getElementById('coords').innerText =
        `Współrzędne: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }, () => alert("Nie udało się pobrać lokalizacji."));
  }
});

// Pobiera widok mapy, przycina go do 400x400 i przekazuje do generatora puzzli
document.getElementById('btn-download').addEventListener('click', () => {
  leafletImage(map, function(err, canvasMap) {
    if (err) return alert("Błąd renderowania mapy.");

    const size = 400; // 400px x 400px
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = size;
    cropCanvas.height = size;
    const ctx2 = cropCanvas.getContext('2d');

    ctx2.drawImage(
      canvasMap,
      (canvasMap.width - size) / 2,
      (canvasMap.height - size) / 2,
      size, size,
      0, 0, size, size
    );

    createPuzzle(cropCanvas.toDataURL());
  });
});

// Dzieli obraz na puzzle
function createPuzzle(imgData) {
  // czyści poprzednie elementy planszy i slotów
  puzzleBoard.innerHTML = '';
  puzzleSlots.innerHTML = '';
  puzzleSection.style.display = 'block';

  // czyści dodatkowe płótno (canvas)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ładuje obraz źródłowy
  fullImage = new Image();
  fullImage.src = imgData;

  const pieces = [];

  // tworzy 16 pól (4x4)
  for (let i = 0; i < 16; i++) {
    const slot = document.createElement('div');
    slot.classList.add('slot');
    slot.dataset.index = i;

    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', handleDrop);

    puzzleSlots.appendChild(slot);

    // tworzenie pojedynczego kawałka puzzla
    const piece = document.createElement('div');
    piece.classList.add('puzzle-piece');
    piece.draggable = true;
    piece.id = `piece-${i}`;
    piece.dataset.correctIndex = i;

    // obliczenie pozycji w siatce 4x4
    const row = Math.floor(i / 4);
    const col = i % 4;

    // ustawienie fragmentu obrazu jako tło
    piece.style.backgroundImage = `url(${imgData})`;
    piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;

    piece.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', piece.id);
      piece.classList.add('dragging');
    });

    piece.addEventListener('dragend', () => {
      piece.classList.remove('dragging');
    });

    pieces.push(piece);
  }

  // losowe wymieszanie puzzli i dodanie do planszy
  pieces.sort(() => Math.random() - 0.5)
    .forEach(p => puzzleBoard.appendChild(p));
}

// Funckja ktora przerysowuje kawalek na canvas
function drawPieceOnCanvas(piece) {
  const index = parseInt(piece.dataset.correctIndex);
  const row = Math.floor(index / 4);
  const col = index % 4;

  ctx.drawImage(
    fullImage,
    col * 100, row * 100, 100, 100,
    col * 100, row * 100, 100, 100
  );
}

// Funckja ktora sprawdza czy kawalek jest na poprawnej pozycji
function verifyPiece(piece, slot) {
  if (piece.dataset.correctIndex === slot.dataset.index) {
    drawPieceOnCanvas(piece);
    piece.remove();
    slot.dataset.filled = "true";

    console.log("Puzzel nr " + slot.dataset.index + " zostal ulozony poprawnie");

    return true;
  } else {
    console.log("Puzzel nr " + slot.dataset.index + " wraca na stol");
    puzzleBoard.appendChild(piece); // wraca na stół
    return false;
  }
}

// obsluga dropu
function handleDrop(e) {
  e.preventDefault();

  const id = e.dataTransfer.getData('text/plain');
  const piece = document.getElementById(id);
  let target = e.target;

  if (target.classList.contains('puzzle-piece')) {
    target = target.parentElement;
  }

  if (target.classList.contains('slot') && !target.dataset.filled) {
    target.appendChild(piece);
    if (verifyPiece(piece, target)){
      target.style.background = 'transparent';
      checkWin();
    }

  }
}

// Sprawdzenie czy skonczono ukladac puzzle
function checkWin() {
  const slots = document.querySelectorAll('.slot');
  let correctCount = 0;

  slots.forEach(slot => {
    if (slot.dataset.filled === "true") {
      correctCount++;
    }
  });

  if (correctCount === 16) {
    console.log("Ulozono puzzule brawo 🔥🔥🔥");
    if (Notification.permission === "granted") {
      new Notification("Gratulacje!", { body: "Ułożyłeś mapę idealnie!" });
    } else {
      alert("Gratulacje! Mapa ułożona.");
    }
  }
}

initMap();
