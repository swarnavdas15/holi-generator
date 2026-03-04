import process from "node:process"
import { Buffer } from "node:buffer"

async function getRawBody(req) {
    if (Buffer.isBuffer(req.body)) return req.body
    if (typeof req.body === "string") return Buffer.from(req.body)
    const chunks = []
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
}

export const config = {
    api: {
        bodyParser: false
    }
}

function parseMultipartForm(bodyBuffer, contentType) {
    const boundaryMatch = contentType?.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
    const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]
    if (!boundary) {
        throw new Error("Missing multipart boundary")
    }

    const delimiter = Buffer.from(`--${boundary}`)
    const headerSeparator = Buffer.from("\r\n\r\n")
    const dispositionNamePattern = /name="([^"]+)"/i
    const fileNamePattern = /filename="([^"]*)"/i
    const contentTypePattern = /content-type:\s*([^\r\n]+)/i
    const files = {}
    const fields = {}

    let partStart = bodyBuffer.indexOf(delimiter)
    while (partStart !== -1) {
        partStart += delimiter.length

        if (bodyBuffer.subarray(partStart, partStart + 2).equals(Buffer.from("--"))) {
            break
        }

        if (bodyBuffer.subarray(partStart, partStart + 2).equals(Buffer.from("\r\n"))) {
            partStart += 2
        }

        const nextDelimiterIndex = bodyBuffer.indexOf(delimiter, partStart)
        if (nextDelimiterIndex === -1) break

        const partBuffer = bodyBuffer.subarray(partStart, nextDelimiterIndex - 2)
        const headerEndIndex = partBuffer.indexOf(headerSeparator)
        if (headerEndIndex === -1) {
            partStart = nextDelimiterIndex
            continue
        }

        const headersText = partBuffer.subarray(0, headerEndIndex).toString("utf8")
        const contentBuffer = partBuffer.subarray(headerEndIndex + headerSeparator.length)

        const nameMatch = headersText.match(dispositionNamePattern)
        const fieldName = nameMatch?.[1]
        if (!fieldName) {
            partStart = nextDelimiterIndex
            continue
        }

        const fileNameMatch = headersText.match(fileNamePattern)
        if (fileNameMatch) {
            const partContentTypeMatch = headersText.match(contentTypePattern)
            files[fieldName] = {
                fileName: fileNameMatch?.[1] || "upload.bin",
                contentType: partContentTypeMatch?.[1]?.trim() || "application/octet-stream",
                fileBuffer: contentBuffer
            }
        } else {
            fields[fieldName] = contentBuffer.toString("utf8")
        }

        partStart = nextDelimiterIndex
    }

    return { files, fields }
}

async function requestHuggingFaceOnce(url, apiKey, formData, timeoutMs) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        console.log("Sending request to HuggingFace")
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
            body: formData,
            signal: controller.signal
        })
        console.log("HF response status:", response.status)
        console.log("HF response headers:", response.headers.get("content-type"))

        if (!response.ok) {
            const errorBody = await response.text()
            console.error("HF error body:", errorBody)
            throw new Error(`HF API failed (${response.status}): ${errorBody}`)
        }

        return response
    } finally {
        clearTimeout(timeoutId)
    }
}

async function requestHuggingFaceWithRetry(url, apiKey, formData, timeoutMs = 15000) {
    try {
        return await requestHuggingFaceOnce(url, apiKey, formData, timeoutMs)
    } catch (error) {
        console.warn("HuggingFace request failed, retrying once:", error?.message || error)
        return requestHuggingFaceOnce(url, apiKey, formData, timeoutMs)
    }
}

export default async function handler(req, res) {
    try {
        console.log("AI endpoint triggered")

        if (req.method !== "POST") {
            res.setHeader("Allow", "POST")
            return res.status(405).json({ error: "Method Not Allowed" })
        }

        const apiKey = process.env.HF_API_KEY
        if (!apiKey) {
            return res.status(500).json({ error: "Missing HF_API_KEY" })
        }

        const contentType = req.headers["content-type"] || ""
        if (!contentType.includes("multipart/form-data")) {
            return res.status(400).json({ error: "Expected multipart/form-data with image and mask" })
        }

        const bodyBuffer = await getRawBody(req)
        const { files } = parseMultipartForm(bodyBuffer, contentType)
        console.log("Uploaded files:", Object.keys(files).length)

        const imagePart = files.image
        const maskPart = files.mask

        if (!imagePart?.fileBuffer || imagePart.fileBuffer.length === 0) {
            return res.status(400).json({ error: "Image missing" })
        }

        if (!maskPart?.fileBuffer || maskPart.fileBuffer.length === 0) {
            return res.status(400).json({ error: "Mask missing" })
        }

        console.log("Image buffer size:", imagePart.fileBuffer.length)
        console.log("Mask buffer size:", maskPart.fileBuffer.length)

        const prompt =
            "realistic photo of the same person from the uploaded image celebrating Holi in Vrindavan, preserving exact facial identity and natural skin tone, Banke Bihari temple style architecture in the background, vibrant colorful gulal powder clouds in the air, festive crowd and marigold flower petals around, person actively participating in Holi with authentic color on face and clothes, high detail festival atmosphere, cinematic realistic photography, vibrant festival lighting"
        const negativePrompt =
            "different person, changed identity, face distortion, deformed face, extra eyes, extra nose, duplicate face, plastic skin, cartoon style, painting style, blurry face, low detail, unrealistic skin tone"
        const hfUrl =
            "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2-inpainting"
        console.log("HF endpoint:", hfUrl)
        console.log("Prompt:", prompt)

        const hfFormData = new FormData()
        hfFormData.append(
            "image",
            new Blob([imagePart.fileBuffer], { type: imagePart.contentType }),
            imagePart.fileName
        )
        hfFormData.append(
            "mask_image",
            new Blob([maskPart.fileBuffer], { type: maskPart.contentType }),
            maskPart.fileName
        )
        hfFormData.append("prompt", prompt)
        hfFormData.append("negative_prompt", negativePrompt)
        hfFormData.append("strength", "0.32")
        hfFormData.append("num_inference_steps", "30")
        hfFormData.append("guidance_scale", "7")

        const response = await requestHuggingFaceWithRetry(
            hfUrl,
            apiKey,
            hfFormData,
            15000
        )

        const imageBuffer = await response.arrayBuffer()
        console.log("HF image size:", imageBuffer?.byteLength || 0)
        if (!imageBuffer || imageBuffer.byteLength === 0) {
            return res.status(502).json({ error: "Invalid image response from HuggingFace" })
        }

        res.setHeader("Content-Type", "image/png")
        return res.send(Buffer.from(imageBuffer))
    } catch (err) {
        console.error("AI processing failed:", err)
        return res.status(500).json({ error: "AI processing failed", details: err?.message || String(err) })
    }
}
