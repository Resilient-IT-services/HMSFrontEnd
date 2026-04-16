"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [show, setShow] = useState(false);

  return (
      <div className="flex h-screen bg-[#f5f7fb]">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex w-1/2 relative">
          <img
              src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
              className="absolute w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-blue-900/90"></div>

          {/* Content */}
          <div className="relative z-10 text-white p-16 flex flex-col justify-between">

            <div className="flex items-center gap-2 text-lg font-semibold">
               Clinical Sanctuary
            </div>

            <div>


              <h1 className="text-4xl font-bold leading-tight mb-4">
                The Clinical Sanctuary
                <br /> for Modern Healthcare.
              </h1>

              <p className="text-sm opacity-80 max-w-md">
                Experience a focused journey into medical management.
                Our interface is designed to reduce cognitive load.
              </p>

              <div className="flex gap-10 mt-10">
                <div>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs opacity-70">UPTIME RELIABILITY</p>
                </div>

                <div>
                  <p className="text-2xl font-bold">HIPAA</p>
                  <p className="text-xs opacity-70">COMPLIANT SECURITY</p>
                </div>
              </div>
            </div>

            <p className="text-xs opacity-60">
              © Clinical Sanctuary
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50">
          <div className="w-[400px] bg-white p-8 rounded-xl shadow-md">

            {/* Heading */}
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">
              Welcome Back
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Please enter your credentials to access the secure medical environment.
            </p>

            {/* Username */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700 tracking-wide">
                USERNAME
              </label>
              <input
                  type="text"
                  placeholder="e.g. dr_smith_01"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg
                   bg-gray-50 text-gray-800 placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   transition duration-200"
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="text-xs font-medium text-gray-700 tracking-wide">
                PASSWORD
              </label>

              <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg
                     bg-gray-50 text-gray-800 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     transition duration-200"
                />

                {/* Eye Icon */}
                <span
                    className="absolute right-3 top-4 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => setShow(!show)}
                >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </span>
              </div>
            </div>
            

            {/* Error */}
            {/*<p className="text-red-500 text-xs mb-3">*/}
            {/*  Invalid username or password*/}
            {/*</p>*/}

            {/* Remember + Forgot */}
            <div className="flex justify-between items-center mb-5 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Remember Me
              </label>

              <a href="#" className="text-blue-600">
                Forgot Password?
              </a>
            </div>

            {/* Button */}
            <button className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800 transition">
              Login to Sanctuary →
            </button>

            {/* Footer */}
            <div className="text-center mt-6 text-xs text-gray-500">
              Authorized personnel only.
            </div>

          </div>
        </div>
      </div>
  );
}