import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="section not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>

      <Link to="/" className="btn">
        Go Home
      </Link>
    </section>
  );
}

export default NotFound;