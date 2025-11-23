import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use useState with an initializer function to create the div only once.
    // This is a safe way to perform lazy initialization without side-effects in render.
    const [container] = useState(() => document.createElement('div'));

    useEffect(() => {
        // Append the container to the body when the component mounts.
        document.body.appendChild(container);

        // Remove the container from the body when the component unmounts.
        // This cleanup function will be called by React.
        return () => {
            document.body.removeChild(container);
        };
    }, [container]); // The effect runs only once as the container is stable.

    // Render the children into the container.
    return createPortal(children, container);
};

export default Portal;
