import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap page-hero" style={{ textAlign: "center", minHeight: "50vh" }}>
      <h1 className="h1" style={{ margin: "0 auto" }}>404</h1>
      <p className="lead" style={{ margin: "16px auto 28px" }}>This page could not be found. இந்தப் பக்கம் கிடைக்கவில்லை.</p>
      <Link className="btn btn-primary" href="/en">Home / முகப்பு</Link>
    </div>
  );
}
