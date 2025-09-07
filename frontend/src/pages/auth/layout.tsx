import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="body flex items-center justify-center min-h-screen">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
