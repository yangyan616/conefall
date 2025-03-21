const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game constants
const BLOCK_SIZE = 50; // Increased size for better visibility
const COLORS = ['#FF6B6B', '#4ECB71', '#4D96FF', '#FFD93D', '#FF8FD2'];
const SLOT_COUNT = 5;
const FALL_SPEED = 2;
const SPEED_INCREASE = 0.1;
const MOVE_SPEED = 5;
const TOUCH_SENSITIVITY = 2.5;

// Create ice cream images
const iceCreamStyles = {
    '#FF6B6B': { // Strawberry
        gradient: 'linear-gradient(45deg, #FF6B6B 0%, #FF8989 50%, #FFA7A7 100%)',
        shadow: '#D14D4D',
        highlight: 'rgba(255, 255, 255, 0.3)'
    },
    '#4ECB71': { // Mint
        gradient: 'linear-gradient(45deg, #4ECB71 0%, #6EDB8F 50%, #8EEBAD 100%)',
        shadow: '#3AA957',
        highlight: 'rgba(255, 255, 255, 0.3)'
    },
    '#4D96FF': { // Blueberry
        gradient: 'linear-gradient(45deg, #4D96FF 0%, #6BABFF 50%, #89C0FF 100%)',
        shadow: '#3978D9',
        highlight: 'rgba(255, 255, 255, 0.3)'
    },
    '#FFD93D': { // Vanilla
        gradient: 'linear-gradient(45deg, #FFD93D 0%, #FFE15B 50%, #FFE979 100%)',
        shadow: '#D9B429',
        highlight: 'rgba(255, 255, 255, 0.3)'
    },
    '#FF8FD2': { // Berry
        gradient: 'linear-gradient(45deg, #FF8FD2 0%, #FFA9E0 50%, #FFC3EE 100%)',
        shadow: '#D971B4',
        highlight: 'rgba(255, 255, 255, 0.3)'
    }
};

// Game state
let score = 0;
let gameSpeed = FALL_SPEED;
let blocks = [];
let slots = [];
let gameLoop;
let isGameOver = false;
let keys = {};
let touchX = null;
let isTouchingLeft = false;
let isTouchingRight = false;
let isTouchingDown = false;
let consecutiveMatches = 0;

// Handle keyboard input
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Handle touch button controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const downBtn = document.getElementById('downBtn');

// Function to add button event listeners
function setupButtonControls() {
    console.log("Setting up button controls");
    
    if (leftBtn) {
        leftBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            isTouchingLeft = true;
            console.log("Left button pressed");
        });

        leftBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            isTouchingLeft = false;
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            isTouchingRight = true;
            console.log("Right button pressed");
        });

        rightBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            isTouchingRight = false;
        });
    }

    if (downBtn) {
        console.log("Down button found");
        downBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            isTouchingDown = true;
            console.log("Down button pressed");
        });

        downBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            isTouchingDown = false;
        });
        
        // Add a regular click handler as fallback
        downBtn.addEventListener('click', function(e) {
            if (blocks.length > 0) {
                blocks[blocks.length - 1].y = canvas.height - BLOCK_SIZE * 2.2;
                console.log("Down button clicked");
            }
        });
    } else {
        console.log("Down button not found");
    }
}

// Handle touch input
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (touchX !== null && blocks.length > 0) {
        const currentX = e.touches[0].clientX;
        const diff = (currentX - touchX) * TOUCH_SENSITIVITY;
        
        if (diff > 5) {
            // Move right with increased speed
            blocks[blocks.length - 1].x = Math.min(canvas.width - BLOCK_SIZE, blocks[blocks.length - 1].x + Math.abs(diff/3));
        } else if (diff < -5) {
            // Move left with increased speed
            blocks[blocks.length - 1].x = Math.max(0, blocks[blocks.length - 1].x - Math.abs(diff/3));
        }
        
        touchX = currentX;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchX = null;
});

// Initialize game
function initGame() {
    // Create slots at the bottom
    slots = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
        slots.push({
            x: (canvas.width / SLOT_COUNT) * i,
            y: canvas.height - BLOCK_SIZE,
            color: COLORS[i % COLORS.length],
            width: canvas.width / SLOT_COUNT
        });
    }
    
    // Create initial block
    createNewBlock();
    
    // Set up button controls
    setupButtonControls();
    
    // Start game loop
    gameLoop = setInterval(update, 1000 / 60);
}

// Create a new falling block
function createNewBlock() {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const color = COLORS[colorIndex];
    const slotIndex = Math.floor(Math.random() * SLOT_COUNT);
    blocks.push({
        x: slots[slotIndex].x + (slots[slotIndex].width - BLOCK_SIZE) / 2,
        y: 0,
        color: color,
        colorIndex: colorIndex
    });
}

// Draw ice cream scoop
function drawIceCream(ctx, x, y, color) {
    const style = iceCreamStyles[color];
    
    // Create larger cone with improved texture
    ctx.fillStyle = '#D4A572';
    ctx.beginPath();
    ctx.moveTo(x + BLOCK_SIZE/2, y + BLOCK_SIZE * 1.2);
    ctx.lineTo(x + BLOCK_SIZE * 0.25, y + BLOCK_SIZE * 0.6);
    ctx.lineTo(x + BLOCK_SIZE * 0.75, y + BLOCK_SIZE * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Add cone texture
    ctx.strokeStyle = '#A67B4F';
    ctx.lineWidth = 1;
    for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + BLOCK_SIZE * (0.25 + i * 0.1), y + BLOCK_SIZE * 0.6);
        ctx.lineTo(x + BLOCK_SIZE * 0.5, y + BLOCK_SIZE * 1.2);
        ctx.stroke();
    }

    // Create ice cream scoop with gradient
    const gradient = ctx.createLinearGradient(
        x + BLOCK_SIZE * 0.2,
        y + BLOCK_SIZE * 0.2,
        x + BLOCK_SIZE * 0.8,
        y + BLOCK_SIZE * 0.6
    );
    gradient.addColorStop(0, style.shadow);
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, style.highlight);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE/2, y + BLOCK_SIZE * 0.4, BLOCK_SIZE * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.4, y + BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.15, 0, Math.PI * 2);
    ctx.fill();
}

// Update game state
function update() {
    if (isGameOver) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw canvas background pattern
    drawBackground();

    // Draw slots with 3D effect
    slots.forEach(slot => {
        const style = iceCreamStyles[slot.color];
        
        // Draw slot background with gradient
        const gradient = ctx.createLinearGradient(
            slot.x,
            slot.y,
            slot.x + slot.width,
            slot.y + BLOCK_SIZE
        );
        gradient.addColorStop(0, style.shadow);
        gradient.addColorStop(0.5, slot.color);
        gradient.addColorStop(1, style.highlight);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(slot.x, slot.y, slot.width, BLOCK_SIZE);
        
        // Add 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(slot.x, slot.y, slot.width, BLOCK_SIZE * 0.3);
    });

    // Update and draw blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        
        // Handle instant drop with down arrow
        if (keys['ArrowDown'] || isTouchingDown) {
            // Move block directly above the bottom, but with a small gap to allow collision detection to work properly
            block.y = canvas.height - BLOCK_SIZE * 2.2;
            keys['ArrowDown'] = false; // Reset to prevent continuous dropping
            isTouchingDown = false;
        } else {
            block.y += gameSpeed;
        }

        // Handle horizontal movement
        if (keys['ArrowLeft'] || isTouchingLeft) {
            block.x = Math.max(0, block.x - MOVE_SPEED);
        }
        if (keys['ArrowRight'] || isTouchingRight) {
            block.x = Math.min(canvas.width - BLOCK_SIZE, block.x + MOVE_SPEED);
        }

        // Draw ice cream
        drawIceCream(ctx, block.x, block.y, block.color);

        // Check for collision with slots
        if (block.y + BLOCK_SIZE * 1.2 >= canvas.height - BLOCK_SIZE) {
            const slotIndex = Math.floor((block.x + BLOCK_SIZE / 2) / (canvas.width / SLOT_COUNT));
            if (slotIndex >= 0 && slotIndex < SLOT_COUNT && slots[slotIndex].color === block.color) {
                // Correct match
                score += 10;
                consecutiveMatches++;
                
                // Check for bonus after 5 consecutive matches
                if (consecutiveMatches === 5) {
                    score += 100; // Bonus 100 points
                    createBonusText();
                    consecutiveMatches = 0; // Reset counter
                }
                
                scoreElement.textContent = `Score: ${score}`;
                gameSpeed += SPEED_INCREASE;
                
                // Add particle effect for correct match
                createParticles(block.x + BLOCK_SIZE/2, block.y + BLOCK_SIZE/2, block.color);
            } else {
                // Wrong match - game over
                consecutiveMatches = 0; // Reset consecutive matches on error
                gameOver();
            }
            blocks.splice(i, 1);
        }
    }

    // Create new block if needed
    if (blocks.length === 0) {
        createNewBlock();
    }

    // Update particles
    updateParticles();
}

// Draw background pattern
function drawBackground() {
    // Create a static background with a subtle pattern
    
    // Draw a light gradient background first
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#FFF5F5');
    bgGradient.addColorStop(1, '#F7F0FF');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw waffle pattern
    ctx.strokeStyle = 'rgba(210, 180, 140, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 20; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 20; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Add a few sprinkles (static positions)
    ctx.globalAlpha = 0.2;
    
    // Define fixed sprinkle positions for consistency
    const sprinkles = [
        {x: 50, y: 70, color: '#FF6B6B', size: 3},
        {x: 150, y: 120, color: '#4ECB71', size: 4},
        {x: 250, y: 90, color: '#4D96FF', size: 3},
        {x: 350, y: 150, color: '#FFD93D', size: 4},
        {x: 100, y: 200, color: '#FF8FD2', size: 3},
        {x: 300, y: 250, color: '#FF6B6B', size: 4},
        {x: 200, y: 300, color: '#4ECB71', size: 3},
        {x: 80, y: 350, color: '#4D96FF', size: 4},
        {x: 250, y: 400, color: '#FFD93D', size: 3},
        {x: 180, y: 450, color: '#FF8FD2', size: 4}
    ];
    
    // Draw each sprinkle
    sprinkles.forEach(s => {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalAlpha = 1.0; // Reset alpha
}

// Particle system for matching effect
let particles = [];

function createParticles(x, y, color) {
    for(let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            color: color,
            speed: Math.random() * 3 + 2,
            angle: Math.random() * Math.PI * 2,
            size: Math.random() * 4 + 2,
            life: 1
        });
    }
}

function updateParticles() {
    for(let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.life -= 0.02;
        
        if(p.life > 0) {
            ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        } else {
            particles.splice(i, 1);
        }
    }
}

// Create bonus text
function createBonusText() {
    // Get the original color of the score element
    const originalColor = scoreElement.style.color || '#FF6B6B';
    
    // Highlight the score with animation
    scoreElement.textContent = `Score: ${score} (+100 BONUS!)`;
    scoreElement.style.color = '#FFD700'; // Gold color
    scoreElement.style.fontSize = '24px'; // Slightly larger
    scoreElement.style.transition = 'all 0.2s';
    
    // Restore original style after animation
    setTimeout(() => {
        scoreElement.textContent = `Score: ${score}`;
        scoreElement.style.color = originalColor;
        scoreElement.style.fontSize = '20px';
    }, 1500);
}

// Game over
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
    
    // Add event listener for Enter key
    window.addEventListener('keydown', handleRestartKeypress);
}

// Handle Enter key press for restart
function handleRestartKeypress(e) {
    if (e.key === 'Enter' && isGameOver) {
        restartGame();
    }
}

// Restart game
function restartGame() {
    score = 0;
    gameSpeed = FALL_SPEED;
    blocks = [];
    isGameOver = false;
    consecutiveMatches = 0;
    gameOverElement.style.display = 'none';
    scoreElement.textContent = 'Score: 0';
    
    // Remove Enter key event listener
    window.removeEventListener('keydown', handleRestartKeypress);
    
    initGame();
}

// Make sure to init game only once DOM is fully loaded
window.addEventListener('DOMContentLoaded', function() {
    // Initialize the game after DOM is fully loaded
    if (!gameLoop) {
        initGame();
    }
}); 