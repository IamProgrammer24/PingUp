import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  UserCheck,
  UserPlus,
  UserRoundPen,
  Users,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { fetchConnections } from "../features/connections/connectionSlice";
import api from "../api/axios";
import toast from "react-hot-toast";

const Connections = () => {
  const [currentTab, setCurrentTab] = useState("Followers");

  const navigate = useNavigate();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.user.value);
  const { connections, pendingConnections, followers, following } = useSelector(
    (state) => state.connections
  );

  const dataArray = [
    { label: "Followers", value: followers, icon: Users },
    { label: "Following", value: following, icon: UserCheck },
    { label: "Pending", value: pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: connections, icon: UserPlus },
  ];

  const getDisplayUser = (item) => {
    if (currentTab === "Connections" || currentTab === "pending") {
      return item.from_user_id._id === currentUser._id
        ? item.to_user_id
        : item.from_user_id;
    } else {
      return item;
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(await getToken()));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast(error.message);
    }
  };

  const acceptConnection = async (userId) => {
    try {
      const { data } = await api.post(
        "/api/user/accept",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(await getToken()));
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchConnections(token));
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title  */}
        <div className="mb-8">
          <h1 className="text-3xl fond-bold text-slate-900 mb-2">
            Connections
          </h1>
          <p className="text-slate-600">
            Manage your network and discover new connections
          </p>
        </div>

        {/* Count  */}
        <div className="mb-8 flex flex-wrap gap-6">
          {dataArray.map((item, index) => (
            <div
              className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md"
              key={index}
            >
              <b>{item.value.length}</b>
              <p className="text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm">
          {dataArray.map((tab) => (
            <button
              onClick={() => setCurrentTab(tab.label)}
              className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors cursor-pointer ${
                currentTab === tab.label
                  ? "bg-white font-medium text-black"
                  : "text-gray-500 hover:text-black"
              }`}
              key={tab.label}
            >
              <tab.icon className="w-4 h-4" />
              <span className="ml-1">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex flex-wrap gap-6 mt-6">
          {dataArray
            .find((item) => item.label === currentTab)
            ?.value.map((item) => {
              const user = getDisplayUser(item);

              return (
                <div
                  key={user._id}
                  className="w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-md"
                >
                  <img
                    src={user.profile_picture}
                    alt=""
                    className="rounded-full w-12 h-12 shadow-md mx-auto"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">
                      {user.full_name}
                    </p>
                    <p className="text-slate-500">@{user.username}</p>
                    <p className="text-slate-500">
                      {(user.bio || "").slice(0, 30)}...
                    </p>
                    <div className="flex max-sm:flex-col gap-2 mt-4">
                      <button
                        className="w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-950 transition text-white cursor-pointer"
                        onClick={() => navigate(`/profile/${user._id}`)}
                      >
                        View Profile
                      </button>

                      {currentTab === "Following" && (
                        <button
                          onClick={() => handleUnfollow(user._id)}
                          className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer"
                        >
                          Unfollow
                        </button>
                      )}

                      {currentTab === "Pending" && (
                        <button
                          onClick={() => acceptConnection(user._id)}
                          className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer"
                        >
                          Accept
                        </button>
                      )}

                      {currentTab === "Connections" && (
                        <button
                          onClick={() => navigate(`/messages/${user._id}`)}
                          className="w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Connections;
