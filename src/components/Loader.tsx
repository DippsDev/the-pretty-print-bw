import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full py-8">
      <section className="flex gap-2">
        <div className="dot-loader bg-[#ededed]" />
        <div className="dot-loader bg-[#b0b0b0]" />
        <div className="dot-loader bg-[#33383C]" />
        <div className="dot-loader bg-[#b0b0b0]" />
        <div className="dot-loader bg-[#ededed]" />
      </section>
      <style jsx>{`
        .dot-loader {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          animation: loader-pulse 1.5s infinite ease-in-out;
        }
        .dot-loader:not(:last-child) {
          margin-right: 8px;
        }
        .dot-loader:nth-child(1) { animation-delay: -0.3s; }
        .dot-loader:nth-child(2) { animation-delay: -0.1s; }
        .dot-loader:nth-child(3) { animation-delay: 0.1s; }
        .dot-loader:nth-child(4) { animation-delay: 0.3s; }
        .dot-loader:nth-child(5) { animation-delay: 0.5s; }
        @keyframes loader-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
