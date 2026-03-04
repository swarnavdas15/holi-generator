const DEFAULT_COLORS = [
    "#ff1744",
    "#ff9100",
    "#ffea00",
    "#00e676",
    "#2979ff",
    "#d500f9"
]

function rand(min, max) {
    return min + Math.random() * (max - min)
}

function pick(colors) {
    return colors[Math.floor(Math.random() * colors.length)]
}

export default class GulalParticleEngine {
    constructor({
        ctx,
        width,
        height,
        imageRect,
        pichkariSources = [],
        colors = DEFAULT_COLORS,
        minParticles = 1000,
        maxParticles = 2500
    }) {
        this.ctx = ctx
        this.width = width
        this.height = height
        this.imageRect = imageRect || { x: 0, y: 0, width, height }
        this.pichkariSources = pichkariSources
        this.colors = colors
        this.minParticles = minParticles
        this.maxParticles = maxParticles

        this.particles = []
        this.cloudParticles = []
        this.settled = []
        this.frameId = null
        this.running = false
        this.startTime = 0
        this.lastTime = 0
        this.wind = 0
        this.windLastShift = 0
        this.edgeAccumulator = 0
        this.nozzleAccumulator = 0
        this.burstAccumulator = 0
    }

    start() {
        if (this.running) return
        this.running = true
        this.seedParticles()
        this.frameId = requestAnimationFrame(this.animate)
    }

    stop() {
        this.running = false
        if (this.frameId) {
            cancelAnimationFrame(this.frameId)
            this.frameId = null
        }
    }

    seedParticles() {
        for (let i = 0; i < 220; i++) {
            this.spawnEdgeParticle()
        }
        for (let i = 0; i < 160; i++) {
            this.spawnBurstAboveImage()
        }
        for (let i = 0; i < 180; i++) {
            this.spawnCloudParticle()
        }
    }

    spawnEdgeParticle() {
        const fromLeft = Math.random() > 0.5
        const x = fromLeft ? rand(-20, 15) : rand(this.width - 15, this.width + 20)
        const y = rand(this.height * 0.08, this.height * 0.82)
        const dir = fromLeft ? 1 : -1
        this.particles.push({
            x,
            y,
            prevX: x,
            prevY: y,
            vx: dir * rand(0.4, 1.5),
            vy: rand(-0.4, 0.6),
            size: rand(0.5, 2.7),
            opacity: rand(0.2, 0.72),
            color: pick(this.colors),
            life: rand(4.5, 10.5),
            gravityFactor: rand(0.016, 0.038),
            turbulenceFactor: rand(0.04, 0.11)
        })
    }

    spawnFromNozzle(source) {
        const baseAngle = source.angle
        const speed = rand(0.7, 2.1)
        const angle = baseAngle + rand(-0.36, 0.36)
        const x = source.x + rand(-18, 18)
        const y = source.y + rand(-14, 14)
        this.particles.push({
            x,
            y,
            prevX: x,
            prevY: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: rand(0.7, 3),
            opacity: rand(0.28, 0.85),
            color: pick(this.colors),
            life: rand(3.2, 8.8),
            gravityFactor: rand(0.018, 0.034),
            turbulenceFactor: rand(0.05, 0.13)
        })
    }

    spawnBurstAboveImage() {
        const count = Math.floor(rand(80, 151))
        const cx = rand(this.imageRect.x + 40, this.imageRect.x + this.imageRect.width - 40)
        const cy = rand(this.imageRect.y - 26, this.imageRect.y + this.imageRect.height * 0.28)
        const radius = rand(10, 42)
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2)
            const r = Math.sqrt(Math.random()) * radius
            const x = cx + Math.cos(angle) * r
            const y = cy + Math.sin(angle) * r
            this.particles.push({
                x,
                y,
                prevX: x,
                prevY: y,
                vx: rand(-1.4, 1.4),
                vy: rand(-1.3, 1.1),
                size: rand(0.5, 2.8),
                opacity: rand(0.26, 0.76),
                color: pick(this.colors),
                life: rand(2.8, 9.5),
                gravityFactor: rand(0.015, 0.04),
                turbulenceFactor: rand(0.05, 0.14)
            })
        }
    }

    spawnCloudParticle() {
        const x = rand(0, this.width)
        const y = rand(this.imageRect.y - 30, this.imageRect.y + this.imageRect.height * 0.66)
        this.cloudParticles.push({
            x,
            y,
            vx: rand(-0.18, 0.18),
            vy: rand(-0.06, 0.11),
            size: rand(18, 44),
            opacity: rand(0.02, 0.08),
            color: pick(this.colors),
            life: rand(5, 14)
        })
    }

    keepParticleBudget() {
        if (this.particles.length < this.minParticles) {
            const needed = this.minParticles - this.particles.length
            for (let i = 0; i < needed; i++) {
                this.spawnEdgeParticle()
            }
            return
        }

        if (this.particles.length > this.maxParticles) {
            const trimCount = this.particles.length - this.maxParticles
            this.particles.splice(0, trimCount)
        }
    }

    inImageRect(x, y) {
        return (
            x >= this.imageRect.x &&
            y >= this.imageRect.y &&
            x <= this.imageRect.x + this.imageRect.width &&
            y <= this.imageRect.y + this.imageRect.height
        )
    }

    updateParticle(particle, dt) {
        particle.prevX = particle.x
        particle.prevY = particle.y

        particle.vy += 0.03 + particle.gravityFactor * dt * 60
        particle.vx += (Math.random() - 0.5) * particle.turbulenceFactor
        particle.vx += this.wind * 0.01
        particle.vx *= 0.98
        particle.vy *= 0.98
        particle.x += particle.vx
        particle.y += particle.vy
        particle.opacity -= 0.002 + dt * 0.02
        particle.life -= dt

        if (this.inImageRect(particle.x, particle.y)) {
            const boost = 0.004 + Math.random() * 0.01
            this.settled.push({
                x: particle.x + rand(-0.8, 0.8),
                y: particle.y + rand(-0.8, 0.8),
                size: particle.size * rand(0.72, 1.6),
                color: particle.color,
                opacity: Math.min(0.25, particle.opacity * 0.5 + boost),
                life: rand(0.5, 1.8)
            })
            particle.opacity = Math.min(1, particle.opacity + 0.002)
            particle.vx *= 0.95
            particle.vy *= 0.92
        }

        const outOfBounds =
            particle.x < -60 ||
            particle.x > this.width + 60 ||
            particle.y < -60 ||
            particle.y > this.height + 60

        return particle.life <= 0 || particle.opacity <= 0 || outOfBounds
    }

    updateCloudParticle(particle, dt) {
        particle.x += particle.vx + this.wind * 0.02
        particle.y += particle.vy
        particle.life -= dt
        particle.opacity -= dt * 0.002

        if (particle.x < -80) particle.x = this.width + 40
        if (particle.x > this.width + 80) particle.x = -40
        if (particle.y < -80) particle.y = this.height * 0.2
        if (particle.y > this.height + 80) particle.y = this.height * 0.4

        return particle.life <= 0 || particle.opacity <= 0
    }

    animate = (now) => {
        if (!this.running) return
        if (!this.startTime) {
            this.startTime = now
            this.lastTime = now
            this.windLastShift = now
        }
        const dt = Math.min(0.034, (now - this.lastTime) / 1000)
        this.lastTime = now

        if (now - this.windLastShift > 2000) {
            this.wind = rand(-0.8, 0.8)
            this.windLastShift = now
        }

        this.edgeAccumulator += dt
        this.nozzleAccumulator += dt
        this.burstAccumulator += dt

        while (this.edgeAccumulator > 0.016) {
            this.spawnEdgeParticle()
            this.edgeAccumulator -= 0.016
        }

        while (this.nozzleAccumulator > 0.03) {
            for (let i = 0; i < this.pichkariSources.length; i++) {
                const source = this.pichkariSources[i]
                const count = Math.floor(rand(5, 12))
                for (let j = 0; j < count; j++) {
                    this.spawnFromNozzle(source)
                }
            }
            this.nozzleAccumulator -= 0.03
        }

        while (this.burstAccumulator > 0.9) {
            this.spawnBurstAboveImage()
            this.burstAccumulator -= 0.9
        }

        if (this.cloudParticles.length < 120) {
            for (let i = this.cloudParticles.length; i < 120; i++) this.spawnCloudParticle()
        }

        for (let i = this.cloudParticles.length - 1; i >= 0; i--) {
            if (this.updateCloudParticle(this.cloudParticles[i], dt)) {
                this.cloudParticles.splice(i, 1)
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.updateParticle(this.particles[i], dt)) {
                this.particles.splice(i, 1)
            }
        }

        for (let i = this.settled.length - 1; i >= 0; i--) {
            const stain = this.settled[i]
            stain.life -= dt * 0.4
            stain.opacity *= 0.9985
            if (stain.life <= 0 || stain.opacity <= 0.01) {
                this.settled.splice(i, 1)
            }
        }

        this.keepParticleBudget()
        this.draw()
        this.frameId = requestAnimationFrame(this.animate)
    }

    draw() {
        const ctx = this.ctx
        ctx.save()

        for (let i = 0; i < this.cloudParticles.length; i++) {
            const p = this.cloudParticles[i]
            ctx.globalAlpha = p.opacity
            ctx.fillStyle = p.color
            ctx.shadowBlur = 18
            ctx.shadowColor = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
        }

        ctx.globalCompositeOperation = "multiply"
        for (let i = 0; i < this.settled.length; i++) {
            const stain = this.settled[i]
            ctx.globalAlpha = stain.opacity
            ctx.fillStyle = stain.color
            ctx.shadowBlur = 8
            ctx.shadowColor = stain.color
            ctx.beginPath()
            ctx.arc(stain.x, stain.y, stain.size, 0, Math.PI * 2)
            ctx.fill()
        }

        ctx.globalCompositeOperation = "source-over"
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]
            const speed = Math.hypot(p.vx, p.vy)

            if (speed > 1.8) {
                ctx.globalAlpha = Math.max(0.02, p.opacity * 0.25)
                ctx.strokeStyle = p.color
                ctx.lineWidth = Math.max(0.4, p.size * 0.5)
                ctx.beginPath()
                ctx.moveTo(p.prevX, p.prevY)
                ctx.lineTo(p.x, p.y)
                ctx.stroke()
            }

            ctx.globalAlpha = p.opacity
            ctx.fillStyle = p.color
            ctx.shadowBlur = 8
            ctx.shadowColor = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
        }

        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
        ctx.restore()
    }
}
