"use client";

import BuildingIcon from "@/assets/icons/BuildingIcon";
import ShieldIcon from "@/assets/icons/ShieldIcon";
import UsersIcon from "@/assets/icons/UsersIcon";
import { API_URL } from "@/constant";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import MetricCard from "../metric-card/MetricCard";

const OverviewInfo = () => {
  const { data } = useQuery({
    queryKey: ["dashboard-info"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");

      return await axios.get(`${API_URL}/dashboard/superadmin/overview/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });

  console.log("DATA", data);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label={"Total Users"}
          metric={data?.data.user_stats.total}
          icon={<UsersIcon className="w-8 h-8 stroke-gray-600" />}
        />
        <MetricCard
          label={"Organizations"}
          metric={data?.data.organization_stats.total}
          icon={<BuildingIcon className="w-8 h-8 stroke-gray-600" />}
        />
        <MetricCard
          label={"System Health"}
          metric={`${data?.data.system_health.storage.used_percent}%`}
          icon={<ShieldIcon className="w-8 h-8 stroke-gray-600" />}
        />
        {/* {SYMMETRIC_INFO.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))} */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {data?.data?.recent_activities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "user_signup"
                      ? "bg-green-500"
                      : activity.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 ">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.details}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Health
          </h3>
          <div className="space-y-4">
            {[
              { service: "API Server", status: "operational", uptime: "99.9%" },
              { service: "Database", status: "operational", uptime: "100%" },
              { service: "Cache Server", status: "warning", uptime: "98.5%" },
              {
                service: "File Storage",
                status: "operational",
                uptime: "99.8%",
              },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {service.status === "operational" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : service.status === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {service.service}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{service.uptime}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewInfo;
