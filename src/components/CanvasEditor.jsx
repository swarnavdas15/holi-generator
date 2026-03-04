import { useEffect, useRef, useState } from "react"
import pichkariLeft from "../assets/pichkari_left.png"
import thali from "../assets/thali.png"
import { FaWhatsapp, FaFacebook, FaInstagram, FaSnapchat } from "react-icons/fa"
import GulalParticleEngine from "../engine/GulalParticleEngine"

export default function CanvasEditor({ image }) {
    const canvasRef = useRef(null)
    const overlayCanvasRef = useRef(null)
    const celebrationCanvasRef = useRef(null)
    const imageRef = useRef(null)
    const engineRef = useRef(null)
    const audioRef = useRef(null)
    const phaseTimersRef = useRef([])
    const celebrationFrameRef = useRef(null)
    const thaliRiseTimeoutRef = useRef(null)
    const celebrationResizeHandlerRef = useRef(null)
    const popupTimeoutRef = useRef(null)
    const popupShownRef = useRef(false)
    const shareShownRef = useRef(false)
    const [showShare, setShowShare] = useState(false)
    const [isSpraying, setIsSpraying] = useState(false)
    const [showCelebrationLayer, setShowCelebrationLayer] = useState(false)
    const [showPichkari, setShowPichkari] = useState(true)
    const [showThali, setShowThali] = useState(true)
    const [thaliRaised, setThaliRaised] = useState(false)
    const [showMessage, setShowMessage] = useState(false)
    const [holiMessage, setHoliMessage] = useState("")
    const [holiMessageChars, setHoliMessageChars] = useState([])
    const [showPopup, setShowPopup] = useState(false)

    const songs = ["/music/holi1.mp3",]
    const holiColors = ["#ff2e63", "#ffd400", "#00ff9c", "#00c8ff", "#ff7af6"]
    const holiMessages = [
        "Bura Na Mano Holi Hai!",
        "Rang Barse! Happy Holi!",
        "Spread Colors of Happiness!",
        "Holi Hai! Let the Colors Fly!",
        "Celebrate Colors, Celebrate Life!"
    ]
    const shareCaption = `Bura Na Mano Holi Hai! 🎨
Created with PURO TECH Holi Generator
#HoliHai #HappyHoli #PUROTECH #india #festivalofcolors`

    useEffect(() => {
        if (!image) return

        const baseCanvas = canvasRef.current
        const overlayCanvas = overlayCanvasRef.current
        if (!baseCanvas || !overlayCanvas) return

        const baseCtx = baseCanvas.getContext("2d")
        const overlayCtx = overlayCanvas.getContext("2d")
        if (!baseCtx || !overlayCtx) return

        const img = new Image()
        img.src = image

        img.onload = () => {
            imageRef.current = img
            baseCanvas.width = 600
            baseCanvas.height = 600
            overlayCanvas.width = 600
            overlayCanvas.height = 600
            baseCtx.clearRect(0, 0, 600, 600)
            overlayCtx.clearRect(0, 0, 600, 600)
            baseCtx.drawImage(img, 0, 0, 600, 600)
            startGulalCelebration()
            startHoliAnimation()
        }

        return () => {
            if (engineRef.current) {
                engineRef.current.stop()
                engineRef.current = null
            }
            if (celebrationFrameRef.current) {
                cancelAnimationFrame(celebrationFrameRef.current)
                celebrationFrameRef.current = null
            }
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
                audioRef.current = null
            }
            if (thaliRiseTimeoutRef.current) {
                clearTimeout(thaliRiseTimeoutRef.current)
                thaliRiseTimeoutRef.current = null
            }
            if (phaseTimersRef.current.length > 0) {
                for (let i = 0; i < phaseTimersRef.current.length; i++) {
                    clearTimeout(phaseTimersRef.current[i])
                }
                phaseTimersRef.current = []
            }
            if (celebrationResizeHandlerRef.current) {
                window.removeEventListener("resize", celebrationResizeHandlerRef.current)
                celebrationResizeHandlerRef.current = null
            }
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current)
                popupTimeoutRef.current = null
            }
            setShowShare(false)
            setIsSpraying(false)
            setShowCelebrationLayer(false)
            setShowPichkari(false)
            setShowThali(false)
            setThaliRaised(false)
            setShowMessage(false)
            setHoliMessage("")
            setHoliMessageChars([])
            setShowPopup(false)
        }
    }, [image])

    function playRandomSong() {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }

        const randomSong = songs[Math.floor(Math.random() * songs.length)]
        const audio = new Audio(randomSong)
        audio.volume = 0.7
        audioRef.current = audio
        audio.play().catch(() => {})
    }

    function setRandomHoliMessage() {
        const message = holiMessages[Math.floor(Math.random() * holiMessages.length)]
        const chars = message.split("").map((char) => ({
            char,
            color: holiColors[Math.floor(Math.random() * holiColors.length)]
        }))
        setHoliMessage(message)
        setHoliMessageChars(chars)
    }

    function exportCanvasImage() {
        const merged = getMergedCanvas()
        if (!merged) return null
        const imageData = merged.toDataURL("image/png")
        console.log("canvas.toDataURL imageData:", imageData)
        return imageData
    }

    function getMergedCanvas() {
        const baseCanvas = canvasRef.current
        const overlayCanvas = overlayCanvasRef.current
        if (!baseCanvas || !overlayCanvas) return null

        const merged = document.createElement("canvas")
        merged.width = baseCanvas.width
        merged.height = baseCanvas.height
        const mergedCtx = merged.getContext("2d")
        if (!mergedCtx) return null

        mergedCtx.drawImage(baseCanvas, 0, 0)
        mergedCtx.drawImage(overlayCanvas, 0, 0)
        return merged
    }

    async function createShareImageFile() {
        const mergedCanvas = getMergedCanvas()
        if (!mergedCanvas) {
            console.log("createShareImageFile: merged canvas not available")
            return null
        }

        const imageData = mergedCanvas.toDataURL("image/png")
        console.log("canvas.toDataURL imageData:", imageData)

        const blob = await new Promise((resolve) => {
            mergedCanvas.toBlob((result) => resolve(result), "image/png")
        })
        if (!blob) {
            console.log("createShareImageFile: blob conversion failed")
            return null
        }

        const file = new File([blob], "holi-photo.png", { type: "image/png" })
        console.log("createShareImageFile: file created", {
            name: file.name,
            type: file.type,
            size: file.size
        })
        return file
    }

    async function shareWithWebApi(file) {
        console.log("shareWithWebApi: received file", file)
        if (!file || !navigator.share || !navigator.canShare) return false

        const shareData = {
            title: "Holi Generator",
            text: shareCaption,
            files: [file]
        }

        if (!navigator.canShare({ files: [file] })) {
            console.log("shareWithWebApi: files sharing not supported")
            return false
        }

        try {
            await navigator.share(shareData)
            console.log("shareWithWebApi: share success")
            return true
        } catch (error) {
            console.log("shareWithWebApi: share failed or cancelled", error)
            return false
        }
    }

    async function copyShareCaption() {
        try {
            await navigator.clipboard.writeText(shareCaption)
            console.log("copyShareCaption: copied")
            return true
        } catch (error) {
            console.log("copyShareCaption: failed", error)
            return false
        }
    }

    function downloadCanvasImage(imageUrl) {
        const imageData = imageUrl || exportCanvasImage()
        if (!imageData) {
            console.log("downloadCanvasImage: no image data")
            return
        }

        const link = document.createElement("a")
        link.download = "holi-photo.png"
        link.href = imageData
        link.click()
        console.log("downloadCanvasImage: download triggered")
    }

    async function shareOnWhatsApp() {
        console.log("shareOnWhatsApp: button clicked")
        const file = await createShareImageFile()
        const didNativeShare = await shareWithWebApi(file)
        if (didNativeShare) return

        const url = "https://wa.me/?text=" + encodeURIComponent(shareCaption)
        downloadCanvasImage()
        window.open(url, "_blank", "noopener,noreferrer")
        console.log("shareOnWhatsApp: fallback used (download + caption link)")
    }

    async function shareOnFacebook() {
        console.log("shareOnFacebook: button clicked")
        const file = await createShareImageFile()
        const didNativeShare = await shareWithWebApi(file)
        if (didNativeShare) return

        if (!file) return

        const imageURL = URL.createObjectURL(file)
        console.log("shareOnFacebook: object URL generated", imageURL)

        const url =
            "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(imageURL)
        window.open(url, "_blank", "noopener,noreferrer")
        setTimeout(() => URL.revokeObjectURL(imageURL), 30000)
    }

    async function shareOnInstagram() {
        console.log("shareOnInstagram: button clicked")
        const file = await createShareImageFile()
        const didNativeShare = await shareWithWebApi(file)
        if (didNativeShare) return

        downloadCanvasImage()
        const copied = await copyShareCaption()
        alert(
            copied
                ? "Image downloaded and caption copied. Upload it to Instagram."
                : "Image downloaded. Upload it to Instagram and add the caption."
        )
    }

    async function shareOnSnapchat() {
        console.log("shareOnSnapchat: button clicked")
        const file = await createShareImageFile()
        const didNativeShare = await shareWithWebApi(file)
        if (didNativeShare) return

        downloadCanvasImage()
        const copied = await copyShareCaption()
        alert(
            copied
                ? "Image downloaded and caption copied for Snapchat."
                : "Image downloaded. Copy the caption from the share panel for Snapchat."
        )
    }

    function startGulalCelebration() {
        if (celebrationFrameRef.current) {
            cancelAnimationFrame(celebrationFrameRef.current)
            celebrationFrameRef.current = null
        }

        const colors = ["#ff2e63", "#ffd400", "#00ff9c", "#00c8ff", "#ff7af6"]
        const particles = []
        const spawnDurationMs = 2500
        const totalTarget = Math.floor(600 + Math.random() * 401)
        const spawnRatePerMs = totalTarget / spawnDurationMs
        const spawnCarryRef = { value: 0 }
        const dpr = window.devicePixelRatio || 1
        let startTime = 0
        let lastTime = 0

        setShowCelebrationLayer(true)

        function resizeCelebrationCanvas() {
            const canvas = celebrationCanvasRef.current
            if (!canvas) return
            canvas.width = Math.floor(window.innerWidth * dpr)
            canvas.height = Math.floor(window.innerHeight * dpr)
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        celebrationResizeHandlerRef.current = resizeCelebrationCanvas
        window.addEventListener("resize", resizeCelebrationCanvas)
        resizeCelebrationCanvas()

        function pickColor() {
            return colors[Math.floor(Math.random() * colors.length)]
        }

        function spawnParticle(count = 1) {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    size: Math.random() * 3 + 1,
                    vx: Math.random() * 4 - 2,
                    vy: Math.random() * 4 - 2,
                    life: 1,
                    color: pickColor()
                })
            }
        }

        spawnParticle(180)

        function animateCelebration(now) {
            const canvas = celebrationCanvasRef.current
            const ctx = canvas?.getContext("2d")
            if (!canvas || !ctx) {
                celebrationFrameRef.current = requestAnimationFrame(animateCelebration)
                return
            }

            if (!startTime) {
                startTime = now
                lastTime = now
            }
            const elapsedMs = now - startTime
            const dt = Math.min(33, now - lastTime)
            lastTime = now

            if (elapsedMs <= spawnDurationMs) {
                spawnCarryRef.value += spawnRatePerMs * dt
                while (spawnCarryRef.value >= 1) {
                    spawnParticle(1)
                    spawnCarryRef.value -= 1
                }
            }

            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i]
                p.vy += 0.05
                p.x += p.vx
                p.y += p.vy
                p.vx *= 0.995
                p.vy *= 0.995
                p.life -= elapsedMs <= spawnDurationMs ? 0.004 : 0.013

                ctx.globalAlpha = Math.max(0, p.life)
                ctx.fillStyle = p.color
                ctx.shadowColor = p.color
                ctx.shadowBlur = 12
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fill()

                const offscreen =
                    p.x < -40 ||
                    p.x > window.innerWidth + 40 ||
                    p.y < -40 ||
                    p.y > window.innerHeight + 40

                if (p.life <= 0 || offscreen) {
                    particles.splice(i, 1)
                }
            }

            ctx.globalAlpha = 1
            ctx.shadowBlur = 0

            if (elapsedMs <= spawnDurationMs || particles.length > 0) {
                celebrationFrameRef.current = requestAnimationFrame(animateCelebration)
            } else {
                if (celebrationResizeHandlerRef.current) {
                    window.removeEventListener("resize", celebrationResizeHandlerRef.current)
                    celebrationResizeHandlerRef.current = null
                }
                setShowCelebrationLayer(false)
                celebrationFrameRef.current = null
            }
        }

        celebrationFrameRef.current = requestAnimationFrame(animateCelebration)
    }

    function startHoliAnimation() {
        const baseCanvas = canvasRef.current
        const overlayCanvas = overlayCanvasRef.current
        const baseCtx = baseCanvas?.getContext("2d")
        const bgImage = imageRef.current
        if (!baseCanvas || !overlayCanvas || !baseCtx || !bgImage) return
        if (engineRef.current) {
            engineRef.current.stop()
            engineRef.current = null
        }

        for (let i = 0; i < phaseTimersRef.current.length; i++) {
            clearTimeout(phaseTimersRef.current[i])
        }
        phaseTimersRef.current = []

        shareShownRef.current = false
        popupShownRef.current = false
        setShowShare(false)
        setShowPopup(false)
        setIsSpraying(true)
        setShowPichkari(true)
        setShowThali(true)
        setThaliRaised(false)
        setShowMessage(false)
        setHoliMessage("")
        setHoliMessageChars([])
        playRandomSong()
        if (thaliRiseTimeoutRef.current) {
            clearTimeout(thaliRiseTimeoutRef.current)
        }
        thaliRiseTimeoutRef.current = setTimeout(() => setThaliRaised(true), 40)

        const pichkariSources = [
            { x: 120, y: 180, angle: 0.04 },
            { x: 480, y: 180, angle: Math.PI - 0.04 }
        ]

        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height)
        baseCtx.drawImage(bgImage, 0, 0, baseCanvas.width, baseCanvas.height)

        const engine = new GulalParticleEngine({
            ctx: baseCtx,
            width: baseCanvas.width,
            height: baseCanvas.height,
            imageRect: { x: 0, y: 0, width: baseCanvas.width, height: baseCanvas.height },
            pichkariSources
        })
        engineRef.current = engine
        engine.start()

        const sprayTimer = setTimeout(() => {
            setIsSpraying(false)
        }, 800)
        phaseTimersRef.current.push(sprayTimer)

        const celebrationTimer = setTimeout(() => {
            setShowPichkari(false)
            setShowThali(false)
            setRandomHoliMessage()
            setShowMessage(true)
            if (!shareShownRef.current) {
                shareShownRef.current = true
                setShowShare(true)
            }
        }, 2600)
        phaseTimersRef.current.push(celebrationTimer)

        const engineStopTimer = setTimeout(() => {
            if (engineRef.current) {
                engineRef.current.stop()
                engineRef.current = null
            }
            if (!popupShownRef.current) {
                popupShownRef.current = true
                popupTimeoutRef.current = setTimeout(() => {
                    setShowPopup(true)
                }, 1000)
            }
        }, 5200)
        phaseTimersRef.current.push(engineStopTimer)
    }

    return (
        <div className="w-full flex flex-col items-center px-2 sm:px-4">
            {showCelebrationLayer && (
                <canvas
                    ref={celebrationCanvasRef}
                    className="fixed top-0 left-0 w-full h-full pointer-events-none z-40"
                />
            )}
            <div className="relative w-full max-w-[600px] aspect-square">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full rounded-lg shadow-lg border border-red-600"
                />
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {showMessage && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 text-center">
                        <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-center whitespace-nowrap">
                            {(holiMessageChars.length > 0 ? holiMessageChars : holiMessage.split("").map((char) => ({ char, color: holiColors[Math.floor(Math.random() * holiColors.length)] }))).map((item, index) => (
                                <span key={`${item.char}-${index}`} style={{ color: item.color, textShadow: "0 0 8px currentColor" }}>
                                    {item.char}
                                </span>
                            ))}
                        </p>
                    </div>
                )}

                {image && (
                    <>
                        <img
                            src={pichkariLeft}
                            alt=""
                            aria-hidden="true"
                            className={`absolute left-[-36px] sm:left-[-50px] md:left-[-80px] top-[90px] sm:top-[105px] md:top-[120px] w-[80px] sm:w-[95px] md:w-[120px] pointer-events-none select-none transition-all duration-500 ${showPichkari ? (isSpraying ? "opacity-100" : "opacity-80") : "opacity-0"}`}
                        />
                        <img
                            src={pichkariLeft}
                            alt=""
                            aria-hidden="true"
                            className={`absolute right-[-36px] sm:right-[-50px] md:right-[-80px] top-[90px] sm:top-[105px] md:top-[120px] w-[80px] sm:w-[95px] md:w-[120px] scale-x-[-1] pointer-events-none select-none transition-all duration-500 ${showPichkari ? (isSpraying ? "opacity-100" : "opacity-80") : "opacity-0"}`}
                        />
                        <img
                            src={thali}
                            alt=""
                            aria-hidden="true"
                            className={`absolute z-20 left-1/2 -translate-x-1/2 w-[110px] sm:w-[130px] md:w-[160px] pointer-events-none select-none transition-[bottom,opacity] duration-700 ease-out ${showThali ? "opacity-95" : "opacity-0"} ${thaliRaised ? "bottom-[-30px] sm:bottom-[-36px] md:bottom-[-40px]" : "bottom-[-120px] sm:bottom-[-130px] md:bottom-[-150px]"}`}
                        />
                    </>
                )}
            </div>

            {showShare && (
                <div className="w-full max-w-2xl mt-6 rounded-xl border border-gray-700 bg-gray-900/70 p-4 sm:p-5">
                    <p className="font-semibold text-gray-100 mb-4">Share Your Holi Photo</p>

                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-3xl mt-4 sm:mt-6">
                        <button type="button" aria-label="Share on WhatsApp" onClick={shareOnWhatsApp} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-green-500 cursor-pointer hover:scale-110 transition-transform">
                            <FaWhatsapp />
                        </button>
                        <button type="button" aria-label="Share on Facebook" onClick={shareOnFacebook} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 cursor-pointer hover:scale-110 transition-transform">
                            <FaFacebook />
                        </button>
                        <button type="button" aria-label="Share on Instagram" onClick={shareOnInstagram} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-pink-500 cursor-pointer hover:scale-110 transition-transform">
                            <FaInstagram />
                        </button>
                        <button type="button" aria-label="Share on Snapchat" onClick={shareOnSnapchat} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-yellow-400 cursor-pointer hover:scale-110 transition-transform">
                            <FaSnapchat />
                        </button>
                    </div>
                </div>
            )}

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div
                        className="relative bg-black rounded-2xl shadow-2xl p-5 sm:p-8 w-[90%] max-w-[400px] text-center border border-red-500 overflow-hidden opacity-0 scale-95"
                        style={{ animation: "popupIn 300ms ease-out forwards" }}
                    >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,46,99,0.2),transparent_38%),radial-gradient(circle_at_86%_18%,rgba(255,212,0,0.18),transparent_36%),radial-gradient(circle_at_80%_84%,rgba(255,122,246,0.18),transparent_36%)]" />
                        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]" />

                        <button
                            type="button"
                            onClick={() => setShowPopup(false)}
                            className="absolute top-3 right-3 text-white/80 hover:text-white text-lg"
                            aria-label="Close popup"
                        >
                            X
                        </button>

                        <div className="relative">
                            <p className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400 bg-clip-text text-transparent mb-4">
                                Happy Holi from PURO TECH!
                            </p>

                            <p className="text-sm text-gray-100 leading-relaxed">
                                Liked this fun Holi generator?
                                <br />
                                <br />
                                Want creative, interactive and branded web experiences like this for your business?
                                <br />
                                <br />
                                Let{' '}
                                <span className="font-extrabold">
                                    <span className="text-white">PURO</span>
                                    <span className="text-red-600"> TECH.</span>
                                </span>{' '}
                                build something amazing for you!
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    const phone = '+918889287261'
                                    const message = encodeURIComponent(
                                        'Hi PURO TECH! I saw your Holi generator project and would like to discuss building something similar.'
                                    )
                                    const whatsappURL = `https://wa.me/${phone}?text=${message}`
                                    window.open(whatsappURL, '_blank', 'noopener,noreferrer')
                                }}
                                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 mt-4"
                            >
                                Chat with PURO TECH
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowPopup(false)}
                                className="block mx-auto mt-3 text-sm text-gray-300 hover:text-white transition"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes popupIn {
                            0% { opacity: 0; transform: scale(0.95); }
                            100% { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    )
}
