import React from 'react';
import BackgroundEffects from '../landing/BackgroundEffects';

const RootLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      <BackgroundEffects />
      {children}
    </div>
  );
};

export default React.memo(RootLayout);
