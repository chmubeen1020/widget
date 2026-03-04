import { Outlet } from "react-router";

function App() {
  return (
    <div className="min-h-screen">
      {/* If you want a Navbar or Sidebar to show up on EVERY page, 
          you would put it here. 
      */}
      
      <main>
        {/* This is the magic part: it renders the current route's component */}
        <Outlet />
      </main>
    </div>
  );
}

export default App;