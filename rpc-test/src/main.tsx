import { StrictMode, Suspense } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <Suspense fallback={<div>Obviously a fallback</div>}>
      <App />
    </Suspense>
  </StrictMode>
);
