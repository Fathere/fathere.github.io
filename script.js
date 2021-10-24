//  by athallah faathir nugraha!!!
// localStorage.removeItem("playerCash");
// localStorage.removeItem("playerHealth");
// localStorage.removeItem("buyedHospital");
// localStorage.removeItem("buyedBank");
// localStorage.removeItem("buyedRoad");
// localStorage.removeItem("buyedOffice");
// localStorage.removeItem("buyedSchool");
// localStorage.removeItem("buyedGOR");
// localStorage.removeItem("petMagnetUpgradeLevel");
// localStorage.removeItem("songMuted");
// localStorage.removeItem("comic");

let bgSong = new Audio("sounds/bensound-ukulele.mp3");
bgSong.volume = .3;

let comicImg = new Image(934, 936);
comicImg.src = "imgs/comicsymbol.png";

let songMuted;

if (localStorage.songMuted) {
    songMuted = localStorage.songMuted == "true";
} else {
    localStorage.songMuted = "false";
    songMuted = false;
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const dpi = 1;

let deathMessage = "";

var mouseManager = {
    x : 0,
    y : 0,
    click : false
};

let intervals = {
    startMenu : undefined,
    game : undefined,
    pause : undefined,
    gameOver : undefined,
    song : undefined,
    comic : undefined,
    info : undefined,
    win : undefined
};

function fixDpi() {
    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
}

fixDpi();

resize();

var canvasRatio = canvas.height / canvas.width;
var windowRatio = window.innerHeight / window.innerWidth;

function playSound(url, volume=1, song=false) {
    const sound = new Audio(url);
    sound.volume = volume;
    sound.play();
}

class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    checkCollisionWithRect(rect) {
        // console.log(this.x < rect.x + rect.width && this.x + rect.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y);
        return this.x < rect.x + rect.width && this.x + rect.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y;
    }

    checkCollisionWithMouse(mousePos) {
        return mousePos.x < this.x + this.width && mousePos.x > this.x && mousePos.y < this.y + this.height && mousePos.y > this.y
    }

    draw(color="#ff0000") {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.stroke();
    }
}

class Coin {
    constructor(value, velocity, pos) {
        if (velocity == undefined) this.velocity = [0, 0]; else this.velocity = velocity;

        if (this.velocity[1] > 1) {
            this.pos = [Math.floor(Math.random() * canvas.width + 1), -50];
        } else {
            this.pos = [pos, 100];
        }

        this.gravityLevel = clamp(Math.random(), .1, .3);
        this.img = new Image(2670, 2670);
        this.img.src = "imgs/uang" + value.toString() + ".png";
        this.size = [50, 50];
        this.rect = new Rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        this.delete = false;
        this.value = value;
    }

    draw() {
        ctx.drawImage(this.img, this.pos[0], this.pos[1], this.size[0], this.size[1]);
    }

    update() {
        this.velocity[1] += this.gravityLevel;
        this.pos[1] += this.velocity[1];
        this.rect = new Rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        this.delete = this.rect.checkCollisionWithRect(moneybag.rect);
    }
}

class Asteroid {
    constructor() {
        this.velocity = [0, 0];
        this.gravityLevel = clamp(Math.random() * 1.2, .5, 3);
        this.img = new Image(297, 333);
        this.img.src = "imgs/batu.png";
        this.size = [40, 50];
        this.pos = [player.pos[0] + moneybag.size[0] / 2 - this.size[0] / 2, -50];
        this.rect = new Rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        this.delete = false;
        this.damage = (this.gravityLevel * 2).toFixed(1);
    }

    draw() {
        ctx.drawImage(this.img, this.pos[0], this.pos[1], this.size[0], this.size[1]);
    }

    update() {
        this.velocity[1] += this.gravityLevel;
        this.pos[1] += this.velocity[1];
        this.rect = new Rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        this.delete = this.rect.checkCollisionWithRect(moneybag.rect);
    }
}

class Healer {
    constructor() {
        this.velocity = [0, 0];
        this.gravityLevel = clamp(Math.random(), .05, .2);
        this.img = new Image(317, 238);
        this.img.src = "imgs/heal.png";
        this.size = [50, 40];
        this.pos = [Math.floor(Math.random() * canvas.width + 1), -50];
        this.rect = new Rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        this.delete = false;
        this.healLevel = (this.gravityLevel * 8).toFixed(1);
    }

    draw() {
        ctx.drawImage(this.img, this.pos[0], this.pos[1], this.size[0], this.size[1]);
    }

    update() {
        this.velocity[1] += this.gravityLevel;
        this.pos[1] += this.velocity[1];
        this.rect = new Rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        this.delete = this.rect.checkCollisionWithRect(moneybag.rect);
    }
}

class ParticleEffect {
    constructor(pos, text, color, duration, stroke, speed) {
        this.text = text;
        this.color = color;
        this.duration = duration / 20;
        this.stroke = stroke;
        this.opacity = 1.0;
        this.elapsedTime = 0;
        this.pos = pos;
        this.speed = speed;
        this.delete = false;
    }

    update() {
        this.elapsedTime += 1;
        this.opacity = 1.1 - this.elapsedTime / this.duration;
        this.pos[1] += this.speed[1];
        this.pos[0] += this.speed[0];
        this.delete = this.elapsedTime > this.duration;
    }

    draw() {
        ctx.fillStyle = this.color;
        // console.log(ctx.globalAlpha);
        ctx.textAlign = "center";
        ctx.globalAlpha = this.opacity;
        ctx.fillText(this.text, this.pos[0], this.pos[1]);
        if (this.stroke) ctx.strokeText(this.text, this.pos[0], this.pos[1]);
        ctx.globalAlpha = 1.0;
    }
}

class WP {
    constructor(img, imgSrc, pos, target, size, movementSmoothness=8) {
        this.img = img;
        this.img.src = imgSrc;
        this.pos = pos;
        this.target = target;
        this.movementSmoothness = movementSmoothness;
        this.size = size;
        this.throwTimer = Math.floor(Math.random() * 4000);
        this.cloudImg = new Image(272, 132);
        this.cloudImg.src = "imgs/awan3.png";
        this.cloudSize = [150, 75];
    }

    update() {
        this.throwTimer -= 20;

        var movement = lerp(this.target, this.pos, this.movementSmoothness);
        this.pos[0] += movement[0];
        this.pos[1] += movement[1];
    }

    draw() {
        ctx.drawImage(this.img, this.pos[0], this.pos[1], this.size[0], this.size[1]);
        ctx.drawImage(this.cloudImg, this.pos[0] - this.cloudSize[0] / 2 + this.size[0] / 2, this.pos[1] + this.cloudSize[1] / 2, this.cloudSize[0], this.cloudSize[1]);
    }
}

let closePauseRect = new Rect(493, 150, 30, 35);
let buyBuildingRect = new Rect(260, 280, 100, 100);
let buyPetRect = new Rect(260, 425, 100, 100);

let thumbnailImg;
let thumbnailText;
let thumbnailDesc;

let petText;
let petDesc;
let petImg;

let pauseMenuImg = new Image(655, 879);
pauseMenuImg.src = "imgs/pausemenu.png";

let bgManager = {
    img : new Image(600, 600),
    pos : [0, 0],
    size : [canvas.width * 1.2, canvas.height * 1.2],
    parallaxEffect : -.2
};

bgManager.img.src = "imgs/background.png";

let pauseManager = {
    pausing : false,
    pause : new Image(380, 326),
    continue : new Image(380, 326),
    width : 30,
    height : 30,
    rect : new Rect(canvas.width / 2 - 30 / 2, 30, 30, 30),
    showedImg : undefined
};

pauseManager.pause.src = "imgs/pause.png";
pauseManager.continue.src = "imgs/continue.png";
pauseManager.showedImg = pauseManager.pause;

coinValues = [50, 100, 1000];

var player = {
    pos : [100, 600],
    target : [375, 600],
    img : new Image(993, 1931),
    size : [80, 156],
    movementSmoothness : 6,
    cash : 0,
    health : 100,

    draw : function() {
        ctx.drawImage(player.img, player.pos[0], player.pos[1], player.size[0], player.size[1]);
    },

    update : function() {
        var movement = lerp(player.target, player.pos, player.movementSmoothness);
        player.pos[0] += movement[0];
        player.pos[1] += movement[1];
        player.pos[0] += 2;
    }
};

let reset = false;
let openedComics = 0;

if (localStorage.comic) {
    openedComics = parseInt(localStorage.comic);
} else {
    localStorage.comic = 0;
}

if (localStorage.playerCash) {
    if (localStorage.playerCash <= 0) {
        localStorage.playerCash = 1000;
        localStorage.playerHealth = 100;
        player.health = 100;
        reset = true;
    }

    player.cash = parseInt(localStorage.playerCash);
} else {
    localStorage.playerCash = 1000;
}

if (localStorage.playerHealth) {
    if (localStorage.playerHealth <= 0) {
        localStorage.playerHealth = 100;
        localStorage.playerCash = 1000;
        player.cash = 1000;
        reset = true;
    }

    player.health = parseFloat(localStorage.playerHealth);
} else {
    localStorage.playerHealth = 100;
}

if (localStorage.buyedRoad) {
    if (reset) {
        localStorage.buyedRoad = "false";
        localStorage.buyedHospital = "false";
        localStorage.buyedBank = "false";
        localStorage.buyedOffice = "false";
        localStorage.buyedSchool = "false";
        localStorage.buyedGOR = "false";
    }
} else {
    localStorage.buyedRoad = "false";
    localStorage.buyedHospital = "false";
    localStorage.buyedBank = "false";
    localStorage.buyedOffice = "false";
    localStorage.buyedSchool = "false";
    localStorage.buyedGOR = "false";
}

if (localStorage.petMagnetUpgradeLevel) {
    if (reset) {
        localStorage.petMagnetUpgradeLevel = 0;
    }
} else {
    localStorage.petMagnetUpgradeLevel = 0;
}

function lerp(target, currentPos, smoothness) {
    let yDistance = target[1] - currentPos[1];
    let xDistance = target[0] - currentPos[0];
    return [xDistance / smoothness, yDistance / smoothness];
}

let petMagnet = {
    img : new Image(2670, 2670),
    pos : [375, 600],
    target : [375, 600],
    size : [50, 50],
    movementSmoothness : 5,
    upgradeLevel : parseInt(localStorage.petMagnetUpgradeLevel),
    isDoingAbility : false,
    changeTimer : clamp(Math.floor(Math.random() * 40000), 10000, 40000) / 20,
    maxUpgradeLevel : 4,

    draw : function() {
        ctx.drawImage(petMagnet.img, petMagnet.pos[0], petMagnet.pos[1], petMagnet.size[0], petMagnet.size[1]);
    },

    update : function() {
        if (petMagnet.isDoingAbility) petMagnet.target = [player.pos[0] + player.size[0] / 2 - petMagnet.size[0] / 2, player.pos[1] - 160]; else petMagnet.target = [player.pos[0] + player.size[0] + 1, player.pos[1]];
        let movement = lerp(petMagnet.target, petMagnet.pos, petMagnet.movementSmoothness);
        petMagnet.pos[0] += movement[0];
        petMagnet.pos[1] += movement[1];
    },

    ability : function() {
        if (petMagnet.upgradeLevel > 1) asteroids = [];

        if (petMagnet.upgradeLevel > 2) {
            for (i = 0; i < coins.length; i++) {
                coins[i].pos[0] += lerp(player.pos, coins[i].pos, 8)[0];
            }
        }

        if (petMagnet.upgradeLevel > 3) {
            for (i = 0; i < healers.length; i++) {
                healers[i].pos[0] += lerp(player.pos, healers[i].pos, 8)[0];
            }
        }
    }
};

petMagnet.img.src = "imgs/petmagnet.png";

let buildings = {
    road : {
        buyed : localStorage.buyedRoad == "true",
        price : 40000
    },

    hospital : {
        buyed : localStorage.buyedHospital == "true",
        img : new Image(1011, 1249),
        price : 50000,
        parallaxEffect : -.1,
        size : [100, 120],
        initialPos : [10, canvas.height - 120],
        pos : [10, canvas.height - 120]
    },

    bank : {
        buyed : localStorage.buyedBank == "true",
        img : new Image(1172, 1341),
        price : 60000,
        parallaxEffect : -.1,
        size : [117, 134],
        initialPos : [120, canvas.height - 134],
        pos : [120, canvas.height - 134]
    },

    office : {
        buyed : localStorage.buyedOffice == "true",
        img : new Image(546, 630),
        price : 60000,
        parallaxEffect : -.1,
        size : [109, 126],
        initialPos : [247, canvas.height - 109],
        pos : [247, canvas.height - 109]
    },

    school : {
        buyed : localStorage.buyedSchool == "true",
        img : new Image(995, 488),
        price : 30000,
        parallaxEffect : -.1,
        size : [248, 122],
        initialPos : [366, canvas.height - 110],
        pos : [366, canvas.height - 110]
    },

    GOR : {
        buyed : localStorage.buyedGOR == "true",
        img : new Image(981, 963),
        price : 40000,
        parallaxEffect : -.1,
        size : [109, 107],
        initialPos : [624, canvas.height - 104],
        pos : [624, canvas.height - 104]
    }
};

buildings.hospital.img.src = "imgs/rumahsakit.png";
buildings.bank.img.src = "imgs/bank.png";
buildings.office.img.src = "imgs/kantorpajak.png";
buildings.school.img.src = "imgs/sekolah.png";
buildings.GOR.img.src = "imgs/GOR.png";

var moneybag = {
    pos : [100, 500],
    img : new Image(2670, 2670),
    size : [100, 100],
    movementSmoothness : 7,
    rect : new Rect(100, 450, 100, 100),
    isDoingAbility : false,

    draw : function() {
        ctx.drawImage(moneybag.img, moneybag.pos[0], moneybag.pos[1], moneybag.size[0], moneybag.size[1]);
    },

    update : function() {
        var movement = lerp(player.target, moneybag.pos, moneybag.movementSmoothness);
        moneybag.pos[0] += movement[0];
        moneybag.rect = new Rect(moneybag.pos[0], moneybag.pos[1], moneybag.size[0], moneybag.size[1]);
    }
};

player.img.src = "imgs/kojib.png";
moneybag.img.src = "imgs/kasnegara.png";

let multiplier = 1;

let timers = {
    heal : {
        initial : 16260 / 20,
        value : 16260 / 20
    },

    plusMoney : {
        initial : 30000 / 20,
        value : 30000 / 20
    }
}

let coins = [new Coin(50)];
let asteroids = [];
let healers = [];
let waters = [];
let particles = [];
let WPs = [new WP(new Image(781, 1600), "imgs/wp4.png", [0, 500], [0, 100], [50, 100], 8), new WP(new Image(1017, 2598), "imgs/wp2.png", [0, 500], [40, 100], [50, 100]), new WP(new Image(1088, 2025), "imgs/wp1.png", [0, 600], [240, 100], [50, 100]), new WP(new Image(1029, 2211), "imgs/wp3.png", [0, 600], [100, 100], [50, 100])];

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameOver() {
    clear();

    ctx.fillStyle = "#000000"
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    ctx.font = "40px Squada One";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(deathMessage, canvas.width / 2, canvas.height / 2);
    // ctx.strokeText(deathMessage, canvas.width / 2, canvas.height / 2);
}

function win() {
    clear();

    let winImage = new Image(3000, 3000);
    winImage.src = "imgs/winscreen.jpg";

    ctx.drawImage(winImage, 0, 0, canvas.width, canvas.height);
}

let bgX = 0;
let bgTarget = [-20, 0];

function startMenu() {
    let playButton = {
        rect : new Rect(canvas.width / 2 - 202 / 2, canvas.height / 2 - 172 / 2, 202, 172),
        img : new Image(608, 518)
    };

    playButton.img.src = "imgs/playbutton.png";

    clear();

    // checking if player clicked play button
    if (playButton.rect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        // change to game
        playSound("sounds/start.wav");
        clearInterval(intervals.startMenu);
        intervals.game = setInterval(game, 20);
    }

    let bgMovement = lerp(bgTarget, [bgX, 0], 16);
    bgX += bgMovement[0];

    if (Math.floor(bgX) <= bgTarget[0]) {
        bgTarget = [0, 0];
    }

    if (Math.ceil(bgX) >= bgTarget[0]) {
        bgTarget = [-20, 0];
    }

    // displaying bg
    ctx.drawImage(bgManager.img, bgX, 0, canvas.width * 1.2, canvas.height * 1.2);

    // displaying play button
    ctx.drawImage(playButton.img, playButton.rect.x, playButton.rect.y, playButton.rect.width, playButton.rect.height);

    mouseManager.click = false;
}

let comicRect = new Rect(canvas.width / 2 + 31, 30, 30, 30);
let infoRect = new Rect(canvas.width / 2 - 61, 30, 30, 30);

let currentComic = 0;
let comics = [new Image(3000, 3000), new Image(3000, 3000), new Image(3000, 3000), new Image(3000, 3000), new Image(3000, 3000), new Image(3000, 3000)];
let maxComic = 2;

for (i = 0; i < comics.length; i++) {
    comics[i].src = `comics/${i + 1}.jpg`;
}

function comic() {
    if (buildings.GOR.buyed) {
        maxComic = 5;
    }

    let arrowRightRect = new Rect(canvas.width / 2 + 365 - 75, canvas.height / 2 - 50 / 2, 50, 50);
    let arrowLeftRect = new Rect(canvas.width / 2 - 365 + 50 / 2, canvas.height / 2 - 50 / 2, 50, 50);

    let arrowRightImg = new Image(1024, 1024);
    let arrowLeftImg = new Image(1024, 1024);

    arrowRightImg.src = "imgs/arrowright.png";
    arrowLeftImg.src = "imgs/arrowleft.png";

    let displayedImg = comics[currentComic];

    // checking if user presses right or left arrow
    if (arrowRightRect.checkCollisionWithMouse(mouseManager) && mouseManager.click && currentComic < maxComic) {
        currentComic += 1;
        playSound("sounds/select.wav");
    } else if (arrowLeftRect.checkCollisionWithMouse(mouseManager) && mouseManager.click && currentComic > 0) {
        currentComic -= 1;
        playSound("sounds/select.wav");
    }

    // checking comic rect is pressed or not
    if (comicRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.comic);
        pauseManager.showedImg = pauseManager.pause;
        intervals.game = setInterval(game, 20);
    }

    // checking if pause button is clickeeeeeeed
    if (pauseManager.rect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        pauseManager.showedImg = pauseManager.continue;
        playSound("sounds/select.wav");
        intervals.pause = setInterval(pause, 20);
        clearInterval(intervals.comic);
    }

    // checking if info rect is clicked
    if (infoRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.comic);
        pauseManager.showedImg = pauseManager.continue;
        intervals.info = setInterval(info, 20);
    }

    clear();

    // displaying bg
    ctx.drawImage(bgManager.img, bgManager.pos[0], bgManager.pos[1], bgManager.size[0], bgManager.size[1]);

    // displaying buildings or stuff a sdghfewiuhoaidushfj
    for (const building in buildings) {
        if (buildings[building].img && buildings[building].buyed) {
            ctx.drawImage(buildings[building].img, buildings[building].pos[0], buildings[building].pos[1], buildings[building].size[0], buildings[building].size[1]);
        }
    }

    player.draw();

    moneybag.draw();

    // rendering petmagnet
    if (petMagnet.upgradeLevel > 0) ctx.drawImage(petMagnet.img, petMagnet.pos[0], petMagnet.pos[1], petMagnet.size[0], petMagnet.size[1]);

    // asteroid drawing
    for (i = 0; i < asteroids.length; i++) {
        asteroids[i].draw();
    }

    // WP drawing
    for (i = 0; i < WPs.length; i++) {
        WPs[i].draw();
    }

    // coin and drawingsdfhqiuwrgn atau coins gtau
    for (i = 0; i < coins.length; i++) {
        coins[i].draw();
    }

    // healerdrawing
    for (i = 0; i < healers.length; i++) {
        healers[i].draw();
    }

    // particle drawing)
    for (i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    // drawing comic button
    ctx.drawImage(comicImg, comicRect.x, comicRect.y, comicRect.width, comicRect.height);

    // displaying player cash
    ctx.font = "30px Squada One";
    ctx.textAlign = "left";

    ctx.fillStyle = "#00ff00";
    ctx.fillText("APBN", 10, 40);
    ctx.fillText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    ctx.strokeStyle = "#000000";
    ctx.strokeText("APBN", 10, 40);
    ctx.strokeText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    // displaying player health
    ctx.font = "30px Squada One";
    ctx.textAlign = "right";

    ctx.fillStyle = "#ff0000";

    if (player.health > 50) {
        ctx.fillText(`♥${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♥${player.health}`, 740, 40);
    } else {
        ctx.fillText(`♡${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♡${player.health}`, 740, 40);
    }

    // displaying petmagnet timer
    if (petMagnet.upgradeLevel > 1) {
        ctx.font = "30px Squada One";
        ctx.textAlign = "right";

        if (petMagnet.isDoingAbility) ctx.fillStyle = "#ff0000"; else ctx.fillStyle = "#00ff00";
        ctx.strokeStyle = "#000000";

        ctx.fillText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
        ctx.strokeText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
    }

    // displaying comic
    ctx.drawImage(displayedImg, canvas.width / 2 - 500 / 2, canvas.height / 2 - 500 / 2, 500, 500);

    // displaying arrows
    ctx.drawImage(arrowRightImg, canvas.width / 2 + 365 - 75, canvas.height / 2 - 50 / 2, 50, 50);
    ctx.drawImage(arrowLeftImg, canvas.width / 2 - 365 + 50 / 2, canvas.height / 2 - 50 / 2, 50, 50);

    // displaying question makr image
    ctx.drawImage(questionMarkImg, infoRect.x, infoRect.y, infoRect.width, infoRect.height);

    // displaying pause image
    ctx.drawImage(pauseManager.showedImg, canvas.width / 2 - pauseManager.width / 2, 30, pauseManager.width, pauseManager.height);

    // arrowRightRect.draw();
    // arrowLeftRect.draw();

    mouseManager.click = false;
}

let questionMarkImg = new Image(598, 598);
questionMarkImg.src = "imgs/questionmark.png";

function game() {
    clear();

    player.health = parseFloat(player.health).toFixed(1);

    // checking if player is dead
    if (player.cash < 0 && player.health <= 0) {
        deathMessage = "Anda Bangkrut Sekaligus Meninggal.";
        playSound("sounds/lose.wav");
        clearInterval(intervals.game);
        intervals.gameOver = setInterval(gameOver, 20);
    } else if (player.cash < 0) {
        deathMessage = "Anda Bangkrut.";
        playSound("sounds/lose.wav");
        clearInterval(intervals.game);
        intervals.gameOver = setInterval(gameOver, 20);
    } else if (player.health <= 0) {
        deathMessage = "Anda Meninggal.";
        playSound("sounds/lose.wav");
        clearInterval(intervals.game);
        intervals.gameOver = setInterval(gameOver, 20);
    }

    // petmoney update eh maksudnya petmagnet i guess mungin adfaiushgpeuhgpiu43
    if (petMagnet.upgradeLevel > 0) {
        petMagnet.update();

        if (petMagnet.upgradeLevel > 1) {
            petMagnet.changeTimer -= 1;

            if (petMagnet.changeTimer <= 0) {
                petMagnet.isDoingAbility = !petMagnet.isDoingAbility;
                if (petMagnet.isDoingAbility) playSound("sounds/ability.wav");
                petMagnet.changeTimer = clamp(Math.floor(Math.random() * 40000), 10000, 40000) / 20;
            }

            if (petMagnet.isDoingAbility) {
                petMagnet.ability();
            }
        }
    }

    // heal timer
    if (buildings.hospital.buyed) timers.heal.value -= 1;

    if ((timers.heal.value * 20) % 1000 == 0 && buildings.hospital.buyed && (timers.heal.value * 20).toFixed(0) != 0) {
        particles.push(new ParticleEffect([30, buildings.hospital.pos[1]], `🕒${(timers.heal.value / 1000 * 20.689).toFixed(0)}`, "#00ff00", 1500, true, [0, -1]))
    }

    if (timers.heal.value <= 0) {
        timers.heal.value = timers.heal.initial;

        if (buildings.hospital.buyed) {
            if (player.health - -2 <= 100) player.health -= -2; else player.health -= -(100 - player.health);
            playSound("sounds/heal.wav");
            particles.push(new ParticleEffect([30, buildings.hospital.pos[1]], "+♥2", "#ff0000", 1500, true, [0, -1]));
        }
    }

    // plus money timer
    if (buildings.office.buyed) timers.plusMoney.value -= 1;

    if ((timers.plusMoney.value * 20) % 1000 == 0 && buildings.office.buyed && (timers.plusMoney.value * 20).toFixed(0) != 0) {
        particles.push(new ParticleEffect([buildings.office.pos[0] + 30, buildings.office.pos[1]], `🕒${(timers.plusMoney.value / 1000 * 20.689).toFixed(0)}`, "#00ff00", 1500, true, [0, -1]))
    }

    if (timers.plusMoney.value <= 0) {
        timers.plusMoney.value = timers.plusMoney.initial;

        if (buildings.office.buyed) {
            player.cash -= -500 * multiplier;
            playSound("sounds/pickupcoin.wav");
            particles.push(new ParticleEffect([buildings.office.pos[0] + 30, buildings.office.pos[1]], `+Rp${500 * multiplier}`, "#00ff00", 1500, true, [0, -1]));
        }
    }

    // checking if bank is buyed
    if (buildings.bank.buyed) multiplier = 2; else multiplier = 1;

    // checking if sport center (g0r) is buyed
    if (buildings.GOR.buyed) {
        player.movementSmoothness = 4;
        moneybag.movementSmoothness = 5;
    } else {
        player.movementSmoothness = 8;
        moneybag.movementSmoothness = 9;
    }

    // displaying bg
    ctx.drawImage(bgManager.img, bgManager.pos[0], bgManager.pos[1], bgManager.size[0], bgManager.size[1]);

    // displaying buildings or stuff a sdghfewiuhoaidushfj
    for (const building in buildings) {
        if (buildings[building].img && buildings[building].buyed) {
            buildings[building].pos[0] = buildings[building].initialPos[0] + player.pos[0] * buildings[building].parallaxEffect;
            ctx.drawImage(buildings[building].img, buildings[building].pos[0], buildings[building].pos[1], buildings[building].size[0], buildings[building].size[1]);
        }
    }

    // checking if pause button is clickeeeeeeed
    if (pauseManager.rect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        pauseManager.showedImg = pauseManager.continue;
        playSound("sounds/select.wav");
        intervals.pause = setInterval(pause, 20);
        clearInterval(intervals.game);
    }

    // checking if comic rect is clicked
    if (comicRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.game);
        pauseManager.showedImg = pauseManager.continue;
        intervals.comic = setInterval(comic, 20);
    }

    // checking if info rect is clicked
    if (infoRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.game);
        pauseManager.showedImg = pauseManager.continue;
        intervals.info = setInterval(info, 20);
    }

    // updating player and da moneybag oooof!!!!!
    player.target[0] = clamp(mouseManager.x - player.size[0] / 2, -10, canvas.width - player.size[0]);

    player.update();
    player.draw();

    moneybag.update();
    moneybag.draw();

    // rendering petmagnet
    if (petMagnet.upgradeLevel > 0) ctx.drawImage(petMagnet.img, petMagnet.pos[0], petMagnet.pos[1], petMagnet.size[0], petMagnet.size[1]);

    // updating bg pos
    bgManager.pos[0] = player.pos[0] * bgManager.parallaxEffect;

    // coin spawning (no)
    // if (Math.random() > .95) {
    //     if (Math.random() < .5) {
    //         coins.push(new Coin(coinValues[0]));
    //     } else if (Math.random() < .75) {
    //         coins.push(new Coin(coinValues[1]));
    //     } else if (Math.random() > .75) {
    //         coins.push(new Coin(coinValues[2]));
    //     }
    // }

    // healer spawning
    if (Math.random() > .99 && Math.random() > .7) {
        healers.push(new Healer());
    }

    // asteroid spawning
    if (Math.random() > .94) {
        asteroids.push(new Asteroid());
    }

    // asteroid updating and drawing
    for (i = 0; i < asteroids.length; i++) {
        asteroids[i].update();
        asteroids[i].draw();

        if (asteroids[i].pos[1] > canvas.height) {
            asteroids.splice(i, 1);
        } else if (asteroids[i].delete) {
            playSound("sounds/hurt.wav");
            player.health -= asteroids[i].damage;
            player.cash -= 100;
            localStorage.playerCash = player.cash;
            particles.push(new ParticleEffect(asteroids[i].pos, `-♥${asteroids[i].damage}`, "#ff0000", 1000, true, [0, -1]));
            let newPos = [asteroids[i].pos[0], asteroids[i].pos[1] + 32];
            particles.push(new ParticleEffect(newPos, `-Rp100`, "#00ff00", 1000, true, [0, -1]));
            localStorage.playerHealth = player.health;
            asteroids.splice(i, 1);
        }
    }

    // WP updating
    for (i = 0; i < WPs.length; i++) {
        WPs[i].update();
        WPs[i].draw();

        if (WPs[i].throwTimer < 0) {
            WPs[i].target[0] = Math.floor(Math.random() * canvas.width);

            let oofNum = Math.random();

            if (oofNum < .6) {
                coins.push(new Coin(coinValues[0], [0, -5], WPs[i].pos[0]));
            } else if (oofNum < .95) {
                coins.push(new Coin(coinValues[1], [0, -5], WPs[i].pos[0]));
            } else if (oofNum > .95) {
                coins.push(new Coin(coinValues[2], [0, -5], WPs[i].pos[0]));
            }

            WPs[i].throwTimer = Math.floor(Math.random() * 4000);
        }

        WPs[i].pos[1] = 100;
    }

    // coin updating!! and drawingsdfhqiuwrgn atau coins gtau
    for (i = 0; i < coins.length; i++) {
        coins[i].update();
        coins[i].draw();

        if (coins[i].pos[1] > canvas.height) {
            coins.splice(i, 1);
        } else if (coins[i].delete) {
            playSound("sounds/pickupcoin.wav");
            player.cash += coins[i].value * multiplier;
            particles.push(new ParticleEffect(coins[i].pos, `+Rp${coins[i].value * multiplier}`, "#00ff00", 1000, true, [0, -1]));
            localStorage.playerCash = player.cash;
            coins.splice(i, 1);
        }
    }

    // healer update and drawing
    for (i = 0; i < healers.length; i++) {
        healers[i].update();
        healers[i].draw();

        if (healers[i].pos[1] > canvas.height) {
            healers.splice(i, 1);
        } else if (healers[i].delete) {
            playSound("sounds/heal.wav");
            if (player.health - -healers[i].healLevel <= 100) player.health -= -healers[i].healLevel; else player.health -= -(100 - player.health);
            particles.push(new ParticleEffect(healers[i].pos, `+♥${healers[i].healLevel}`, "#ff0000", 1000, true, [0, -1]));
            localStorage.playerHealth = player.health;
            healers.splice(i, 1);
        }
    }

    // particle updating (and drawing)
    for (i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].delete) {
            particles.splice(i, 1);
        }
    }

    // displaying player cash
    ctx.font = "30px Squada One";
    ctx.textAlign = "left";

    ctx.fillStyle = "#00ff00";
    ctx.fillText("APBN", 10, 40);
    ctx.fillText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    ctx.strokeStyle = "#000000";
    ctx.strokeText("APBN", 10, 40);
    ctx.strokeText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    // displaying player health
    player.health = parseFloat(player.health).toFixed(1);

    ctx.font = "30px Squada One";
    ctx.textAlign = "right";

    ctx.fillStyle = "#ff0000";

    if (player.health > 50) {
        ctx.fillText(`♥${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♥${player.health}`, 740, 40);
    } else {
        ctx.fillText(`♡${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♡${player.health}`, 740, 40);
    }

    // displaying petmagnet timer
    if (petMagnet.upgradeLevel > 1) {
        ctx.font = "30px Squada One";
        ctx.textAlign = "right";

        if (petMagnet.isDoingAbility) ctx.fillStyle = "#ff0000"; else ctx.fillStyle = "#00ff00";
        ctx.strokeStyle = "#000000";

        ctx.fillText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
        ctx.strokeText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
    }

    // displaying pause image
    ctx.drawImage(pauseManager.showedImg, canvas.width / 2 - pauseManager.width / 2, 30, pauseManager.width, pauseManager.height);

    // drawing comic button
    ctx.drawImage(comicImg, comicRect.x, comicRect.y, comicRect.width, comicRect.height);

    // displaying question makr image
    ctx.drawImage(questionMarkImg, infoRect.x, infoRect.y, infoRect.width, infoRect.height);

    mouseManager.click = false;

    localStorage.playerCash = player.cash;
    localStorage.playerHealth = player.health;
    if (buildings.road.buyed) localStorage.buyedRoad = "true"; else localStorage.buyedRoad = "false";
    if (buildings.hospital.buyed) localStorage.buyedHospital = "true"; else localStorage.buyedHospital = "false";
    if (buildings.bank.buyed) localStorage.buyedBank = "true"; else localStorage.buyedBank = "false";
    if (buildings.office.buyed) localStorage.buyedOffice = "true"; else localStorage.buyedOffice = "false";
    if (buildings.school.buyed) localStorage.buyedSchool = "true"; else localStorage.buyedSchool = "false";
    if (buildings.GOR.buyed) localStorage.buyedGOR = "true"; else localStorage.buyedGOR = "false";
    localStorage.petMagnetUpgradeLevel = petMagnet.upgradeLevel;

    // console.log(coins.length);
}

let petPrice;
let muteSongRect = new Rect(280, 545, 190, 45);

function pause() {
    // changing thumbnail img
    if (!buildings.road.buyed) {
        thumbnailImg = new Image(1024, 1024);
        thumbnailImg.src = "imgs/roadthumbnail.png";
        thumbnailText = "Jalan";
        thumbnailDesc = ["Supaya bisa jalan", "ke bangunan lain"];
    } else if (!buildings.hospital.buyed) {
        thumbnailImg = new Image(1249, 1249);
        thumbnailImg.src = "imgs/rumahsakitthumbnail.png";
        thumbnailText = "Rumah Sakit";
        thumbnailDesc = ["+♥2 setiap 16", "detik"];
    } else if (!buildings.bank.buyed) {
        thumbnailImg = new Image(1342, 1341);
        thumbnailImg.src = "imgs/bankthumbnail.png";
        thumbnailText = "Bank";
        thumbnailDesc = ["x2 setiap uang yang", "didapat"];
    } else if (!buildings.office.buyed) {
        thumbnailImg = new Image(630, 630);
        thumbnailImg.src = "imgs/kantorpajakthumbnail.png";
        thumbnailText = "Kantor Pemerintahan";
        thumbnailDesc = ["+Rp500 setiap 30", "detik"];
    } else if (!buildings.school.buyed) {
        thumbnailImg = new Image(995, 996);
        thumbnailImg.src = "imgs/sekolahthumbnail.png";
        thumbnailText = "Sekolah";
        thumbnailDesc = ["Membuat", "anak-anak pintar"];
    } else if (!buildings.GOR.buyed) {
        thumbnailImg = new Image(981, 981);
        thumbnailImg.src = "imgs/gorthumbnail.png";
        thumbnailText = "GOR";
        thumbnailDesc = ["Menambah", "kecepatanmu"];
    } else {
        thumbnailImg = new Image(1024, 1024);
        thumbnailImg.src = "imgs/x.png";
        thumbnailText = "...";
        thumbnailDesc = ["..."];
    }

    if (petMagnet.upgradeLevel == 0) {
        petText = "Beli Pet";
        petDesc = ["Beli pet"];
        petImg = petMagnet.img;
    } else if (petMagnet.upgradeLevel == 1) {
        petText = "Upgrade Pet";
        petDesc = ["Menghilangkan", "meteor"];
        petImg = new Image(1024, 1024);
        petImg.src = "imgs/noasteroid.png";
    } else if (petMagnet.upgradeLevel == 2) {
        petText = "Upgrade Pet";
        petDesc = ["Mendekatkan", "koin ke", "arahmu"];
        petImg = new Image(1024, 1024);
        petImg.src = "imgs/cointowardsyou.png";
    } else if (petMagnet.upgradeLevel == 3) {
        petText = "Upgrade Pet";
        petDesc = ["Mendekatkan", "healer ke", "arahmu"];
        petImg = new Image(1024, 1024);
        petImg.src = "imgs/closinghealer.png";
    } else {
        petText = "...";
        petDesc = ["..."];
        petImg = new Image(1024, 1024);
        petImg.src = "imgs/x.png";
    }

    // checking if player bought the building :)-q4th-834h is me cat :( no sotp pls
    if (buyBuildingRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        if (thumbnailText == "Jalan" && player.cash >= buildings.road.price) {
            buildings.road.buyed = true;
            player.cash -= buildings.road.price;
            playSound("sounds/kaching.wav");
        } else if (thumbnailText == "Rumah Sakit" && player.cash >= buildings.hospital.price) {
            buildings.hospital.buyed = true;
            player.cash -= buildings.hospital.price;
            playSound("sounds/kaching.wav");
        } else if (thumbnailText == "Bank" && player.cash >= buildings.bank.price) {
            buildings.bank.buyed = true;
            player.cash -= buildings.bank.price;
            playSound("sounds/kaching.wav");
        } else if (thumbnailText == "Kantor Pemerintahan" && player.cash >= buildings.office.price) {
            buildings.office.buyed = true;
            player.cash -= buildings.office.price;
            playSound("sounds/kaching.wav");
        } else if (thumbnailText == "Sekolah" && player.cash >= buildings.school.price) {
            buildings.school.buyed = true;
            player.cash -= buildings.school.price;
            playSound("sounds/kaching.wav");
        } else if (thumbnailText == "GOR" && player.cash >= buildings.GOR.price) {
            buildings.GOR.buyed = true;
            player.cash -= buildings.GOR.price;
            playSound("sounds/kaching.wav");
            deathMessage = "Tamat. (Coba cek komik)";
            clearInterval(intervals.pause);
            intervals.win = setInterval(win, 20);
        }
    }

    petPrice = 3000 * (petMagnet.upgradeLevel + 1)

    // checking if player bought pet :)
    if (buyPetRect.checkCollisionWithMouse(mouseManager) && mouseManager.click && petMagnet.upgradeLevel < petMagnet.maxUpgradeLevel && player.cash >= 3000 * (petMagnet.upgradeLevel + 1)) {
        petMagnet.upgradeLevel += 1;
        player.cash -= petPrice;
        playSound("sounds/kaching.wav");
    }

    if ((pauseManager.rect.checkCollisionWithMouse(mouseManager) && mouseManager.click) || closePauseRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        pauseManager.showedImg = pauseManager.pause;
        playSound("sounds/select.wav");
        intervals.game = setInterval(game, 20);
        clearInterval(intervals.pause);
    }

    // checking if player muted song
    if (muteSongRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        if (!songMuted) {
            clearInterval(intervals.song);
            bgSong.pause();
            songMuted = true;
        } else {
            bgSong.play();
            intervals.song = setInterval(function() {bgSong.currentTime = 0; if (!songMuted) bgSong.play();}, 146000);
            songMuted = false;
        }
    }

    clear();

    // displaying bg
    ctx.drawImage(bgManager.img, bgManager.pos[0], bgManager.pos[1], bgManager.size[0], bgManager.size[1]);

    // displaying buildings or stuff a sdghfewiuhoaidushfj
    for (const building in buildings) {
        if (buildings[building].img && buildings[building].buyed) {
            ctx.drawImage(buildings[building].img, buildings[building].pos[0], buildings[building].pos[1], buildings[building].size[0], buildings[building].size[1]);
        }
    }

    player.draw();

    moneybag.draw();

    // rendering petmagnet
    if (petMagnet.upgradeLevel > 0) ctx.drawImage(petMagnet.img, petMagnet.pos[0], petMagnet.pos[1], petMagnet.size[0], petMagnet.size[1]);

    // asteroid drawing
    for (i = 0; i < asteroids.length; i++) {
        asteroids[i].draw();
    }

    // WP drawing
    for (i = 0; i < WPs.length; i++) {
        WPs[i].draw();
    }

    // coin and drawingsdfhqiuwrgn atau coins gtau
    for (i = 0; i < coins.length; i++) {
        coins[i].draw();
    }

    // healerdrawing
    for (i = 0; i < healers.length; i++) {
        healers[i].draw();
    }

    // particle drawing)
    for (i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    // drawing comic button
    ctx.drawImage(comicImg, comicRect.x, comicRect.y, comicRect.width, comicRect.height);

    // displaying player cash
    ctx.font = "30px Squada One";
    ctx.textAlign = "left";

    ctx.fillStyle = "#00ff00";
    ctx.fillText("APBN", 10, 40);
    ctx.fillText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    ctx.strokeStyle = "#000000";
    ctx.strokeText("APBN", 10, 40);
    ctx.strokeText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    // displaying player health
    ctx.font = "30px Squada One";
    ctx.textAlign = "right";

    ctx.fillStyle = "#ff0000";

    if (player.health > 50) {
        ctx.fillText(`♥${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♥${player.health}`, 740, 40);
    } else {
        ctx.fillText(`♡${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♡${player.health}`, 740, 40);
    }

    // displaying petmagnet timer
    if (petMagnet.upgradeLevel > 1) {
        ctx.font = "30px Squada One";
        ctx.textAlign = "right";

        if (petMagnet.isDoingAbility) ctx.fillStyle = "#ff0000"; else ctx.fillStyle = "#00ff00";
        ctx.strokeStyle = "#000000";

        ctx.fillText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
        ctx.strokeText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
    }

    // displaying pause image
    ctx.drawImage(pauseManager.showedImg, canvas.width / 2 - pauseManager.width / 2, 30, pauseManager.width, pauseManager.height);

    // displaying pause menu of doom
    ctx.drawImage(pauseMenuImg, canvas.width / 2 - 160, canvas.height / 2 - 245, 320, 490);

    // closePauseRect.draw();

    // displaying thumbnail imagez
    ctx.drawImage(thumbnailImg, buyBuildingRect.x, buyBuildingRect.y, buyBuildingRect.width, buyBuildingRect.height);
    buyBuildingRect.draw();
    ctx.font = "20px Squada One";
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.textAlign = "left";

    // displaying name
    ctx.fillText(thumbnailText, canvas.width / 2, buyBuildingRect.y + 20);

    // displaying price
    let displayedPrice;

    if (thumbnailText == "Jalan") {
        displayedPrice = buildings.road.price;
    } else if (thumbnailText == "Rumah Sakit") {
        displayedPrice = buildings.hospital.price;
    } else if (thumbnailText == "Bank") {
        displayedPrice = buildings.bank.price;
    } else if (thumbnailText == "Kantor Pemerintahan") {
        displayedPrice = buildings.office.price;
    } else if (thumbnailText == "Sekolah") {
        displayedPrice = buildings.school.price;
    } else if (thumbnailText == "GOR") {
        displayedPrice = buildings.GOR.price;
    } else {
        displayedPrice = 0;
    }

    ctx.fillText(new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(displayedPrice), canvas.width / 2, buyBuildingRect.y + 41);

    // displaying description
    for (i = 0; i < thumbnailDesc.length; i++) {
        ctx.fillText(thumbnailDesc[i], canvas.width / 2, buyBuildingRect.y + (i + 1) * 20 + 41);
    }

    // displaying pet image
    ctx.drawImage(petImg, buyPetRect.x, buyPetRect.y, buyPetRect.width, buyPetRect.height);
    buyPetRect.draw();

    // checking comic rect is pressed or not
    if (comicRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.pause);
        pauseManager.showedImg = pauseManager.continue;
        intervals.comic = setInterval(comic, 20);
    }

    // checking info rect pressed or not
    if (infoRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.pause);
        pauseManager.showedImg = pauseManager.continue;
        intervals.info = setInterval(info, 20);
    }

    // displaying pet title or something
    ctx.fillText(petText, canvas.width / 2, buyPetRect.y + 20);

    // displaying price
    if (petMagnet.upgradeLevel < petMagnet.maxUpgradeLevel) ctx.fillText(new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(petPrice), canvas.width / 2, buyPetRect.y + 41); else ctx.fillText(new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(0), canvas.width / 2, buyPetRect.y + 41);

    // displaying description
    for (i = 0; i < petDesc.length; i++) {
        ctx.fillText(petDesc[i], canvas.width / 2, buyPetRect.y + (i + 1) * 20 + 41);
    }

    // displaying question makr image
    ctx.drawImage(questionMarkImg, infoRect.x, infoRect.y, infoRect.width, infoRect.height);

    mouseManager.click = false;

    localStorage.playerCash = player.cash;
    localStorage.playerHealth = player.health;
    if (buildings.road.buyed) localStorage.buyedRoad = "true"; else localStorage.buyedRoad = "false";
    if (buildings.hospital.buyed) localStorage.buyedHospital = "true"; else localStorage.buyedHospital = "false";
    if (buildings.bank.buyed) localStorage.buyedBank = "true"; else localStorage.buyedBank = "false";
    if (buildings.office.buyed) localStorage.buyedOffice = "true"; else localStorage.buyedOffice = "false";
    if (buildings.school.buyed) localStorage.buyedSchool = "true"; else localStorage.buyedSchool = "false";
    if (buildings.GOR.buyed) localStorage.buyedGOR = "true"; else localStorage.buyedGOR = "false";
    localStorage.petMagnetUpgradeLevel = petMagnet.upgradeLevel;
    if (songMuted) localStorage.songMuted = "true"; else localStorage.songMuted = "false";
}

let infoImg = new Image(780, 937);
infoImg.src = "imgs/infos.png";

function info() {
    // checking if pause button is clickeeeeeeed
    if (pauseManager.rect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        pauseManager.showedImg = pauseManager.continue;
        playSound("sounds/select.wav");
        intervals.pause = setInterval(pause, 20);
        clearInterval(intervals.info);
    }

    // checking if comic rect is clicked
    if (comicRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.info);
        pauseManager.showedImg = pauseManager.continue;
        intervals.comic = setInterval(comic, 20);
    }

    // checking if info rect is clicked
    if (infoRect.checkCollisionWithMouse(mouseManager) && mouseManager.click) {
        playSound("sounds/select.wav");
        clearInterval(intervals.info);
        pauseManager.showedImg = pauseManager.pause;
        intervals.game = setInterval(game, 20);
    }

    clear();

    // displaying bg
    ctx.drawImage(bgManager.img, bgManager.pos[0], bgManager.pos[1], bgManager.size[0], bgManager.size[1]);

    // displaying buildings or stuff a sdghfewiuhoaidushfj
    for (const building in buildings) {
        if (buildings[building].img && buildings[building].buyed) {
            ctx.drawImage(buildings[building].img, buildings[building].pos[0], buildings[building].pos[1], buildings[building].size[0], buildings[building].size[1]);
        }
    }

    player.draw();

    moneybag.draw();

    // rendering petmagnet
    if (petMagnet.upgradeLevel > 0) ctx.drawImage(petMagnet.img, petMagnet.pos[0], petMagnet.pos[1], petMagnet.size[0], petMagnet.size[1]);

    // asteroid drawing
    for (i = 0; i < asteroids.length; i++) {
        asteroids[i].draw();
    }

    // WP drawing
    for (i = 0; i < WPs.length; i++) {
        WPs[i].draw();
    }

    // coin and drawingsdfhqiuwrgn atau coins gtau
    for (i = 0; i < coins.length; i++) {
        coins[i].draw();
    }

    // healerdrawing
    for (i = 0; i < healers.length; i++) {
        healers[i].draw();
    }

    // particle drawing)
    for (i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    // drawing comic button
    ctx.drawImage(comicImg, comicRect.x, comicRect.y, comicRect.width, comicRect.height);

    // displaying player cash
    ctx.font = "30px Squada One";
    ctx.textAlign = "left";

    ctx.fillStyle = "#00ff00";
    ctx.fillText("APBN", 10, 40);
    ctx.fillText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    ctx.strokeStyle = "#000000";
    ctx.strokeText("APBN", 10, 40);
    ctx.strokeText(`${new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"}).format(player.cash)}`, 10, 72);

    // displaying player health
    ctx.font = "30px Squada One";
    ctx.textAlign = "right";

    ctx.fillStyle = "#ff0000";

    if (player.health > 50) {
        ctx.fillText(`♥${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♥${player.health}`, 740, 40);
    } else {
        ctx.fillText(`♡${player.health}`, 740, 40);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(`♡${player.health}`, 740, 40);
    }

    // displaying petmagnet timer
    if (petMagnet.upgradeLevel > 1) {
        ctx.font = "30px Squada One";
        ctx.textAlign = "right";

        if (petMagnet.isDoingAbility) ctx.fillStyle = "#ff0000"; else ctx.fillStyle = "#00ff00";
        ctx.strokeStyle = "#000000";

        ctx.fillText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
        ctx.strokeText(`🕑${(petMagnet.changeTimer / 1000 * 20.689).toFixed(0)}`, 740, 72);
    }

    // displaying info
    ctx.drawImage(infoImg, canvas.width / 2 - 300 / 2, canvas.height / 2 - 400 / 2, 300, 400);

    // displaying question makr image
    ctx.drawImage(questionMarkImg, infoRect.x, infoRect.y, infoRect.width, infoRect.height);

    // displaying pause image
    ctx.drawImage(pauseManager.showedImg, canvas.width / 2 - pauseManager.width / 2, 30, pauseManager.width, pauseManager.height);

    mouseManager.click = false;
}

function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function mouseMoveHandler(e) {
    mousePos = getMousePos(canvas, e);
    mouseManager.x = mousePos.x;
    mouseManager.y = mousePos.y;
    // console.log(pos);
}

function mouseDownHandler(e) {
    mouseManager.click = true;
    // console.log(mouseManager.click);
}

function resize() {
    let width;
    let height;

    canvasRatio = canvas.height / canvas.width;
    windowRatio = window.innerHeight / window.innerWidth;

    if (windowRatio < canvasRatio) {
        height = window.innerHeight;
        width = height / canvasRatio;
    } else {
        width = window.innerWidth;
        height = width * canvasRatio;
    }

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
}

function start(e) {
    document.removeEventListener("mousedown", start);

    mouseManager.click = false;
    intervals.startMenu = setInterval(startMenu, 20);

    var titleElem = document.getElementById("titleboy");
    titleElem.remove();

    var title2 = document.getElementById("titleboy-2");
    title2.remove();

    if (!songMuted) bgSong.play();
    intervals.song = setInterval(function() {bgSong.currentTime = 0; if (!songMuted) bgSong.play();}, 146000);
}

document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("mousedown", mouseDownHandler);
window.addEventListener("resize", resize, false);

setTimeout(function() {
    document.addEventListener("mousedown", start);
}, 8000);