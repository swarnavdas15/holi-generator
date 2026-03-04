function clamp(value, min, max) {
return Math.min(max, Math.max(min, value))
}

function pickColor(colors) {
return colors[Math.floor(Math.random() * colors.length)]
}

function spawnSpray(particles, x, y, baseAngle, colors) {
const count = 5 + Math.floor(Math.random() * 4)

for (let i = 0; i < count; i++) {
const angle = baseAngle + (Math.random() - 0.5) * 0.35
const vx = Math.cos(angle) * (100 + Math.random() * 80)
const vy = Math.sin(angle) * (50 + Math.random() * 40)

particles.push({
x,
y,
vx,
vy,
size: 1.8 + Math.random() * 2.8,
life: 1 + Math.random() * 0.7,
maxLife: 1.7,
drag: 0.986,
gravity: 38,
color: pickColor(colors),
alpha: 0.9,
glow: 10
})
}
}

function spawnPowder(particles, x, y, colors) {
const count = 8 + Math.floor(Math.random() * 6)

for (let i = 0; i < count; i++) {
const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.15
const speed = 45 + Math.random() * 65

particles.push({
x: x + (Math.random() - 0.5) * 40,
y: y - 10,
vx: Math.cos(angle) * speed,
vy: Math.sin(angle) * speed,
size: 2 + Math.random() * 4.2,
life: 1.6 + Math.random() * 1.2,
maxLife: 2.8,
drag: 0.975,
gravity: 25,
color: pickColor(colors),
alpha: 0.8,
glow: 20
})
}
}

function drawPichkari(ctx, x, y, angle, mirrored, color) {
ctx.save()
ctx.translate(x, y)
if (mirrored) ctx.scale(-1, 1)
ctx.rotate(angle)

ctx.fillStyle = "#d4d4d8"
ctx.fillRect(-55, -8, 72, 16)
ctx.fillRect(14, -4, 40, 8)

ctx.fillStyle = "#991b1b"
ctx.fillRect(-28, -14, 20, 28)

ctx.fillStyle = color
ctx.beginPath()
ctx.arc(-18, 0, 7, 0, Math.PI * 2)
ctx.fill()

ctx.fillStyle = "#111827"
ctx.fillRect(46, -6, 14, 12)

ctx.restore()
}

function drawThali(ctx, x, y, colors) {
ctx.save()

ctx.fillStyle = "#d4d4d8"
ctx.beginPath()
ctx.ellipse(x, y, 95, 22, 0, 0, Math.PI * 2)
ctx.fill()

ctx.fillStyle = "#9ca3af"
ctx.beginPath()
ctx.ellipse(x, y + 8, 82, 14, 0, 0, Math.PI * 2)
ctx.fill()

const piles = [-40, -16, 8, 32]
for (let i = 0; i < piles.length; i++) {
ctx.fillStyle = colors[i % colors.length]
ctx.beginPath()
ctx.arc(x + piles[i], y - 9, 10, 0, Math.PI * 2)
ctx.fill()
}

ctx.restore()
}

function drawMessage(ctx, width, height) {
ctx.save()
ctx.font = "bold 48px sans-serif"
ctx.textAlign = "center"
ctx.fillStyle = "#ffd400"
ctx.shadowColor = "#fff7ae"
ctx.shadowBlur = 20
ctx.fillText("Bura Na Mano Holi Hai!", width / 2, height / 2)
ctx.restore()
}

export function startHoliSequence(ctx, backgroundImage, primaryColor, onComplete) {
if (!ctx || !backgroundImage) return () => {}

const width = ctx.canvas.width
const height = ctx.canvas.height

const colors = [primaryColor || "#ff2e63", "#ffd400", "#00ff9c", "#00c8ff", "#a855f7"]
const particles = []
const settled = []

let animationFrame = null
let startTime = 0
let previousTime = 0
let sprayAccumulator = 0
let powderAccumulator = 0

function render(now) {
if (!startTime) {
startTime = now
previousTime = now
}

const elapsed = now - startTime
const dt = Math.min(0.033, (now - previousTime) / 1000)
previousTime = now

ctx.drawImage(backgroundImage, 0, 0, width, height)

for (let i = 0; i < settled.length; i++) {
const stain = settled[i]
ctx.beginPath()
ctx.fillStyle = stain.color
ctx.globalAlpha = stain.alpha
ctx.arc(stain.x, stain.y, stain.size, 0, Math.PI * 2)
ctx.fill()
}
ctx.globalAlpha = 1

const leftProgress = clamp(elapsed / 650, 0, 1)
const rightProgress = clamp((elapsed - 60) / 650, 0, 1)
const thaliProgress = clamp((elapsed - 500) / 700, 0, 1)

const leftX = -90 + leftProgress * 165
const leftY = height * 0.28
const rightX = width + 90 - rightProgress * 165
const rightY = height * 0.28

drawPichkari(ctx, leftX, leftY, 0.22, false, pickColor(colors))
drawPichkari(ctx, rightX, rightY, -0.22, true, pickColor(colors))

if (elapsed < 1100) {
sprayAccumulator += dt
while (sprayAccumulator > 0.04) {
spawnSpray(particles, leftX + 60, leftY, 0.02, colors)
spawnSpray(particles, rightX - 60, rightY, Math.PI - 0.02, colors)
sprayAccumulator -= 0.04
}
}

const thaliY = height + 70 - thaliProgress * 120
drawThali(ctx, width / 2, thaliY, colors)

if (elapsed > 500 && elapsed < 1500) {
powderAccumulator += dt
while (powderAccumulator > 0.08) {
spawnPowder(particles, width / 2, thaliY - 4, colors)
powderAccumulator -= 0.08
}
}

ctx.globalCompositeOperation = "lighter"
for (let i = particles.length - 1; i >= 0; i--) {
const p = particles[i]
const dragFactor = Math.pow(p.drag, dt * 60)

p.vx *= dragFactor
p.vy = p.vy * dragFactor + p.gravity * dt
p.x += p.vx * dt
p.y += p.vy * dt
p.life -= dt

const lifeRatio = clamp(p.life / p.maxLife, 0, 1)

ctx.beginPath()
ctx.fillStyle = p.color
ctx.globalAlpha = p.alpha * lifeRatio
ctx.shadowColor = p.color
ctx.shadowBlur = p.glow
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
ctx.fill()

if (p.life <= 0 || p.y > height + 20) {
settled.push({
x: clamp(p.x, 0, width),
y: clamp(p.y, 0, height),
size: p.size * (0.7 + Math.random() * 0.6),
color: p.color,
alpha: 0.08 + Math.random() * 0.12
})
particles.splice(i, 1)
}
}

ctx.globalCompositeOperation = "source-over"
ctx.globalAlpha = 1
ctx.shadowBlur = 0

if (elapsed > 1800) {
drawMessage(ctx, width, height)
}

if (elapsed < 2100 || particles.length > 0) {
animationFrame = requestAnimationFrame(render)
return
}

drawMessage(ctx, width, height)
if (onComplete) onComplete()
}

animationFrame = requestAnimationFrame(render)

return () => {
if (animationFrame) cancelAnimationFrame(animationFrame)
}
}
