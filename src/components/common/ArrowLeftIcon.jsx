const ArrowLeftIcon = ({ size = 16, color = "currentColor", style = {} }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={style}
    >
        <path d="m15 18-6-6 6-6"/>
    </svg>
);

export default ArrowLeftIcon;
