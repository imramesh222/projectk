import { API_URL } from "@/constant";
import { setToken, setUser } from "@/helpers/helpers";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// export const fetchUserData = createAsyncThunk(
//   "auth/fetchUserData",
//   (_, { rejectWithValue }) => {
//     try {
//     } catch (error) {}
//   }
// );

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { username: string; password: string }) => {
    try {
      const res = await axios.post(`${API_URL}/users/token/`, payload);

      console.log("RES", res);

      setToken(res.data.access);
      setUser(res.data.user);

      window.location.href = "/overview";

      return {
        user: res.data.user,
        accessToken: res.data.access,
        refreshToken: res.data.refresh,
      };
    } catch (error) {}
  }
);
