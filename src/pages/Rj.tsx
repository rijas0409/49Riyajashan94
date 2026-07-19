import React from "react";

export default function RjPage() {
  return (
    <div className="w-screen h-screen overflow-hidden m-0 p-0 bg-[#f9f9fb]" id="rj-iframe-container">
      <iframe
        src="/RjRollout.html"
        title="Sruvo Rollout"
        className="w-full h-full border-none m-0 p-0 block"
        style={{ width: "100vw", height: "100vh" }}
        id="rj-rollout-iframe"
      />
    </div>
  );
}

