import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import Home from "./pages/Home"
import Editor from "./pages/Editor"

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
