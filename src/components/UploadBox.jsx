import { useDropzone } from "react-dropzone"

export default function UploadBox({ onUpload }) {
    const { getRootProps, getInputProps } = useDropzone({
        accept: { "image/*": [] },
        onDrop: (files) => {
            const file = files?.[0]
            if (!file) return
            onUpload(file)
        }
    })

    return (
        <div
            {...getRootProps()}
            className="relative overflow-hidden border-2 border-dashed border-red-500/70 rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 bg-black/50 hover:bg-black/65 hover:scale-[1.01]"
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,46,99,0.18),transparent_40%),radial-gradient(circle_at_85%_72%,rgba(0,200,255,0.15),transparent_42%)]" />
            <input {...getInputProps()} />

            <div className="relative">
                <p className="text-gray-100 text-xl md:text-2xl font-bold">Drop Your Photo, Start the Rang!</p>
                <p className="text-gray-300 text-sm md:text-base mt-3">
                    Drag and drop an image here, or click to upload.
                </p>
            </div>
        </div>
    )
}
