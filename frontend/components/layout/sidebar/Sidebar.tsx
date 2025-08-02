"use client";

import { NAVITEMS } from "@/constant/sidebar";
import Link from "next/link";
import { useState } from "react";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <div>
      <h1>Sidebar</h1>
      <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4">
          <ul className="space-y-1">
            {NAVITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.link}
                  // variant={"outline"}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.icon}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
