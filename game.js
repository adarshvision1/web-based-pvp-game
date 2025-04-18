// Game state variables
let canvas;
let ctx;
let gameInitialized = false;
let gameLoopRunning = false;
let lastTime = 0;

// Animation variables
let bankaiAnimationTimer = 0;
const BANKAI_ANIMATION_DURATION = 1.0; // seconds

// Round transition variables
let roundEndTimer = 0;
const ROUND_END_DURATION = 2.0; // Reduced from 3.0 to 2.0 seconds
let roundWinner = "";
let gamePaused = false;

// Win tracking variables - hardcode as explicit numbers
let aizenRoundWins = 0; // Must stay as integers
let dioRoundWins = 0; // Must stay as integers
let currentRound = 1; // Must stay as integer 
const totalRounds = 3; // Fixed number of rounds

// Image assets
let backgroundImage = new Image();
let backgroundLoaded = false;

// Set up image loading
backgroundImage.onload = function() {
    backgroundLoaded = true;
    console.log("Background image loaded successfully");
};

backgroundImage.onerror = function(e) {
    console.error("Failed to load background image:", e);
};

// Path to the background image
backgroundImage.src = 'assets/arena-background.jpg';

// Simple Monad implementation
function Monad(state) {
  return {
    state,
    update(updates) {
      return Monad({ ...this.state, ...updates });
    },
    ...state,
  };
}

// Constants for game logic
const MAX_HEALTH = 125;
const NORMAL_ATTACK_DAMAGE = 5;
const SPECIAL_ATTACK_DAMAGE = 30;
const BANKAI_DAMAGE = 30;
const ZA_WARUDO_DAMAGE = 12;
const VAMPIRIC_DRAIN_DAMAGE = 15;
const NORMAL_ATTACK_RANGE = 200;
const AIZEN_DAMAGE_REDUCTION = 0.85;
const DIO_ATTACK_COOLDOWN = 1000;
const DIO_SPECIAL_ATTACK_CHANCE = 0.003;

// Initialize the game
function initGame() {
    if (gameInitialized) return;
    
    try {
        // Get canvas and context
        canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error("Canvas not found");
        
        ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        // Set canvas size
        canvas.width = 1200;
        canvas.height = 800;
        
        // Load the background image
        backgroundImage.src = 'assets/arena-background.jpg';
        
        // Hard set these to integers
        aizenRoundWins = 0;
        dioRoundWins = 0;
        currentRound = 1;
        
        // Initialize game state - use ints
        gameState = Monad({
            currentRound: 1,
            aizenWins: 0,
            dioWins: 0,
        });
        
        resetRound();
        setupEventListeners();
        
        gameInitialized = true;
        
        // Debug to ensure values are correct
        console.log("Game initialized:");
        console.log(`Round = ${currentRound}, aizen wins = ${aizenRoundWins}, dio wins = ${dioRoundWins}`);
    } catch (error) {
        console.error('Game initialization failed:', error);
    }
}

// Start the game
function startGame() {
    if (!gameInitialized || gameLoopRunning) return;
    
    gameLoopRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Stop the game
function stopGame() {
    gameLoopRunning = false;
}

// Initialize game state
function initializeGameState() {
    // Force integer values to fix any potential type issues
    gameState = Monad({
        currentRound: 1,
        aizenWins: 0,
        dioWins: 0,
    });
}

// Setup event listeners
function setupEventListeners() {
    document.addEventListener("keydown", (e) => {
        keys[e.key] = true;
    });
    
    document.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });
}

// Aizen character state as a Monad
let aizenState = Monad({
  x: 150,
  y: 550,
  width: 160,
  height: 240,
  color: "#000000", // Main black for coat
  accentColor: "#FFFFFF", // White for collar and accents
  hairColor: "#4A2F24", // Dark brown hair
  skinColor: "#FFE0BD", // Skin tone
  health: MAX_HEALTH,
  attackCooldown: false,
  kyokaCooldown: 0,
  bankaiCooldown: 0
});

// Dio character state as a Monad
let dioState = Monad({
  x: 850,
  y: 550,
  width: 180,
  height: 240,
  color: "#FFD700", // Main yellow for pants
  shirtColor: "#000000", // Black shirt
  heartColor: "#32CD32", // Green accessories
  hairColor: "#FFE135", // Bright yellow hair
  pantColor: "#DAA520", // Darker yellow for pants shading
  shoeColor: "#FFFFFF", // White shoes
  health: MAX_HEALTH,
  attackCooldown: false,
  zaWarudoCooldown: 0,
  vampiricCooldown: 0
});

// Global state for key presses, cooldown messages, etc.
let keys = {};
let cooldownMessage = "";
let cooldownTimer = 0;
let moveBanner = "";
let moveBannerTimer = 0;
let timeStopTimer = 0;
const TIME_STOP_DURATION = 3.0; // increased to 3 seconds

// Animation states
let aizenFlameTimer = 0;
let dioFlameTimer = 0;
let aizenAttackTimer = 0;
let dioAttackTimer = 0;
const FLAME_DURATION = 1.0; // seconds
const ATTACK_DURATION = 0.3; // seconds

// Add global state for rounds and scores
let gameState = Monad({
  currentRound: 1,
  aizenWins: 0,
  dioWins: 0,
});

// Draw functions
function drawCharacter(char) {
  if (char === aizenState) {
    drawAizen(char);
  } else {
    drawDio(char);
  }
}

function drawAizen(char) {
  ctx.lineWidth = 2;
  
  // Draw the long flowing black coat with detailed lining
  ctx.fillStyle = char.color;
  ctx.beginPath();
  // Main coat body - wider at bottom with flowing look
  ctx.moveTo(char.x + char.width/2 - 45, char.y + 60);
  ctx.lineTo(char.x + char.width/2 - 70, char.y + char.height);
  ctx.lineTo(char.x + char.width/2 + 70, char.y + char.height);
  ctx.lineTo(char.x + char.width/2 + 45, char.y + 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw inner coat lining with more detail
  ctx.fillStyle = "#1A1A1A";
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 40, char.y + 65);
  ctx.lineTo(char.x + char.width/2 - 65, char.y + char.height - 5);
  ctx.lineTo(char.x + char.width/2 + 65, char.y + char.height - 5);
  ctx.lineTo(char.x + char.width/2 + 40, char.y + 65);
  ctx.closePath();
  ctx.fill();
  
  // Add coat details - buttons and trim
  ctx.strokeStyle = "#AAAAAA";
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2, char.y + 65);
  ctx.lineTo(char.x + char.width/2, char.y + char.height - 5);
  ctx.stroke();
  
  // Add coat buttons
  ctx.fillStyle = "#FFFFFF";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(char.x + char.width/2, char.y + 80 + i * 30, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Draw the distinctive white collar/shoulder piece with more detail
  ctx.fillStyle = char.accentColor;
  // Left wing with better curve
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 40, char.y + 60);
  ctx.quadraticCurveTo(
    char.x + char.width/2 - 60, char.y + 40,
    char.x + char.width/2 - 75, char.y + 50
  );
  ctx.quadraticCurveTo(
    char.x + char.width/2 - 70, char.y + 60,
    char.x + char.width/2 - 60, char.y + 70
  );
  ctx.fill();
  ctx.stroke();

  // Right wing with better curve
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 40, char.y + 60);
  ctx.quadraticCurveTo(
    char.x + char.width/2 + 60, char.y + 40,
    char.x + char.width/2 + 75, char.y + 50
  );
  ctx.quadraticCurveTo(
    char.x + char.width/2 + 70, char.y + 60,
    char.x + char.width/2 + 60, char.y + 70
  );
  ctx.fill();
  ctx.stroke();

  // Center piece of collar with better shape
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 40, char.y + 60);
  ctx.quadraticCurveTo(
    char.x + char.width/2, char.y + 40,
    char.x + char.width/2 + 40, char.y + 60
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw body under coat with more definition
  ctx.fillStyle = "#2A2A2A"; // Dark gray for body suit
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 20, char.y + 60);
  ctx.lineTo(char.x + char.width/2 - 25, char.y + 100);
  ctx.lineTo(char.x + char.width/2 + 25, char.y + 100);
  ctx.lineTo(char.x + char.width/2 + 20, char.y + 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw head with more detailed jawline
  ctx.fillStyle = char.skinColor;
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 15, char.y + 20);
  ctx.quadraticCurveTo(
    char.x + char.width/2 - 20, char.y + 30,
    char.x + char.width/2 - 15, char.y + 45
  );
  ctx.quadraticCurveTo(
    char.x + char.width/2, char.y + 50,
    char.x + char.width/2 + 15, char.y + 45
  );
  ctx.quadraticCurveTo(
    char.x + char.width/2 + 20, char.y + 30,
    char.x + char.width/2 + 15, char.y + 20
  );
  ctx.quadraticCurveTo(
    char.x + char.width/2, char.y + 15,
    char.x + char.width/2 - 15, char.y + 20
  );
  ctx.fill();
  ctx.stroke();

  // Draw rectangular eyepatch
  ctx.fillStyle = "#000000";
  ctx.fillRect(char.x + char.width/2 - 15, char.y + 25, 12, 7);
  ctx.strokeRect(char.x + char.width/2 - 15, char.y + 25, 12, 7);

  // Draw swept-back brown hair with better style
  // Base hair volume
  ctx.fillStyle = char.hairColor;
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 15, char.y + 20);
  // Left side curve
  ctx.bezierCurveTo(
    char.x + char.width/2 - 25, char.y + 15,
    char.x + char.width/2 - 30, char.y + 10,
    char.x + char.width/2 - 25, char.y + 5
  );
  // Top curve
  ctx.bezierCurveTo(
    char.x + char.width/2 - 15, char.y,
    char.x + char.width/2 + 15, char.y,
    char.x + char.width/2 + 25, char.y + 5
  );
  // Right side curve
  ctx.bezierCurveTo(
    char.x + char.width/2 + 30, char.y + 10,
    char.x + char.width/2 + 25, char.y + 15,
    char.x + char.width/2 + 15, char.y + 20
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hair highlights
  ctx.strokeStyle = "#6B4A2F";
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 6;
    ctx.beginPath();
    ctx.moveTo(char.x + char.width/2 + offset, char.y + 15);
    ctx.quadraticCurveTo(
      char.x + char.width/2 + offset + (offset > 0 ? 5 : -5),
      char.y + 10,
      char.x + char.width/2 + offset + (offset > 0 ? 3 : -3),
      char.y + 5
    );
    ctx.stroke();
  }

  // Draw face features with more detail
  ctx.fillStyle = "#000000";
  // Calm, confident eye
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 3, char.y + 28);
  ctx.lineTo(char.x + char.width/2 + 10, char.y + 28);
  ctx.stroke();
  
  // Slight smirk
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 8, char.y + 38);
  ctx.quadraticCurveTo(
    char.x + char.width/2,
    char.y + 40,
    char.x + char.width/2 + 10,
    char.y + 38
  );
  ctx.stroke();

  // Draw arms with enhanced detail
  if (aizenAttackTimer > 0) {
    // Attacking animation with motion blur
    const swingAngle = (1 - aizenAttackTimer / ATTACK_DURATION) * Math.PI / 2;
    ctx.save();
    ctx.translate(char.x + char.width/2, char.y + 60);
    ctx.rotate(swingAngle);
    
    // Draw arm with shading
    ctx.fillStyle = char.color;
    ctx.fillRect(-10, -5, 50, 10);
    ctx.strokeRect(-10, -5, 50, 10);
    
    // Draw white glove with details
    ctx.fillStyle = char.accentColor;
    ctx.fillRect(40, -8, 15, 16);
    ctx.strokeRect(40, -8, 15, 16);
    
    // Add glove details
    ctx.beginPath();
    ctx.moveTo(45, -8);
    ctx.lineTo(45, 8);
    ctx.stroke();
    
    // Draw sword with better details
    // Blade
    ctx.fillStyle = "silver";
    ctx.fillRect(55, -2, 60, 4);
    ctx.strokeRect(55, -2, 60, 4);
    
    // Handle
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(45, -4, 10, 8);
    ctx.strokeRect(45, -4, 10, 8);
    
    // Guard
    ctx.fillStyle = "gold";
    ctx.fillRect(53, -6, 4, 12);
    ctx.strokeRect(53, -6, 4, 12);
    
    // Motion blur
    ctx.beginPath();
    ctx.moveTo(55, -2);
    ctx.lineTo(115, -2);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 20;
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    
    ctx.restore();
  } else {
    // Normal pose - arms with better positioning
    ctx.fillStyle = char.color;
    // Left arm
    ctx.fillRect(char.x + char.width/2 - 45, char.y + 60, 15, 40);
    ctx.strokeRect(char.x + char.width/2 - 45, char.y + 60, 15, 40);
    
    // Right arm
    ctx.fillRect(char.x + char.width/2 + 30, char.y + 60, 15, 40);
    ctx.strokeRect(char.x + char.width/2 + 30, char.y + 60, 15, 40);
    
    ctx.fillStyle = char.accentColor;
    // Left glove with details
    ctx.fillRect(char.x + char.width/2 - 45, char.y + 100, 15, 16);
    ctx.strokeRect(char.x + char.width/2 - 45, char.y + 100, 15, 16);
    
    // Right glove with details
    ctx.fillRect(char.x + char.width/2 + 30, char.y + 100, 15, 16);
    ctx.strokeRect(char.x + char.width/2 + 30, char.y + 100, 15, 16);
    
    // Add glove details
    ctx.beginPath();
    ctx.moveTo(char.x + char.width/2 - 40, char.y + 100);
    ctx.lineTo(char.x + char.width/2 - 40, char.y + 116);
    ctx.moveTo(char.x + char.width/2 + 35, char.y + 100);
    ctx.lineTo(char.x + char.width/2 + 35, char.y + 116);
    ctx.stroke();
  }
}

// Helper function to draw arms
function drawArm(char, xOffset, rotation) {
  ctx.save();
  ctx.translate(char.x + char.width/2, char.y + 80);
  ctx.rotate(rotation);
  ctx.fillStyle = char.shirtColor;
  ctx.fillRect(xOffset - 10, -10, 20, 40);
  ctx.strokeRect(xOffset - 10, -10, 20, 40);
  ctx.restore();
}

// Helper function to draw hearts
function drawHeart(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.quadraticCurveTo(x, y, x - size / 4, y);
  ctx.quadraticCurveTo(x - size / 2, y, x - size / 2, y + size / 4);
  ctx.quadraticCurveTo(x - size / 2, y + size / 2, x, y + size);
  ctx.quadraticCurveTo(x + size / 2, y + size / 2, x + size / 2, y + size / 4);
  ctx.quadraticCurveTo(x + size / 2, y, x + size / 4, y);
  ctx.quadraticCurveTo(x, y, x, y + size / 4);
  ctx.fill();
  ctx.stroke();
}

// Helper function to draw enhanced arms
function drawEnhancedArm(char, xOffset, rotation) {
  ctx.save();
  ctx.translate(char.x + char.width/2, char.y + 80);
  ctx.rotate(rotation);
  
  // Arm with muscle definition
  ctx.fillStyle = char.shirtColor;
  ctx.fillRect(xOffset - 10, -10, 20, 40);
  ctx.strokeRect(xOffset - 10, -10, 20, 40);
  
  // Muscle highlights
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(xOffset - 5, -5);
  ctx.lineTo(xOffset - 5, 25);
  ctx.stroke();
  
  ctx.strokeStyle = "#000000";
  ctx.restore();
}

function drawDio(char) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000000";

  // Draw legs with shading and highlights
  // Left leg
  ctx.fillStyle = char.pantColor;
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 30, char.y + 120);
  ctx.lineTo(char.x + char.width/2 - 40, char.y + 220);
  ctx.lineTo(char.x + char.width/2 - 10, char.y + 220);
  ctx.lineTo(char.x + char.width/2 - 5, char.y + 120);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 5, char.y + 120);
  ctx.lineTo(char.x + char.width/2 + 10, char.y + 220);
  ctx.lineTo(char.x + char.width/2 + 40, char.y + 220);
  ctx.lineTo(char.x + char.width/2 + 30, char.y + 120);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Add highlights to pants
  ctx.fillStyle = "#FFE135";
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 25, char.y + 120);
  ctx.lineTo(char.x + char.width/2 - 35, char.y + 220);
  ctx.lineTo(char.x + char.width/2 - 15, char.y + 220);
  ctx.lineTo(char.x + char.width/2 - 10, char.y + 120);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 15, char.y + 120);
  ctx.lineTo(char.x + char.width/2 + 20, char.y + 220);
  ctx.lineTo(char.x + char.width/2 + 35, char.y + 220);
  ctx.lineTo(char.x + char.width/2 + 25, char.y + 120);
  ctx.closePath();
  ctx.fill();

  // Draw shoes with detail
  ctx.fillStyle = char.shoeColor;
  // Left shoe
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 40, char.y + 220);
  ctx.lineTo(char.x + char.width/2 - 45, char.y + 235);
  ctx.lineTo(char.x + char.width/2 - 5, char.y + 235);
  ctx.lineTo(char.x + char.width/2 - 10, char.y + 220);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right shoe
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 10, char.y + 220);
  ctx.lineTo(char.x + char.width/2 + 5, char.y + 235);
  ctx.lineTo(char.x + char.width/2 + 45, char.y + 235);
  ctx.lineTo(char.x + char.width/2 + 40, char.y + 220);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw black shirt with gold trim
  ctx.fillStyle = char.shirtColor;
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 30, char.y + 60);
  ctx.lineTo(char.x + char.width/2 - 30, char.y + 120);
  ctx.lineTo(char.x + char.width/2 + 30, char.y + 120);
  ctx.lineTo(char.x + char.width/2 + 30, char.y + 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Add gold trim to shirt
  ctx.strokeStyle = char.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 30, char.y + 70);
  ctx.lineTo(char.x + char.width/2 + 30, char.y + 70);
  ctx.stroke();
  ctx.lineWidth = 2;

  // Draw green heart accessories with shine
  // Belt
  ctx.fillStyle = char.heartColor;
  drawHeart(char.x + char.width/2, char.y + 120, 15);
  
  // Add shine to heart
  ctx.fillStyle = "#7CFC00";
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 2, char.y + 115);
  ctx.lineTo(char.x + char.width/2 - 5, char.y + 120);
  ctx.lineTo(char.x + char.width/2 - 2, char.y + 125);
  ctx.closePath();
  ctx.fill();
  
  // Knee accessories
  drawHeart(char.x + char.width/2 - 25, char.y + 180, 12);
  drawHeart(char.x + char.width/2 + 25, char.y + 180, 12);
  
  // Head accessory
  ctx.fillStyle = char.heartColor;
  ctx.fillRect(char.x + char.width/2 - 25, char.y + 30, 50, 8);

  // Draw head with more detail - UPDATED: less sun-like face
  ctx.fillStyle = "#FFE0BD";
  ctx.beginPath();
  ctx.arc(char.x + char.width/2, char.y + 45, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw updated hairstyle - less spiky/sun-like
  ctx.fillStyle = char.hairColor;
  
  // Draw more defined hair with less spikes
  // Main hair top - slicked back style
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 20, char.y + 40);
  ctx.lineTo(char.x + char.width/2 - 22, char.y + 30);
  ctx.lineTo(char.x + char.width/2 - 10, char.y + 20);
  ctx.lineTo(char.x + char.width/2 + 10, char.y + 20);
  ctx.lineTo(char.x + char.width/2 + 22, char.y + 30);
  ctx.lineTo(char.x + char.width/2 + 20, char.y + 40);
  ctx.closePath();
  ctx.fill();
  
  // Add some hair details - swept back look
  for (let i = 0; i < 3; i++) {
    const xOffset = (i - 1) * 12;
    ctx.beginPath();
    ctx.moveTo(char.x + char.width/2 + xOffset, char.y + 25);
    ctx.lineTo(char.x + char.width/2 + xOffset + 5, char.y + 15);
    ctx.stroke();
  }
  
  // Side hair
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 20, char.y + 40);
  ctx.lineTo(char.x + char.width/2 - 25, char.y + 55);
  ctx.lineTo(char.x + char.width/2 - 20, char.y + 60);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 20, char.y + 40);
  ctx.lineTo(char.x + char.width/2 + 25, char.y + 55);
  ctx.lineTo(char.x + char.width/2 + 20, char.y + 60);
  ctx.closePath();
  ctx.fill();

  // Draw face features with more detail - updated to be less sun-like
  ctx.fillStyle = "#000000";
  
  // Eyes - more detailed and intimidating
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 12, char.y + 40);
  ctx.lineTo(char.x + char.width/2 - 5, char.y + 40);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 5, char.y + 40);
  ctx.lineTo(char.x + char.width/2 + 12, char.y + 40);
  ctx.stroke();
  
  // Eyebrows - angry expression
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 12, char.y + 36);
  ctx.lineTo(char.x + char.width/2 - 5, char.y + 38);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 5, char.y + 38);
  ctx.lineTo(char.x + char.width/2 + 12, char.y + 36);
  ctx.stroke();
  
  // Smirk with vampire teeth
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 8, char.y + 50);
  ctx.lineTo(char.x + char.width/2 - 2, char.y + 53);
  ctx.lineTo(char.x + char.width/2, char.y + 50);
  ctx.lineTo(char.x + char.width/2 + 2, char.y + 53);
  ctx.lineTo(char.x + char.width/2 + 8, char.y + 50);
  ctx.stroke();
  
  // Draw small fangs
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 - 5, char.y + 50);
  ctx.lineTo(char.x + char.width/2 - 3, char.y + 55);
  ctx.lineTo(char.x + char.width/2 - 1, char.y + 50);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(char.x + char.width/2 + 1, char.y + 50);
  ctx.lineTo(char.x + char.width/2 + 3, char.y + 55);
  ctx.lineTo(char.x + char.width/2 + 5, char.y + 50);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw arms with more detail
  if (dioAttackTimer > 0) {
    // Punching animation with more detail
    const punchOffset = (1 - dioAttackTimer / ATTACK_DURATION) * 40;
    
    // Back arm
    ctx.fillStyle = char.shirtColor;
    drawArm(char, -30, 0);
    
    // Punching arm
    ctx.save();
    ctx.translate(char.x + char.width/2, char.y + 80);
    ctx.rotate(Math.PI * 0.2);
    ctx.fillStyle = char.shirtColor;
    ctx.fillRect(0, -10, 40 + punchOffset, 20);
    ctx.strokeRect(0, -10, 40 + punchOffset, 20);
    ctx.restore();

    // Punch effect
    ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
    ctx.lineWidth = 3;
    const effectX = char.x + char.width/2 + 40 + punchOffset;
    const effectY = char.y + 80;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(effectX, effectY);
      ctx.lineTo(
        effectX + Math.cos(angle) * 20,
        effectY + Math.sin(angle) * 20
      );
      ctx.stroke();
    }
  } else {
    // Normal pose
    drawArm(char, -30, 0);
    drawArm(char, 30, 0);
  }
}

function drawHealthBar(char, x, y) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, 300, 30); // Increased from 200, 20
  ctx.fillStyle = "green";
  ctx.fillRect(x, y, (char.health / MAX_HEALTH) * 300, 30);
}

function drawCooldownMessage() {
  if (cooldownTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(canvas.width / 2 - 200, canvas.height - 80, 400, 60); // Increased size
    ctx.fillStyle = "red";
    ctx.font = "24px monospace"; // Increased from 18px
    ctx.fillText(
      cooldownMessage,
      canvas.width / 2 - ctx.measureText(cooldownMessage).width / 2,
      canvas.height - 45
    );
  }
}

function drawMoveBanner() {
  if (moveBannerTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 70, 400, 140); // Increased size
    ctx.fillStyle = "white";
    ctx.font = "48px Impact"; // Increased from 32px
    ctx.fillText(
      moveBanner,
      canvas.width / 2 - ctx.measureText(moveBanner).width / 2,
      canvas.height / 2 + 15
    );
  }
}

// Draw flame effects
function drawFlameEffect(x, y, width, height, color, intensity) {
    // Draw multiple layers of expanding circles
    const numLayers = 3;
    const baseSize = width * 1.5;
    
    for (let layer = 0; layer < numLayers; layer++) {
        const size = baseSize * (1 + layer * 0.3);
        const alpha = intensity * (0.3 - layer * 0.1);
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace('0.8', alpha.toString());
        ctx.fill();
        
        // Draw some random flame-like shapes
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const flameLength = size * (0.8 + Math.random() * 0.4);
            const flameWidth = size * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                x + Math.cos(angle) * flameWidth,
                y + Math.sin(angle) * flameWidth,
                x + Math.cos(angle) * flameLength,
                y + Math.sin(angle) * flameLength
            );
            ctx.strokeStyle = color.replace('0.8', (alpha * 0.8).toString());
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

function drawKyokaEffect(x, y, intensity) {
    // Draw expanding purple circles
    const numCircles = 8; // Increased from 5
    const baseSize = canvas.width * 0.75; // Now covers 3/4 of canvas width
    
    for (let i = 0; i < numCircles; i++) {
        const size = baseSize * (1 + i * 0.3) * intensity;
        const alpha = (1 - i * 0.15) * intensity;
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(128, 0, 128, ${alpha})`;
        ctx.lineWidth = 5; // Increased from 3
        ctx.stroke();
        
        // Draw inner glow
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(128, 0, 128, ${alpha * 0.4})`; // Increased opacity
        ctx.fill();
    }
    
    // Draw illusionary particles
    for (let i = 0; i < 100; i++) { // Increased from 30
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * baseSize * intensity;
        const size = Math.random() * 6 + 3; // Increased size
        
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(128, 0, 128, ${0.7 * intensity})`; // Increased opacity
        ctx.fill();
    }
    
    // Add additional wave effect
    for (let i = 0; i < 3; i++) {
        const waveSize = baseSize * (0.5 + i * 0.3) * intensity;
        const waveAlpha = (0.3 - i * 0.1) * intensity;
        
        ctx.beginPath();
        ctx.arc(x, y, waveSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 0, 200, ${waveAlpha})`; // Lighter purple
        ctx.lineWidth = 8;
        ctx.stroke();
  }
}

// Update the UI to display round and scores
function drawUI() {
  ctx.font = "24px monospace";
  ctx.fillStyle = "lightblue";
  ctx.fillText(`Round: ${Math.floor(currentRound)} of ${Math.floor(totalRounds)}`, canvas.width / 2 - 90, 40);
  
  ctx.fillText(`Aizen Wins: ${Math.floor(aizenRoundWins)}`, 70, 70);
  ctx.fillText(`DIO Wins: ${Math.floor(dioRoundWins)}`, canvas.width - 200, 70);
  ctx.fillText(`Kyoka: ${Math.max(0, aizenState.kyokaCooldown).toFixed(1)}s`, 70, 120);
  ctx.fillText(`Bankai: ${Math.max(0, aizenState.bankaiCooldown).toFixed(1)}s`, 70, 150);
}

// Handle player movement (Aizen)
function handleMovement() {
  if (timeStopTimer <= 0 && !gamePaused) {
    if (keys["ArrowLeft"]) aizenState = aizenState.update({ x: Math.max(80, aizenState.x - 10) }); // Increased speed and boundary
    if (keys["ArrowRight"]) aizenState = aizenState.update({ x: Math.min(canvas.width - 240, aizenState.x + 10) });
    if (keys["ArrowUp"]) aizenState = aizenState.update({ y: Math.max(250, aizenState.y - 10) }); // Adjusted min height
    if (keys["ArrowDown"]) aizenState = aizenState.update({ y: Math.min(canvas.height - 240, aizenState.y + 10) });
  }
}

// Handle attacks (Aizen)
function handleAttack() {
  if (gamePaused) return; // Don't handle attacks when game is paused
  
  if (keys[" "] && !aizenState.attackCooldown) {
    aizenState = aizenState.update({ attackCooldown: true });
    aizenAttackTimer = ATTACK_DURATION; // Start attack animation
    if (Math.abs(aizenState.x - dioState.x) < NORMAL_ATTACK_RANGE) {
      dioState = dioState.update({ health: dioState.health - (NORMAL_ATTACK_DAMAGE * AIZEN_DAMAGE_REDUCTION) });
      const attackSound = new Audio('attack.mp3');
      attackSound.play();
    }
    setTimeout(() => {
      aizenState = aizenState.update({ attackCooldown: false });
    }, 500);
  }
}

// Handle special moves (Aizen)
function handleSpecials() {
  if (gamePaused) return; // Don't handle specials when game is paused
  
  if (timeStopTimer > 0) {
      showCooldownMessage("ZA WARUDO! Cannot use special moves!");
      return;
  }

  if (keys["q"]) {
    if (aizenState.kyokaCooldown <= 0) {
            dioState = dioState.update({ health: dioState.health - (SPECIAL_ATTACK_DAMAGE * AIZEN_DAMAGE_REDUCTION) });
      aizenState = aizenState.update({ kyokaCooldown: 10 });
      showMoveBanner("Kyoka Suigetsu");
            aizenFlameTimer = FLAME_DURATION;
    } else {
      showCooldownMessage("Kyoka Suigetsu is cooling down");
    }
  }

  if (keys["z"]) {
    if (aizenState.bankaiCooldown <= 0) {
            dioState = dioState.update({ health: dioState.health - (BANKAI_DAMAGE * AIZEN_DAMAGE_REDUCTION) });
      aizenState = aizenState.update({ bankaiCooldown: 15 });
      showMoveBanner("BANKAI!");
            aizenFlameTimer = FLAME_DURATION;
            bankaiAnimationTimer = BANKAI_ANIMATION_DURATION; // Start the bankai animation
    } else {
      showCooldownMessage("Bankai is cooling down");
    }
  }
}

function showCooldownMessage(msg) {
    if (timeStopTimer > 0) {
        cooldownMessage = "";
        cooldownTimer = 0;
    } else {
  cooldownMessage = msg;
  cooldownTimer = 2;
    }
}

function showMoveBanner(text) {
  moveBanner = text;
  moveBannerTimer = 1.5;
}

// Dio AI logic
function dioAI(deltaTime) {
  if (gamePaused) return; // Don't run AI when game is paused
  
  if (Math.abs(dioState.x - aizenState.x) > NORMAL_ATTACK_RANGE - 30) {
    dioState = dioState.update({ x: dioState.x + (dioState.x > aizenState.x ? -4 : 4) });
  } else if (!dioState.attackCooldown) {
    dioState = dioState.update({ attackCooldown: true });
    dioAttackTimer = ATTACK_DURATION;
    aizenState = aizenState.update({ health: aizenState.health - NORMAL_ATTACK_DAMAGE });
    setTimeout(() => {
      dioState = dioState.update({ attackCooldown: false });
    }, DIO_ATTACK_COOLDOWN);
  }

  // Prevent using other special moves if Za Warudo is active
  if (timeStopTimer > 0) {
    return; // Skip using other powers when Za Warudo is active
  }

  if (dioState.zaWarudoCooldown <= 0 && Math.random() < DIO_SPECIAL_ATTACK_CHANCE) {
    aizenState = aizenState.update({ health: aizenState.health - ZA_WARUDO_DAMAGE });
    dioState = dioState.update({ zaWarudoCooldown: 12 });
    showMoveBanner("Za Warudo!");
    dioFlameTimer = FLAME_DURATION;
    timeStopTimer = TIME_STOP_DURATION;
    showCooldownMessage("ZA WARUDO! Cannot move for 3 seconds!");
  }

  if (dioState.vampiricCooldown <= 0 && Math.random() < DIO_SPECIAL_ATTACK_CHANCE) {
    aizenState = aizenState.update({ health: aizenState.health - VAMPIRIC_DRAIN_DAMAGE });
    dioState = dioState.update({ 
      health: Math.min(dioState.health + 8, MAX_HEALTH),
      vampiricCooldown: 10 
    });
    showMoveBanner("Vampiric Drain");
    dioFlameTimer = FLAME_DURATION;
  }
}

// Draw function for Bankai sword piercing effect coming in a cross/diagonal way
function drawBankaiEffect() {
  if (bankaiAnimationTimer <= 0) return;
  
  try {
    const progress = 1 - (bankaiAnimationTimer / BANKAI_ANIMATION_DURATION);
    
    // Calculate sword position - moves from top-right to bottom-left (cross/diagonal)
    const endX = dioState.x + dioState.width/2;
    const endY = dioState.y + 80;
    const startX = endX + 300; // Start from right side
    const startY = -50; // Start from above the screen
    
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;
    
    // Draw a subtle beam of light following the diagonal path
    const beamGradient = ctx.createLinearGradient(
      startX, startY,
      currentX, currentY
    );
    beamGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    beamGradient.addColorStop(0.5, "rgba(200, 200, 255, 0.1)");
    beamGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX - 20, currentY - 20);
    ctx.lineTo(currentX + 20, currentY - 20);
    ctx.closePath();
    ctx.fillStyle = beamGradient;
    ctx.fill();
    
    // Draw a second crossing sword from top-left to bottom-right if we're halfway through the animation
    if (progress > 0.5) {
      const secondProgress = (progress - 0.5) * 2; // Normalize to 0-1 range
      
      const startX2 = endX - 300; // Start from left side
      const startY2 = -50; // Start from above the screen
      
      const currentX2 = startX2 + (endX - startX2) * secondProgress;
      const currentY2 = startY2 + (endY - startY2) * secondProgress;
      
      // Second beam of light
      const beamGradient2 = ctx.createLinearGradient(
        startX2, startY2,
        currentX2, currentY2
      );
      beamGradient2.addColorStop(0, "rgba(255, 255, 255, 0)");
      beamGradient2.addColorStop(0.5, "rgba(200, 200, 255, 0.1)");
      beamGradient2.addColorStop(1, "rgba(255, 255, 255, 0.2)");
      
      ctx.beginPath();
      ctx.moveTo(startX2, startY2);
      ctx.lineTo(currentX2 - 20, currentY2 - 20);
      ctx.lineTo(currentX2 + 20, currentY2 - 20);
      ctx.closePath();
      ctx.fillStyle = beamGradient2;
      ctx.fill();
      
      // Draw the second flying sword
      ctx.save();
      
      // Calculate angle for the sword to point along the diagonal
      const angle2 = Math.atan2(endY - startY2, endX - startX2);
      ctx.translate(currentX2, currentY2);
      ctx.rotate(angle2);
      
      // Draw realistic katana for second sword
      drawRealisticKatana(0, 0, 'blue');
      
      ctx.restore();
    }
    
    // Draw the first flying sword
    ctx.save();
    
    // Calculate angle for the sword to point along the diagonal
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.translate(currentX, currentY);
    ctx.rotate(angle);
    
    // Draw realistic katana for first sword
    drawRealisticKatana(0, 0, 'red');
    
    ctx.restore();
    
    // If the swords have reached Dio, show piercing effect
    if (progress >= 0.95) {
      // Blood splatter effect with physics
      for (let i = 0; i < 25; i++) {
        const splatterSize = 1 + Math.random() * 5;
        // More blood in the direction of sword movement
        const angleOffset = Math.random() * Math.PI - Math.PI/2;
        const angle = Math.atan2(endY - startY, endX - startX) + angleOffset;
        const speed = 10 + Math.random() * 30;
        const distance = speed * (i % 5 * 0.05 + 0.8);
        
        const splatterX = endX + Math.cos(angle) * distance;
        const splatterY = endY + Math.sin(angle) * distance;
        
        // Gradient for more realistic blood droplets
        const bloodGradient = ctx.createRadialGradient(
          splatterX, splatterY, 0,
          splatterX, splatterY, splatterSize
        );
        bloodGradient.addColorStop(0, "rgba(180, 0, 0, 0.9)");
        bloodGradient.addColorStop(0.7, "rgba(120, 0, 0, 0.8)");
        bloodGradient.addColorStop(1, "rgba(100, 0, 0, 0.1)");
        
        ctx.beginPath();
        ctx.arc(splatterX, splatterY, splatterSize, 0, Math.PI * 2);
        ctx.fillStyle = bloodGradient;
        ctx.fill();
        
        // Add elongated blood trails for larger droplets
        if (splatterSize > 3.5) {
          const trailLength = splatterSize * 3;
          ctx.beginPath();
          ctx.moveTo(splatterX, splatterY);
          ctx.lineTo(
            splatterX + Math.cos(angle) * trailLength,
            splatterY + Math.sin(angle) * trailLength
          );
          ctx.strokeStyle = "rgba(120, 0, 0, 0.5)";
          ctx.lineWidth = splatterSize / 2;
          ctx.stroke();
        }
      }
      
      // Impact flash
      const flashGradient = ctx.createRadialGradient(
        endX, endY, 0,
        endX, endY, 60
      );
      flashGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      flashGradient.addColorStop(0.3, "rgba(255, 200, 200, 0.5)");
      flashGradient.addColorStop(1, "rgba(255, 100, 100, 0)");
      
      ctx.beginPath();
      ctx.arc(endX, endY, 60, 0, Math.PI * 2);
      ctx.fillStyle = flashGradient;
      ctx.fill();
      
      // Cross-shaped impact lines
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const impactAngle = (i / 8) * Math.PI * 2;
        const impactLength = 25 + Math.random() * 15;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX + Math.cos(impactAngle) * impactLength,
          endY + Math.sin(impactAngle) * impactLength
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.stroke();
      }
      
      // Add an "X" shape at the point of impact with glowing effect
      ctx.lineWidth = 4;
      
      // Glow effect
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = 15;
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.moveTo(endX - 15, endY - 15);
      ctx.lineTo(endX + 15, endY + 15);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(endX + 15, endY - 15);
      ctx.lineTo(endX - 15, endY + 15);
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  } catch (error) {
    console.error("Error in Bankai animation:", error);
    // Reset animation timer to prevent further errors
    bankaiAnimationTimer = 0;
    // Clear any context transformations
    ctx.restore();
  }
}

// Helper function to draw a realistic katana
function drawRealisticKatana(x, y, colorScheme = 'red') {
  try {
    // Determine color scheme
    let bladeShineTint, tsuba, hilt;
    if (colorScheme === 'red') {
      bladeShineTint = "rgba(255, 200, 200, 0.8)";
      tsuba = "#AA3333";
      hilt = "#AA0000";
    } else { // blue
      bladeShineTint = "rgba(200, 200, 255, 0.8)";
      tsuba = "#3333AA";
      hilt = "#0000AA";
    }
    
    // Blade length and width
    const bladeLength = 90;
    const bladeWidth = 4;
    
    // Create metallic gradient for blade
    const bladeGradient = ctx.createLinearGradient(
      x, y - bladeWidth/2,
      x, y + bladeWidth/2
    );
    bladeGradient.addColorStop(0, "#CCCCCC");
    bladeGradient.addColorStop(0.5, "#FFFFFF");
    bladeGradient.addColorStop(1, "#CCCCCC");
    
    // Draw blade with slight curve
    ctx.beginPath();
    ctx.moveTo(x, y - bladeWidth/2);
    ctx.lineTo(x + bladeLength - 5, y - bladeWidth/4); // Subtle curve
    ctx.lineTo(x + bladeLength, y); // Tip
    ctx.lineTo(x + bladeLength - 5, y + bladeWidth/4); // Subtle curve
    ctx.lineTo(x, y + bladeWidth/2);
    ctx.closePath();
    ctx.fillStyle = bladeGradient;
    ctx.fill();
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Add blade shine/reflection
    ctx.beginPath();
    ctx.moveTo(x + 10, y - bladeWidth/4);
    ctx.lineTo(x + bladeLength - 10, y - bladeWidth/8);
    ctx.strokeStyle = bladeShineTint;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw blade tip
    ctx.beginPath();
    ctx.moveTo(x + bladeLength - 5, y - bladeWidth/4);
    ctx.lineTo(x + bladeLength, y);
    ctx.lineTo(x + bladeLength - 5, y + bladeWidth/4);
    ctx.closePath();
    ctx.fillStyle = bladeGradient;
    ctx.fill();
    
    // Draw tsuba (guard)
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = tsuba;
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Decorative pattern on tsuba
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Draw handle/hilt (slightly angled)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 30); // Slight angle
    
    // Handle base
    ctx.fillStyle = hilt;
    ctx.fillRect(-20, -3, 20, 6);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-20, -3, 20, 6);
    
    // Handle wrapping
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-20 + i * 4, -3);
      ctx.lineTo(-20 + i * 4, 3);
      ctx.strokeStyle = "#222222";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // Pommel
    ctx.beginPath();
    ctx.ellipse(-20, 0, 2, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#333333";
    ctx.fill();
    
    ctx.restore();
    
    // Add motion blur based on speed
    const blurLength = 40 + Math.random() * 20;
    ctx.globalAlpha = 0.3;
    
    // Motion blur gradient
    const blurGradient = ctx.createLinearGradient(
      x - blurLength, y,
      x, y
    );
    blurGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    blurGradient.addColorStop(1, colorScheme === 'red' ? "rgba(255, 100, 100, 0.5)" : "rgba(100, 100, 255, 0.5)");
    
    // Draw motion blur
    ctx.beginPath();
    ctx.moveTo(x - blurLength, y - blurWidth);
    ctx.lineTo(x, y - bladeWidth/2);
    ctx.lineTo(x, y + bladeWidth/2);
    ctx.lineTo(x - blurLength, y + blurWidth);
    ctx.closePath();
    ctx.fillStyle = blurGradient;
    ctx.fill();
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Add energy aura effect
    const glowColor = colorScheme === 'red' ? "rgba(255, 50, 50, 0.2)" : "rgba(50, 50, 255, 0.2)";
    const innerGlowColor = colorScheme === 'red' ? "rgba(255, 200, 200, 0.4)" : "rgba(200, 200, 255, 0.4)";
    
    // Outer glow
    const auraGradient = ctx.createRadialGradient(
      x + bladeLength/2, y, 0,
      x + bladeLength/2, y, 30
    );
    auraGradient.addColorStop(0, innerGlowColor);
    auraGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.beginPath();
    ctx.ellipse(x + bladeLength/2, y, bladeLength, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = auraGradient;
    ctx.fill();
    
    // Energy particles
    for (let i = 0; i < 10; i++) {
      const particleX = x + Math.random() * bladeLength;
      const particleY = y + (Math.random() * 30 - 15);
      const particleSize = 1 + Math.random() * 3;
      
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    }
  } catch (error) {
    console.error("Error in drawing katana:", error);
    // Make sure we always restore context state
    ctx.globalAlpha = 1.0;
  }
}

// Update cooldowns for both characters
function updateCooldowns(deltaTime) {
  if (gamePaused) return; // Don't update cooldowns when game is paused
  
  if (aizenState.kyokaCooldown > 0) aizenState = aizenState.update({ kyokaCooldown: aizenState.kyokaCooldown - deltaTime });
  if (aizenState.bankaiCooldown > 0) aizenState = aizenState.update({ bankaiCooldown: aizenState.bankaiCooldown - deltaTime });
  if (dioState.zaWarudoCooldown > 0) dioState = dioState.update({ zaWarudoCooldown: dioState.zaWarudoCooldown - deltaTime });
  if (dioState.vampiricCooldown > 0) dioState = dioState.update({ vampiricCooldown: dioState.vampiricCooldown - deltaTime });
  if (cooldownTimer > 0) cooldownTimer -= deltaTime;
  if (moveBannerTimer > 0) moveBannerTimer -= deltaTime;
  if (aizenFlameTimer > 0) aizenFlameTimer -= deltaTime;
  if (dioFlameTimer > 0) dioFlameTimer -= deltaTime;
  if (aizenAttackTimer > 0) aizenAttackTimer -= deltaTime;
  if (dioAttackTimer > 0) dioAttackTimer -= deltaTime;
  if (timeStopTimer > 0) timeStopTimer -= deltaTime;
  if (bankaiAnimationTimer > 0) bankaiAnimationTimer -= deltaTime; // Update the bankai animation timer
  if (roundEndTimer > 0) roundEndTimer -= deltaTime; // Update round end timer
}

// Function to reset character states for a new round
function resetRound() {
  aizenState = Monad({
    x: 150,
    y: 550,
    width: 160,
    height: 240,
    color: "#000000",
    accentColor: "#FFFFFF",
    hairColor: "#4A2F24",
    skinColor: "#FFE0BD",
    health: MAX_HEALTH,
    attackCooldown: false,
    kyokaCooldown: 0,
    bankaiCooldown: 0
  });

  dioState = Monad({
    x: 850,
    y: 550,
    width: 180,
    height: 240,
    color: "#FFD700",
    shirtColor: "#000000",
    heartColor: "#32CD32",
    hairColor: "#FFE135",
    health: MAX_HEALTH,
    attackCooldown: false,
    zaWarudoCooldown: 0,
    vampiricCooldown: 0
  });
}

// Add a global variable to store the finished round number
let finishedRoundNumber = 0;

// Function to handle round transitions
function handleRoundEnd() {
  // Always use the actual integer variables not the Monad
  if (aizenState.health <= 0) {
    // Dio wins this round
    dioRoundWins = Math.floor(dioRoundWins) + 1; // Force pure integer addition
    roundWinner = "DIO";
  } else if (dioState.health <= 0) {
    // Aizen wins this round
    aizenRoundWins = Math.floor(aizenRoundWins) + 1; // Force pure integer addition
    roundWinner = "AIZEN";
  }

  // For debugging
  console.log(`Round ${currentRound} finished. Aizen: ${aizenRoundWins}, Dio: ${dioRoundWins}`);
  
  // Store the current round number in the global variable
  finishedRoundNumber = Math.floor(currentRound);
  
  // Start round end timer
  roundEndTimer = ROUND_END_DURATION;
  gamePaused = true;

  // Always compare as integers
  if (Math.floor(currentRound) < Math.floor(totalRounds)) {
    // Set up for next round after delay
    setTimeout(() => {
      currentRound = Math.floor(currentRound) + 1; // Force pure integer addition
      console.log(`Starting round ${currentRound}`);
      resetRound();
      gamePaused = false;
    }, ROUND_END_DURATION * 1000);
  } else {
    // Final round complete, prepare to show victory screen
    console.log("Game over, showing final result");
    
    setTimeout(() => {
      // Show appropriate victory screen based on who won more rounds
      // Always compare as integers
      if (Math.floor(aizenRoundWins) > Math.floor(dioRoundWins)) {
        // Draw special Aizen victory screen and then show alert
        gamePaused = true; // Keep game paused
        
        // Draw Aizen victory screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAizenVictory();
        
        // Show victory message after a short delay to let players see the victory screen
        setTimeout(() => {
          alert("Aizen Wins! All according to plan.");
          location.reload();
        }, 2000);
      } else if (Math.floor(dioRoundWins) > Math.floor(aizenRoundWins)) {
        // Show Dio victory alert
        alert("DIO Wins! WRYYY!");
        location.reload();
      } else {
        // Draw
        alert("It's a Draw!");
        location.reload();
      }
    }, ROUND_END_DURATION * 1000);
  }
  
  // We no longer redefine drawRoundVictoryMessage here
}

// Function to draw round victory message
function drawRoundVictoryMessage() {
  if (roundEndTimer <= 0) return;
  
  // Save the current canvas state
  ctx.save();
  
  // Create a semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw round victory text - use the stored finished round number
  ctx.font = '64px Cinzel, serif';
  ctx.fillStyle = roundWinner === "AIZEN" ? 'rgba(150, 0, 255, 1.0)' : 'rgba(255, 215, 0, 1.0)';
  ctx.textAlign = 'center';
  ctx.fillText(`${roundWinner} WINS ROUND ${finishedRoundNumber}!`, canvas.width/2, canvas.height/2 - 50);
  
  // Draw round stats
  ctx.font = '36px Cinzel, serif';
  ctx.fillStyle = '#a39161';
  ctx.fillText(`AIZEN: ${Math.floor(aizenRoundWins)}   DIO: ${Math.floor(dioRoundWins)}`, canvas.width/2, canvas.height/2 + 20);
  
  // Handle different messaging based on current round
  if (Math.floor(currentRound) < Math.floor(totalRounds)) {
    // If not the final round, show large countdown to next round
    const countdownNumber = Math.ceil(roundEndTimer);
    
    // Show "MATCH BEGINS IN" text
    ctx.font = '28px Cinzel, serif';
    ctx.fillStyle = '#c0ad7b';
    ctx.fillText(`MATCH BEGINS IN:`, canvas.width/2, canvas.height/2 + 80);
    
    // Show large countdown number
    ctx.font = '96px Impact';
    ctx.fillStyle = 'white';
    ctx.shadowColor = '#a39161';
    ctx.shadowBlur = 15;
    ctx.fillText(`${countdownNumber}`, canvas.width/2, canvas.height/2 + 180);
    ctx.shadowBlur = 0;
  } else {
    // If final round, show simple end message
    ctx.font = '28px Cinzel, serif';
    ctx.fillStyle = '#c0ad7b';
    ctx.fillText(`MATCH ENDING IN: ${Math.ceil(roundEndTimer)}`, canvas.width/2, canvas.height/2 + 100);
  }
  
  // Restore the canvas state
  ctx.restore();
}

// Function to check if either player is defeated
function checkGameOver() {
  if (aizenState.health <= 0 || dioState.health <= 0) {
    // Debug output
    console.log(`Round ended: Current round = ${currentRound}, Total rounds = ${totalRounds}`);
    console.log(`Win counts: Aizen = ${aizenRoundWins}, Dio = ${dioRoundWins}`);
    
    handleRoundEnd();
  }
}

function drawAizenVictory() {
    const time = performance.now() / 1000;
    
    // Draw throne background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw throne
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 100, canvas.height - 100);
    ctx.lineTo(canvas.width/2 - 150, canvas.height - 200);
    ctx.lineTo(canvas.width/2 + 150, canvas.height - 200);
    ctx.lineTo(canvas.width/2 + 100, canvas.height - 100);
    ctx.closePath();
    ctx.fill();
    
    // Draw throne back
    ctx.fillStyle = '#222222';
    ctx.fillRect(canvas.width/2 - 150, canvas.height - 400, 300, 200);
    
    // Draw Aizen's body
    ctx.fillStyle = '#000000';
    ctx.fillRect(canvas.width/2 - 50, canvas.height - 250, 100, 150);
    
    // Draw Aizen's head and face
    // Draw jawline
    ctx.fillStyle = '#FFE0BD';
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 25, canvas.height - 280);
    ctx.quadraticCurveTo(
        canvas.width/2 - 30, canvas.height - 290,
        canvas.width/2 - 25, canvas.height - 310
    );
    ctx.quadraticCurveTo(
        canvas.width/2, canvas.height - 330,
        canvas.width/2 + 25, canvas.height - 310
    );
    ctx.quadraticCurveTo(
        canvas.width/2 + 30, canvas.height - 290,
        canvas.width/2 + 25, canvas.height - 280
    );
    ctx.quadraticCurveTo(
        canvas.width/2, canvas.height - 270,
        canvas.width/2 - 25, canvas.height - 280
    );
    ctx.fill();

    // Draw rectangular eyepatch
    ctx.fillStyle = '#000000';
    ctx.fillRect(canvas.width/2 - 25, canvas.height - 315, 25, 15);
    
    // Draw eyepatch strap
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 25, canvas.height - 315);
    ctx.lineTo(canvas.width/2 - 35, canvas.height - 320);
    ctx.moveTo(canvas.width/2 - 25, canvas.height - 300);
    ctx.lineTo(canvas.width/2 - 35, canvas.height - 295);
    ctx.stroke();
    
    // Draw visible eye with confident expression
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 + 5, canvas.height - 308);
    ctx.quadraticCurveTo(
        canvas.width/2 + 10, canvas.height - 310,
        canvas.width/2 + 15, canvas.height - 308
    );
    ctx.stroke();
    
    // Draw confident smirk
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 10, canvas.height - 290);
    ctx.quadraticCurveTo(
        canvas.width/2, canvas.height - 285,
        canvas.width/2 + 20, canvas.height - 290
    );
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw Aizen's hair
    ctx.fillStyle = '#8B4513'; // Base brown color
    
    // Main hair volume
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 25, canvas.height - 310);
    // Left side curve
    ctx.bezierCurveTo(
        canvas.width/2 - 45, canvas.height - 330,
        canvas.width/2 - 50, canvas.height - 350,
        canvas.width/2 - 40, canvas.height - 365
    );
    // Top curve
    ctx.bezierCurveTo(
        canvas.width/2 - 20, canvas.height - 380,
        canvas.width/2 + 20, canvas.height - 380,
        canvas.width/2 + 40, canvas.height - 365
    );
    // Right side curve
    ctx.bezierCurveTo(
        canvas.width/2 + 50, canvas.height - 350,
        canvas.width/2 + 45, canvas.height - 330,
        canvas.width/2 + 25, canvas.height - 310
    );
    ctx.fill();

    // Add hair highlights
    ctx.strokeStyle = '#A0522D'; // Lighter brown for highlights
    ctx.lineWidth = 2;
    
    // Left side swept bangs
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 20, canvas.height - 310);
    ctx.bezierCurveTo(
        canvas.width/2 - 30, canvas.height - 320,
        canvas.width/2 - 35, canvas.height - 335,
        canvas.width/2 - 25, canvas.height - 350
    );
    ctx.stroke();

    // Right side swept bangs
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 + 20, canvas.height - 310);
    ctx.bezierCurveTo(
        canvas.width/2 + 30, canvas.height - 320,
        canvas.width/2 + 35, canvas.height - 335,
        canvas.width/2 + 25, canvas.height - 350
    );
    ctx.stroke();

    // Add dynamic hair strands
    for (let i = 0; i < 12; i++) {
        const baseAngle = (i / 12) * Math.PI - Math.PI/2;
        const angle = baseAngle + (Math.random() * 0.2 - 0.1); // Slight random variation
        const length = 30 + Math.random() * 20;
        const startX = canvas.width/2 + Math.cos(angle) * 20;
        const startY = canvas.height - 350 + Math.sin(angle) * 10;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Create natural-looking curve for each strand
        const controlPoint1X = startX + Math.cos(angle) * length * 0.5;
        const controlPoint1Y = startY + Math.sin(angle) * length * 0.3;
        const controlPoint2X = startX + Math.cos(angle) * length * 0.7;
        const controlPoint2Y = startY + Math.sin(angle) * length * 0.6;
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;
        
        ctx.bezierCurveTo(
            controlPoint1X, controlPoint1Y,
            controlPoint2X, controlPoint2Y,
            endX, endY
        );
        
        // Vary stroke width for more natural look
        ctx.lineWidth = 1 + Math.random();
        ctx.strokeStyle = `rgba(139, 69, 19, ${0.6 + Math.random() * 0.4})`;
        ctx.stroke();
    }

    // Add some shorter strands in front
    for (let i = 0; i < 6; i++) {
        const startX = canvas.width/2 - 20 + i * 8;
        const startY = canvas.height - 310;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
            startX - 5, startY - 10,
            startX - 8, startY - 15,
            startX - 3, startY - 20
        );
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Add some loose strands for messier look
    for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const startX = canvas.width/2 + side * (20 + Math.random() * 10);
        const startY = canvas.height - 330 - Math.random() * 20;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
            startX + side * 10, startY - 10,
            startX + side * 15, startY - 15,
            startX + side * 20, startY - 25 + Math.random() * 10
        );
        ctx.strokeStyle = `rgba(139, 69, 19, ${0.7 + Math.random() * 0.3})`;
        ctx.lineWidth = 1 + Math.random();
        ctx.stroke();
    }

    // Draw falling swords
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = (time * 200 + i * 100) % (canvas.height + 100) - 50;
        const size = Math.random() * 20 + 30;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        
        // Sword blade
        ctx.fillStyle = 'silver';
        ctx.fillRect(-size/2, -size/10, size, size/5);
        
        // Sword handle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-size/2 - 10, -size/10, 10, size/5);
        
        ctx.restore();
    }
    
    // Draw expanding purple energy waves
    const numWaves = 5;
    for (let i = 0; i < numWaves; i++) {
        const size = (canvas.width * 0.8) * (1 + Math.sin(time * 2 + i) * 0.1);
        const alpha = 0.3 - (i * 0.05);
        
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, size, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(128, 0, 128, ${alpha})`;
        ctx.lineWidth = 8;
        ctx.stroke();
    }
    
    // Draw victory text
    ctx.font = '64px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('AIZEN WINS', canvas.width/2, 100);
    ctx.font = '32px "Press Start 2P"';
    ctx.fillText('ALL ACCORDING TO PLAN', canvas.width/2, 150);
    
    // Draw floating particles
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 2;
        const alpha = Math.random() * 0.5 + 0.3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(128, 0, 128, ${alpha})`;
        ctx.fill();
    }
}

// Add the custom arena background drawing function
function drawArenaBackground(ctx, canvas) {
  // Sky gradient - dark gothic night
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a0a1a"); // Dark blue-black at top
  gradient.addColorStop(0.3, "#1a1a2e"); // Navy blue middle
  gradient.addColorStop(1, "#2a2a35"); // Lighter at horizon
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add stars and a dim moon
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6;
    const size = Math.random() * 1.5;
    const alpha = Math.random() * 0.8 + 0.2;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Blood moon (partially obscured by clouds)
  const moonGradient = ctx.createRadialGradient(
    canvas.width * 0.8, 100, 10,
    canvas.width * 0.8, 100, 50
  );
  moonGradient.addColorStop(0, "rgba(255, 50, 50, 0.8)");
  moonGradient.addColorStop(0.7, "rgba(255, 30, 30, 0.4)");
  moonGradient.addColorStop(1, "rgba(255, 0, 0, 0)");
  
  ctx.fillStyle = moonGradient;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.8, 100, 50, 0, Math.PI * 2);
  ctx.fill();
  
  // Clouds passing over moon
  ctx.fillStyle = "rgba(20, 20, 30, 0.7)";
  ctx.beginPath();
  ctx.ellipse(canvas.width * 0.8 - 10, 90, 60, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountains
  ctx.fillStyle = "#191924";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.65);
  
  // Create jagged mountain range
  let x = 0;
  while (x < canvas.width) {
    const peakHeight = Math.random() * 50 + 30;
    ctx.lineTo(x + 100, canvas.height * 0.65 - peakHeight);
    x += 100;
  }
  
  ctx.lineTo(canvas.width, canvas.height * 0.65);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
  
  // Draw a large gothic castle in background
  // Main castle silhouette - left side
  ctx.fillStyle = "#151520";
  
  // Left large tower
  ctx.beginPath();
  ctx.rect(100, canvas.height * 0.3, 80, canvas.height * 0.4);
  ctx.fill();
  
  // Tower top
  ctx.beginPath();
  ctx.moveTo(100, canvas.height * 0.3);
  ctx.lineTo(120, canvas.height * 0.25);
  ctx.lineTo(140, canvas.height * 0.25);
  ctx.lineTo(160, canvas.height * 0.25);
  ctx.lineTo(180, canvas.height * 0.3);
  ctx.fill();
  
  // Castle center structure
  ctx.beginPath();
  ctx.rect(180, canvas.height * 0.4, 200, canvas.height * 0.3);
  ctx.fill();
  
  // Right large tower
  ctx.beginPath();
  ctx.rect(380, canvas.height * 0.35, 100, canvas.height * 0.35);
  ctx.fill();
  
  // Tower top
  ctx.beginPath();
  ctx.moveTo(380, canvas.height * 0.35);
  ctx.lineTo(400, canvas.height * 0.28);
  ctx.lineTo(430, canvas.height * 0.28);
  ctx.lineTo(460, canvas.height * 0.28);
  ctx.lineTo(480, canvas.height * 0.35);
  ctx.fill();
  
  // Smaller towers
  for (let i = 0; i < 5; i++) {
    const towerX = 200 + i * 40;
    const towerHeight = canvas.height * 0.15 + Math.random() * 20;
    
    // Tower base
    ctx.fillStyle = "#151520";
    ctx.beginPath();
    ctx.rect(towerX, canvas.height * 0.4 - towerHeight, 20, towerHeight);
    ctx.fill();
    
    // Tower spire
    ctx.beginPath();
    ctx.moveTo(towerX, canvas.height * 0.4 - towerHeight);
    ctx.lineTo(towerX + 10, canvas.height * 0.4 - towerHeight - 20);
    ctx.lineTo(towerX + 20, canvas.height * 0.4 - towerHeight);
    ctx.fill();
    
    // Tower windows (lit)
    if (Math.random() > 0.5) {
      ctx.fillStyle = "rgba(255, 200, 100, 0.5)";
      ctx.beginPath();
      ctx.rect(towerX + 5, canvas.height * 0.4 - towerHeight/2, 10, 10);
      ctx.fill();
    }
  }
  
  // Castle windows
  for (let i = 0; i < 10; i++) {
    const windowX = 200 + i * 20;
    const row = Math.floor(i / 5);
    const windowY = canvas.height * 0.45 + row * 30;
    
    if (Math.random() > 0.5) {
      ctx.fillStyle = "rgba(255, 200, 100, 0.3)";
      
      // Gothic arch window
      ctx.beginPath();
      ctx.arc(windowX + 5, windowY, 5, 0, Math.PI, true);
      ctx.lineTo(windowX, windowY + 10);
      ctx.lineTo(windowX + 10, windowY + 10);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Large windows on towers
  // Left tower
  ctx.fillStyle = "rgba(255, 200, 100, 0.3)";
  ctx.beginPath();
  ctx.arc(140, canvas.height * 0.4, 15, 0, Math.PI, true);
  ctx.lineTo(125, canvas.height * 0.4 + 20);
  ctx.lineTo(155, canvas.height * 0.4 + 20);
  ctx.closePath();
  ctx.fill();
  
  // Right tower
  ctx.beginPath();
  ctx.arc(430, canvas.height * 0.45, 15, 0, Math.PI, true);
  ctx.lineTo(415, canvas.height * 0.45 + 20);
  ctx.lineTo(445, canvas.height * 0.45 + 20);
  ctx.closePath();
  ctx.fill();
  
  // Foreground castle ruins
  ctx.fillStyle = "#1a1a24";
  ctx.beginPath();
  ctx.rect(50, canvas.height - 200, 80, 120);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(200, canvas.height - 180, 50, 100);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(320, canvas.height - 220, 100, 140);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(500, canvas.height - 190, 70, 100);
  ctx.fill();
  
  // Cracked walls
  ctx.strokeStyle = "#111117";
  ctx.lineWidth = 2;
  
  // Cracks in first pillar
  ctx.beginPath();
  ctx.moveTo(60, canvas.height - 150);
  ctx.lineTo(80, canvas.height - 180);
  ctx.moveTo(80, canvas.height - 130);
  ctx.lineTo(100, canvas.height - 170);
  ctx.stroke();
  
  // Cracks in right structure
  ctx.beginPath();
  ctx.moveTo(520, canvas.height - 150);
  ctx.lineTo(550, canvas.height - 180);
  ctx.moveTo(540, canvas.height - 120);
  ctx.lineTo(510, canvas.height - 160);
  ctx.stroke();
  
  // Gothic arches in foreground
  ctx.fillStyle = "#0a0a12";
  
  // Left arch
  ctx.beginPath();
  ctx.arc(90, canvas.height - 130, 20, 0, Math.PI, true);
  ctx.lineTo(70, canvas.height - 90);
  ctx.lineTo(110, canvas.height - 90);
  ctx.closePath();
  ctx.fill();
  
  // Center arch
  ctx.beginPath();
  ctx.arc(370, canvas.height - 150, 25, 0, Math.PI, true);
  ctx.lineTo(345, canvas.height - 110);
  ctx.lineTo(395, canvas.height - 110);
  ctx.closePath();
  ctx.fill();
  
  // Right arch
  ctx.beginPath();
  ctx.arc(535, canvas.height - 140, 15, 0, Math.PI, true);
  ctx.lineTo(520, canvas.height - 110);
  ctx.lineTo(550, canvas.height - 110);
  ctx.closePath();
  ctx.fill();

  // Cracked ground
  ctx.fillStyle = "#282830";
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
  
  // Add more detailed cracks
  ctx.strokeStyle = "#181820";
  ctx.lineWidth = 2;
  for (let i = 0; i < canvas.width; i += 30) {
    if (Math.random() > 0.3) {
      const crackLength = 20 + Math.random() * 30;
      const crackOffset = Math.random() * 40 - 20;
      
      ctx.beginPath();
      ctx.moveTo(i, canvas.height - 100);
      ctx.lineTo(i + crackOffset, canvas.height - 100 + crackLength);
      
      // Branch in the crack
      if (Math.random() > 0.5) {
        ctx.moveTo(i + crackOffset / 2, canvas.height - 100 + crackLength / 2);
        ctx.lineTo(i + crackOffset + 20, canvas.height - 100 + crackLength - 10);
      }
      
      ctx.stroke();
    }
  }
  
  // Scattered stones
  for (let i = 0; i < 20; i++) {
    const stoneX = Math.random() * canvas.width;
    const stoneY = canvas.height - 40 - Math.random() * 40;
    const stoneSize = 3 + Math.random() * 8;
    
    ctx.fillStyle = "#1c1c24";
    ctx.beginPath();
    ctx.arc(stoneX, stoneY, stoneSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torches with advanced flame effects
  drawTorch(130, canvas.height - 200);
  drawTorch(370, canvas.height - 210);
  drawTorch(520, canvas.height - 180);
  
  // Distant additional torches in castle (smaller)
  drawTorch(220, canvas.height * 0.45, 0.5);
  drawTorch(320, canvas.height * 0.45, 0.5);
  drawTorch(420, canvas.height * 0.42, 0.5);
  
  // Fog effect
  ctx.fillStyle = "rgba(25, 25, 35, 0.2)";
  for (let i = 0; i < canvas.width; i += 100) {
    const fogHeight = 20 + Math.random() * 30;
    const fogY = canvas.height - 80 - Math.random() * 20;
    
    ctx.beginPath();
    ctx.ellipse(i, fogY, 100 + Math.random() * 50, fogHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Helper function for drawing torches with flickering effects
  function drawTorch(x, y, scale = 1) {
    // Torch base
    ctx.fillStyle = "#6d4c41";
    ctx.fillRect(x - 2 * scale, y, 4 * scale, 20 * scale);
    
    // Flame base
    ctx.fillStyle = "#ff6a00";
    ctx.beginPath();
    ctx.ellipse(x, y, 4 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Dynamic flame
    const flickerOffset = Math.random() * 3 * scale;
    const flickerHeight = (10 + Math.random() * 5) * scale;
    
    const flameGradient = ctx.createRadialGradient(
      x, y - flickerOffset, 1,
      x, y - flickerOffset, 12 * scale
    );
    flameGradient.addColorStop(0, "rgba(255, 255, 0, 0.9)");
    flameGradient.addColorStop(0.5, "rgba(255, 120, 0, 0.8)");
    flameGradient.addColorStop(1, "rgba(255, 50, 0, 0)");
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(x - 4 * scale, y);
    ctx.quadraticCurveTo(
      x - 2 * scale - flickerOffset, y - flickerHeight / 2,
      x, y - flickerHeight
    );
    ctx.quadraticCurveTo(
      x + 2 * scale + flickerOffset, y - flickerHeight / 2,
      x + 4 * scale, y
    );
    ctx.closePath();
    ctx.fill();
    
    // Glow effect
    if (Math.random() > 0.3) {
      ctx.fillStyle = "rgba(255, 165, 0, 0.1)";
      ctx.beginPath();
      ctx.arc(x, y, (15 + Math.random() * 10) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Game loop
function gameLoop(timestamp) {
    if (!gameLoopRunning) return;
    
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Always use our custom gothic arena background
    drawArenaBackground(ctx, canvas);
    
    // Don't update gameplay if the game is paused
    if (!gamePaused) {
        handleMovement();
        handleAttack();
        handleSpecials();
        dioAI(deltaTime);
        checkGameOver();
    }
    
    // Always update cooldowns and draw elements
    updateCooldowns(deltaTime);
    drawCharacter(aizenState);
    drawCharacter(dioState);
    drawHealthBar(aizenState, 50, 50);
    drawHealthBar(dioState, canvas.width - 350, 50);
    drawUI();
    drawCooldownMessage();
    drawMoveBanner();
    
    // Draw effects
    if (aizenFlameTimer > 0) {
        drawFlameEffect(aizenState.x + aizenState.width/2, aizenState.y, 100, 100, 'rgba(255, 0, 0, 0.8)', aizenFlameTimer/FLAME_DURATION);
    }
    if (dioFlameTimer > 0) {
        drawFlameEffect(dioState.x + dioState.width/2, dioState.y, 100, 100, 'rgba(255, 215, 0, 0.8)', dioFlameTimer/FLAME_DURATION);
    }
    
    // Draw Bankai sword piercing effect
    if (bankaiAnimationTimer > 0) {
        drawBankaiEffect();
    }
    
    // Draw Kyoka Suigetsu effect
    if (aizenState.kyokaCooldown > 9.5) {
        const intensity = (aizenState.kyokaCooldown - 9.5) * 2;
        drawKyokaEffect(aizenState.x + aizenState.width/2, aizenState.y, intensity);
    }
    
    // Draw time stop effect
    if (timeStopTimer > 0) {
        // Save the current canvas state
        ctx.save();
        
        // Reset transform to ensure proper positioning
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Create a semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw time stop particles
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Restore the canvas state
        ctx.restore();
    }
    
    // Draw round victory message if round just ended
    if (roundEndTimer > 0) {
        drawRoundVictoryMessage();
    }
    
    requestAnimationFrame(gameLoop);
}

// Export functions for external use
window.initGame = initGame;
window.startGame = startGame;
window.stopGame = stopGame;
