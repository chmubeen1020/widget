import { createBrowserRouter } from "react-router";
import App from "../App"
import EmbedWidgetPage from "../GlobalComponents/EmbedWidgetPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Acts as the main wrapper/layout
    children: [
      {
        path: "embed/widget",
        element: <EmbedWidgetPage />,
      },
    ],
  },
  {
    /* 404 Catch-all route */
    path: "*",
    element: (
      <div className="flex h-screen items-center justify-center font-bold text-primary">
        404 - Page Not Found
      </div>
    ),
  },
]);

export default router;