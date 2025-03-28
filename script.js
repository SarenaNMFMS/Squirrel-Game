// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nutCountDisplay = document.getElementById('nutCount');
const speedDisplay = document.getElementById('speedDisplay');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const imageStatusDisplay = document.getElementById('imageStatus');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game objects
const squirrel = {
    x: 100,
    y: 100,
    width: 30,
    height: 30,
    speed: 10,
    nutsCollected: 0,
    dx: 0,
    dy: 0
};

const dog = {
    x: canvas.width - 100,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    speed: 4
};

let nuts = [];
let gameRunning = true;
let keysPressed = {};

// Image management
const gameAssets = {
    images: {
        squirrel: {
            path: 'images/squirrel.png',
            img: new Image(),
            loaded: false
        },
        dog: {
            path: 'images/dog.png',
            img: new Image(),
            loaded: false
        },
        nut: {
            path: 'images/nut.png',
            img: new Image(),
            loaded: false
        },
        background: {
            path: 'images/background.jpg',
            img: new Image(),
            loaded: false
        }
    },
    colors: {
        squirrel: '#8B4513',
        dog: '#808080',
        nut: '#DAA520',
        background: '#a0d8ef'
    }
};

// Load images with error handling
function loadImages() {
    let loadedCount = 0;
    const totalImages = Object.keys(gameAssets.images).length;

    for (const [key, value] of Object.entries(gameAssets.images)) {
        value.img.onload = () => {
            value.loaded = true;
            loadedCount++;
            updateImageStatus(loadedCount, totalImages);
            if (loadedCount === totalImages) startGame();
        };
        value.img.onerror = () => {
            console.error(`Failed to load image: ${value.path}`);
            loadedCount++;
            updateImageStatus(loadedCount, totalImages);
            if (loadedCount === totalImages) startGame();
        };
        value.img.src = value.path;
    }
}

function updateImageStatus(loaded, total) {
    imageStatusDisplay.textContent = `Images: ${loaded}/${total} loaded`;
}

// Initialize game
function startGame() {
    createNuts(5);
    gameLoop();
}

// Create nuts
function createNuts(count) {
    for (let i = 0; i < count; i++) {
        nuts.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: Math.random() * (canvas.height - 30) + 15,
            width: 20,
            height: 20
        });
    }
}

// Drawing functions
function drawBackground() {
    if (gameAssets.images.background.loaded) {
        ctx.drawImage(gameAssets.images.background.img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = gameAssets.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawSquirrel() {
    if (gameAssets.images.squirrel.loaded) {
        const angle = squirrel.dx || squirrel.dy ? Math.atan2(squirrel.dy, squirrel.dx) : 0;
        ctx.save();
        ctx.translate(squirrel.x, squirrel.y);
        ctx.rotate(angle);
        ctx.drawImage(gameAssets.images.squirrel.img, -squirrel.width/2, -squirrel.height/2, squirrel.width, squirrel.height);
        ctx.restore();
    } else {
        ctx.fillStyle = gameAssets.colors.squirrel;
        ctx.beginPath();
        ctx.arc(squirrel.x, squirrel.y, squirrel.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawDog() {
    if (gameAssets.images.dog.loaded) {
        ctx.drawImage(gameAssets.images.dog.img, dog.x - dog.width/2, dog.y - dog.height/2, dog.width, dog.height);
    } else {
        ctx.fillStyle = gameAssets.colors.dog;
        ctx.beginPath();
        ctx.arc(dog.x, dog.y, dog.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawNut(x, y) {
    if (gameAssets.images.nut.loaded) {
        ctx.drawImage(gameAssets.images.nut.img, x - 10, y - 10, 20, 20);
    } else {
        ctx.fillStyle = gameAssets.colors.nut;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Movement functions
function handleSquirrelMovement() {
    squirrel.dx = 0;
    squirrel.dy = 0;
    
    if (keysPressed['ArrowLeft']) squirrel.dx = -1;
    if (keysPressed['ArrowRight']) squirrel.dx = 1;
    if (keysPressed['ArrowUp']) squirrel.dy = -1;
    if (keysPressed['ArrowDown']) squirrel.dy = 1;
    
    // Normalize diagonal movement
    if (squirrel.dx !== 0 && squirrel.dy !== 0) {
        const length = Math.sqrt(squirrel.dx * squirrel.dx + squirrel.dy * squirrel.dy);
        squirrel.dx /= length;
        squirrel.dy /= length;
    }
    
    squirrel.x += squirrel.dx * squirrel.speed;
    squirrel.y += squirrel.dy * squirrel.speed;
    
    // Keep in bounds
    squirrel.x = Math.max(squirrel.width/2, Math.min(canvas.width - squirrel.width/2, squirrel.x));
    squirrel.y = Math.max(squirrel.height/2, Math.min(canvas.height - squirrel.height/2, squirrel.y));
}

function moveDog() {
    const dx = squirrel.x - dog.x;
    const dy = squirrel.y - dog.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        dog.x += (dx / distance) * dog.speed;
        dog.y += (dy / distance) * dog.speed;
    }
    
    // Check collision
    if (distance < (squirrel.width + dog.width)/2) {
        endGame();
    }
}

function checkNutCollection() {
    for (let i = nuts.length - 1; i >= 0; i--) {
        const nut = nuts[i];
        const dx = squirrel.x - nut.x;
        const dy = squirrel.y - nut.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (squirrel.width + 20)/2) {
            nuts.splice(i, 1);
            squirrel.nutsCollected++;
            squirrel.speed += 0.5;
            
            nutCountDisplay.textContent = squirrel.nutsCollected;
            speedDisplay.textContent = squirrel.speed.toFixed(1);
            
            createNuts(1);
        }
    }
}

// Game control
function endGame() {
    gameRunning = false;
    finalScoreDisplay.textContent = squirrel.nutsCollected;
    gameOverDiv.style.display = 'block';
}
// ... (keep all previous code until the resetGame function)

function resetGame() {
    // Reset squirrel
    squirrel.x = 100;
    squirrel.y = 100;
    squirrel.speed = 10;
    squirrel.nutsCollected = 0;
    squirrel.dx = 0;
    squirrel.dy = 0;
    
    // Reset dog
    dog.x = canvas.width - 100;
    dog.y = canvas.height - 100;
    
    // Reset nuts
    nuts = [];
    createNuts(5);
    
    // Reset display
    nutCountDisplay.textContent = '0';
    speedDisplay.textContent = '3';
    gameOverDiv.style.display = 'none';
    
    // Reset game state
    gameRunning = true;
    keysPressed = {}; // Clear any stuck key presses
    
    // Restart game loop
    gameLoop();
}

// ... (keep the rest of the code the same)
// Event listeners
document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

window.addEventListener('keydown', function(e) {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    drawBackground();
    
    // Move characters
    handleSquirrelMovement();
    moveDog();
    checkNutCollection();
    
    // Draw game objects
    nuts.forEach(nut => drawNut(nut.x, nut.y));
    drawSquirrel();
    drawDog();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
loadImages();