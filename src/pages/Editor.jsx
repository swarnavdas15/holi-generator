import { useEffect, useRef, useState } from "react"
import { FaceDetection } from "@mediapipe/face_detection"

import Navbar from "../components/Navbar"
import UploadBox from "../components/UploadBox"
import CanvasEditor from "../components/CanvasEditor"
import Footer from "../components/Footer"
import gulal1 from "../assets/gulal1.png"
import gulal3 from "../assets/gulal3.png"

export default function Editor() {
    const [image, setImage] = useState(null)
    const [originalImage, setOriginalImage] = useState(null)
    const [processedImage, setProcessedImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const detectorRef = useRef(null)
    const objectUrlsRef = useRef([])

    useEffect(() => {
        return () => {
            for (const url of objectUrlsRef.current) {
                URL.revokeObjectURL(url)
            }
            objectUrlsRef.current = []
        }
    }, [])

    function trackObjectUrl(url) {
        objectUrlsRef.current.push(url)
        return url
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(new Error("Failed to read file"))
            reader.readAsDataURL(file)
        })
    }

    function loadImageElement(src) {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error("Failed to load image"))
            img.src = src
        })
    }

    function buildResizedCanvas(sourceImage, maxWidth = 512) {
        const targetWidth = sourceImage.width > maxWidth ? maxWidth : sourceImage.width
        const scale = targetWidth / sourceImage.width
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(targetWidth)
        canvas.height = Math.round(sourceImage.height * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) return null
        ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height)
        return canvas
    }

    async function canvasToBlob(canvas, type, quality) {
        return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
    }

    async function getFaceDetector() {
        if (detectorRef.current) return detectorRef.current

        const detector = new FaceDetection({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        })
        detector.setOptions({
            model: "short",
            minDetectionConfidence: 0.5
        })
        detectorRef.current = detector
        return detector
    }

    async function detectFaceBox(imageEl) {
        try {
            const detector = await getFaceDetector()
            const detection = await new Promise((resolve, reject) => {
                detector.onResults((results) => {
                    const first = results?.detections?.[0]
                    if (!first?.locationData?.relativeBoundingBox) {
                        resolve(null)
                        return
                    }
                    resolve(first.locationData.relativeBoundingBox)
                })
                detector.send({ image: imageEl }).catch(reject)
            })
            if (!detection) return null
            return {
                x: Math.max(0, detection.xmin * imageEl.width),
                y: Math.max(0, detection.ymin * imageEl.height),
                width: Math.max(1, detection.width * imageEl.width),
                height: Math.max(1, detection.height * imageEl.height)
            }
        } catch (err) {
            console.error("Face detection failed", err)
            return null
        }
    }

    function buildFaceProtectionMask(width, height, face) {
        const maskCanvas = document.createElement("canvas")
        maskCanvas.width = width
        maskCanvas.height = height
        const ctx = maskCanvas.getContext("2d")
        if (!ctx) return null

        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, width, height)

        const fallbackFace = face || {
            x: width * 0.3,
            y: height * 0.2,
            width: width * 0.4,
            height: height * 0.4
        }

        const cx = fallbackFace.x + fallbackFace.width / 2
        const cy = fallbackFace.y + fallbackFace.height / 2
        const rx = fallbackFace.width * 0.34
        const ry = fallbackFace.height * 0.4

        // Black area is preserved in inpainting: keep the central face identity intact.
        const gradient = ctx.createRadialGradient(cx, cy, Math.max(8, rx * 0.35), cx, cy, Math.max(rx, ry))
        gradient.addColorStop(0, "rgba(0,0,0,1)")
        gradient.addColorStop(0.8, "rgba(0,0,0,1)")
        gradient.addColorStop(1, "rgba(255,255,255,0)")

        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx * 1.2, ry * 1.15, 0, 0, Math.PI * 2)
        ctx.fill()

        // Preserve eyes/nose/mouth center more strongly.
        ctx.fillStyle = "black"
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx * 0.85, ry * 0.9, 0, 0, Math.PI * 2)
        ctx.fill()

        return maskCanvas
    }

    async function prepareAIInputs(file) {
        const sourceDataUrl = await readFileAsDataUrl(file)
        const sourceImage = await loadImageElement(sourceDataUrl)
        const resizedCanvas = buildResizedCanvas(sourceImage, 512)
        if (!resizedCanvas) {
            throw new Error("Failed to prepare image canvas")
        }

        const resizedDataUrl = resizedCanvas.toDataURL("image/jpeg", 0.92)
        const resizedImage = await loadImageElement(resizedDataUrl)
        const faceBox = await detectFaceBox(resizedImage)
        const maskCanvas = buildFaceProtectionMask(resizedCanvas.width, resizedCanvas.height, faceBox)
        if (!maskCanvas) {
            throw new Error("Failed to build face-protection mask")
        }

        const imageBlob = await canvasToBlob(resizedCanvas, "image/jpeg", 0.92)
        const maskBlob = await canvasToBlob(maskCanvas, "image/png")
        if (!imageBlob || !maskBlob) {
            throw new Error("Failed to encode AI inputs")
        }

        return {
            imageFile: new File([imageBlob], "holi-ai-input.jpg", { type: "image/jpeg" }),
            maskFile: new File([maskBlob], "holi-ai-mask.png", { type: "image/png" })
        }
    }

    async function postProcessAIImage(blob) {
        const sourceUrl = URL.createObjectURL(blob)
        try {
            const img = await loadImageElement(sourceUrl)
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            if (!ctx) return blob

            ctx.filter = "contrast(1.08) saturate(1.15)"
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            ctx.filter = "none"

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            for (let i = 0; i < data.length; i += 4) {
                const grain = (Math.random() - 0.5) * 10
                data[i] = Math.max(0, Math.min(255, data[i] + grain))
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain))
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain))
            }
            ctx.putImageData(imageData, 0, 0)

            const finalBlob = await canvasToBlob(canvas, "image/png")
            return finalBlob || blob
        } finally {
            URL.revokeObjectURL(sourceUrl)
        }
    }

    async function generateHoliAI(imageFile) {
        const { imageFile: resizedFile, maskFile } = await prepareAIInputs(imageFile)
        const formData = new FormData()
        formData.append("image", resizedFile)
        formData.append("mask", maskFile)

        const res = await fetch("/api/holi-ai", {
            method: "POST",
            body: formData
        })

        if (!res.ok) {
            throw new Error(`AI processing failed with status ${res.status}`)
        }

        const blob = await res.blob()
        const enhancedBlob = await postProcessAIImage(blob)
        const aiImage = trackObjectUrl(URL.createObjectURL(enhancedBlob))
        setProcessedImage(aiImage)
        setImage(aiImage)
    }

    async function handleImageUpload(file) {
        if (!file) return
        const previewUrl = trackObjectUrl(URL.createObjectURL(file))

        setOriginalImage(previewUrl)
        setProcessedImage(null)
        setImage(previewUrl)
        setLoading(true)

        try {
            await generateHoliAI(file)
        } catch (error) {
            console.error("AI processing failed", error)
            setImage(previewUrl)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen text-white flex flex-col overflow-hidden bg-[#050505]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(255,46,99,0.2),transparent_35%),radial-gradient(circle_at_90%_16%,rgba(0,200,255,0.17),transparent_35%),radial-gradient(circle_at_15%_88%,rgba(255,212,0,0.14),transparent_33%),radial-gradient(circle_at_86%_84%,rgba(0,255,156,0.13),transparent_33%)]" />

            <Navbar />

            <main className="relative flex-grow">
                <div className="pointer-events-none absolute inset-0">
                    <img
                        src={gulal1}
                        alt=""
                        aria-hidden="true"
                        className="absolute left-[-80px] top-[120px] w-[220px] opacity-20 blur-[1px]"
                    />
                    <img
                        src={gulal3}
                        alt=""
                        aria-hidden="true"
                        className="absolute right-[-90px] bottom-[100px] w-[240px] opacity-20 blur-[1px]"
                    />
                </div>

                <div className="relative max-w-5xl mx-auto py-8 md:py-12 px-4">
                    {!image && <UploadBox onUpload={handleImageUpload} />}
                    {image && (
                        <>
                            {loading && (
                                <div className="mb-5 mx-auto max-w-[600px] rounded-xl border border-red-500/40 bg-black/70 px-4 py-3 text-center">
                                    <div className="inline-flex items-center gap-3">
                                        <span
                                            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent"
                                            aria-hidden="true"
                                        />
                                        <p className="text-sm sm:text-base font-medium text-red-100">
                                            Adding Holi magic to your photo...
                                        </p>
                                    </div>
                                </div>
                            )}
                            <CanvasEditor image={processedImage || originalImage || image} />
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
