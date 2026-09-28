import React from 'react';
import AgriBot from '../../ui/AgriBot';

const KrishiSethuAI = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <AgriBot fullScreen={true} />
    </div>
  );
};

export default KrishiSethuAI;
