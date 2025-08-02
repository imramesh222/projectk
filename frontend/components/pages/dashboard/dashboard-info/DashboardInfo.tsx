"use client";

import { API_URL } from "@/constant";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const DashboardInfo = () => {
  const { data } = useQuery({
    queryKey: ["dashboard-info"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");

      return await axios.get(`${API_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });

  console.log("DATA", data);
  return <div>DashboardInfo</div>;
};

export default DashboardInfo;
