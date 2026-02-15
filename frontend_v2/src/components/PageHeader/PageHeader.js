import React from 'react';
import './PageHeader.css';

const PageHeader = ({ children, variant = 'normal', color = 'accent' }) => {

    // Determinăm tipul de container (normal sau inverted)
    const containerBaseClass = variant === 'inverted' ? 'h1InvertedContainer' : 'h1Container';

    // Construim clasa finală (ex: "h1Container accent" sau "h1InvertedContainer danger")
    const finalContainerClass = `${containerBaseClass} ${color}`;

    // Setăm culoarea textului: dacă e normal, aplicăm clasa de text (textAccent sau textDanger)
    const textColorClass = variant === 'inverted'
        ? ''
        : `text${color.charAt(0).toUpperCase() + color.slice(1)}`;

    return (
        <div className={finalContainerClass}>
            <h1 className={textColorClass}>{children}</h1>
        </div>
    );
};

export default PageHeader;