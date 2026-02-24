import React, { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import '../index.css';

const Card = ({ title, children, expandedContent, onExpand, isExpanded, onClose, className }) => {
    const [isHovered, setIsHovered] = useState(false);

    // If this card is currently expanded, it renders differently (as an overlay or full screen)
    // But usually the parent handles the layout change. 
    // Here we'll treat the card as the trigger, and the "expanded" state is handled by the parent 
    // or a separate Modal component.
    // Wait, the prompt says "when clicked that component will become bigger like a popup animation".


    // Use a portal or just render the overlay alongside the card content
    // We want the card to stay in the grid to maintain layout
    return (
        <>
            {isExpanded && (
                <div className="card-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
                    <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
                        <div className="card-header-expanded">
                            <h2 style={{ margin: 0, color: '#fff' }}>{title}</h2>
                            <button onClick={onClose} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="card-content-expanded">
                            {expandedContent || children}
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`card ${isHovered ? 'hovered' : ''} ${className || ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onExpand}
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isHovered ? '1px solid var(--color-primary)' : '1px solid transparent'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>{title}</h3>
                    {isHovered && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Click to expand</span>}
                </div>
                <div style={{ flex: 1 }}>
                    {children}
                </div>
            </div>
        </>
    );
};

export default Card;
