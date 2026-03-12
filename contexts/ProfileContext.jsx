import { createContext, useContext } from "react";
import { API_BASE_URL } from "../theme/constants";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext();

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile | must be used inside ProfileProvider");
  return ctx;
};

export const ProfileProvider = ({ children }) => {
  const { token, user } = useAuth();

const uploadProfilePic = async (userId, uri) => {
  const formData = new FormData();

  formData.append("profilePic", {
    uri,
    name: "profile.jpg",
    type: "image/jpeg",
  });

  const res = await fetch(`${API_BASE_URL}/v2/users/${userId}/profile-picture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data?.message || "Upload failed");

  return data;
};
  const saveProfileToServer = async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/v2/users/${user.uid}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: profileData }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.message || "Failed");

    return data;
  };

  return (
    <ProfileContext.Provider
      value={{
        saveProfileToServer,
        uploadProfilePic,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};