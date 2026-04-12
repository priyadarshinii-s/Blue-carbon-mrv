import React from "react";

const LoadingSpinner = ({ size = 50, color = "#0f766e" }) => {
    return (
        <div 
            style={{ 
                width: `${size}px`, 
                height: `${size}px`, 
                border: `4px solid ${color}40`, // 40 is hex for 25% opacity
                borderTop: `4px solid ${color}`, 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite" 
            }} 
        />
    );
};

export default LoadingSpinner;
