import { useState, useRef } from "react";

const PhotoUploader = ({ maxFiles = 5, label = "Upload Photos", onFilesChange }) => {
    const [files, setFiles] = useState([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const addFiles = (newFiles) => {
        const arr = Array.from(newFiles).slice(0, maxFiles - files.length);
        const updated = [...files, ...arr.map((f) => ({
            file: f,
            name: f.name,
            preview: URL.createObjectURL(f),
            size: (f.size / 1024).toFixed(0) + " KB",
        }))];
        setFiles(updated);
        if (onFilesChange) onFilesChange(updated);
    };

    const removeFile = (index) => {
        const updated = files.filter((_, i) => i !== index);
        setFiles(updated);
        if (onFilesChange) onFilesChange(updated);
    };

    return (
        <div>
            {label && <label style={{ display: "block", fontWeight: 500, fontSize: "13px", marginBottom: "6px" }}>{label}</label>}

            {/* Drop Zone */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                style={{
                    border: `2px dashed ${dragging ? "#0f766e" : "#d1d5db"}`,
                    borderRadius: "6px",
                    padding: "24px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragging ? "#f0fdf4" : "#fafafa",
                    transition: "all 0.15s",
                }}
            >
                <div style={{ fontSize: "24px" }}>📸</div>
                <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
                    Drag & drop photos or <span style={{ color: "#0f766e", fontWeight: 600 }}>browse</span>
                </p>
                <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {files.length}/{maxFiles} uploaded · JPG, PNG, HEIC · Max 10MB each
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => addFiles(e.target.files)}
            />

            {/* Previews */}
            {files.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                    {files.map((f, i) => (
                        <div key={i} style={{ position: "relative" }}>
                            <img
                                src={f.preview}
                                alt={f.name}
                                style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e5e7eb" }}
                            />
                            <button
                                onClick={() => removeFile(i)}
                                style={{
                                    position: "absolute", top: "-6px", right: "-6px",
                                    width: "18px", height: "18px", borderRadius: "50%",
                                    background: "#b91c1c", color: "white",
                                    border: "none", cursor: "pointer", fontSize: "10px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                ×
                            </button>
                            <div style={{ fontSize: "10px", color: "#9ca3af", textAlign: "center", marginTop: "2px", maxWidth: "72px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {f.size}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;
