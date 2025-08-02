export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const removeToken = () => {
  return localStorage.removeItem("access_token");
};

export const setToken = (token: string) => {
  return localStorage.setItem("access_token", token);
};

export const setUser = (user: any) => {
  return localStorage.setItem("user_info", user);
};

export const removeUser = () => {
  return localStorage.removeItem("user_info");
};

export const getUser = () => {
  return localStorage.getItem("user_info");
};
