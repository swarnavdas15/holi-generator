import { useState } from "react"

import Navbar from "../components/Navbar"
import UploadBox from "../components/UploadBox"
import CanvasEditor from "../components/CanvasEditor"
import Footer from "../components/Footer"
import gulal1 from "../assets/gulal1.png"
import gulal3 from "../assets/gulal3.png"

export default function Editor() {
    const [image, setImage] = useState(null)

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
                    {!image && <UploadBox setImage={setImage} />}
                    {image && <CanvasEditor image={image} />}
                </div>
            </main>

            <Footer />
        </div>
    )
}
