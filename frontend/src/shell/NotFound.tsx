import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export const NotFound = () => {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Page not found.";
  return (
    <div className="not-found">
      <h1>Oops!</h1>
      <p>{message}</p>
      <Link to="/prompts">Return to Prompts</Link>
    </div>
  );
};
