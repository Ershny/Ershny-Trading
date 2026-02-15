import React from 'react';
import './Button.css';

const Button = ({ children, onClick, className = '', size, fullWidth, inverted }) => {
    const baseClass = inverted ? 'btn-inverted' : 'btn-default';
    const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
    const fullWidthClass = fullWidth ? 'btn-full' : '';

    const combinedClassName = `${baseClass} ${sizeClass} ${fullWidthClass} ${className}`;

    return (
        <button onClick={onClick} className={combinedClassName}>
            {children}
        </button>
    );
};

// Exportăm PrimaryButton (Accent)
export const PrimaryButton = (props) => (
    <Button
        {...props}
        className={`${props.inverted ? 'primary-btn-inverted' : 'primary-btn-default'} ${props.className || ''}`}
    />
);

// Exportăm ErrorButton (Danger)
export const ErrorButton = (props) => (
    <Button
        {...props}
        className={`${props.inverted ? 'error-btn-inverted' : 'error-btn-default'} ${props.className || ''}`}
    />
);

export default Button;