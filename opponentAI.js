// Dio AI and Vampiric Drain
let dioAttackCooldown = 0;
let lastZaWarudoTime = 0;  // Track last time Za Warudo was used

function handleDioAI() {
  // Dio makes normal attacks at random intervals
  dioAttackCooldown--;
  if (dioAttackCooldown <= 0) {
    dioAttackCooldown = Math.floor(Math.random() * 3000); // Random cooldown from 0 to 3 seconds
    characters.aizen.health -= characters.dio.attack;  // Dio's punch or kick attack
  }

  // Dio uses Vampiric Drain once every 12 seconds
  if (!characters.dio.vampDrainCooldown) {
    characters.dio.vampDrainCooldown = true;
    characters.dio.health += 10;  // Dio heals
    characters.aizen.health -= 10;  // Aizen loses health
    setTimeout(() => {
      characters.dio.vampDrainCooldown = false;
    }, 12000);  // Cooldown for 12 seconds
  }

  // Dio's Za Warudo - Time Stop move
  const currentTime = Date.now();
  if (characters.aizen.health <= 75 && currentTime - lastZaWarudoTime > 7000) { // Minimum 7 seconds interval
    setTimeout(() => {
      alert("Dio uses Za Warudo!");
      characters.aizen.health -= 20;  // Deals damage during Za Warudo
      characters.dio.health -= 10;  // Dio takes damage too (optional, can be adjusted)
    }, 3000);  // Za Warudo lasts for 3 seconds
    lastZaWarudoTime = currentTime;  // Update the last Za Warudo time
  }
}
