import { Outlet } from 'react-router-dom';

export default function ClientLayout() {
  return (
    <>
      <div className="ambient-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      <div id="toast-container"></div>
      <Outlet />
    </>
  );
}
