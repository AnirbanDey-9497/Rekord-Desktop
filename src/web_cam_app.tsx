import React from 'react';

function App() {
  const handleClose = () => {
    window.ipcRenderer.send('hideOrCloseWindow');
  };
  return (
    <div style={{ position: 'relative', padding: 16 }}>
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'transparent',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          color: '#888',
        }}
        aria-label="Close"
      >
        ×
      </button>
      <h1>WebCam App</h1>
    </div>
  );
}

export default App;
