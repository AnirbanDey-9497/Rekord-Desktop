// import React from 'react';
// import './studio.css';

// function App() {
//   const handleClose = () => {
//     window.ipcRenderer.send('hideOrCloseWindow');
//   };
//   return (
//     <div style={{ position: 'relative', padding: 16 }}>
//       <button
//         onClick={handleClose}
//         style={{
//           position: 'absolute',
//           top: 8,
//           right: 8,
//           background: 'transparent',
//           border: 'none',
//           fontSize: 24,
//           cursor: 'pointer',
//           color: '#888',
//         }}
//         aria-label="Close"
//       >
//         ×
//       </button>
//       <h1>Studio</h1>
//     </div>
//   );
// }

// export default App;

import { StudioTray } from "./components/Global/StudioTray";

function App() {
    return <StudioTray />
}

export default App;