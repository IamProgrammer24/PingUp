import React from "react";
import { Eye, MessagesSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Messages = () => {
  const navigate = useNavigate();
  const { connections } = useSelector((state) => state.connections);
  const currentUser = useSelector((state) => state.user.value);

  // Helper to get the other user in the connection
  const getDisplayUser = (connection) => {
    return connection.from_user_id._id === currentUser._id
      ? connection.to_user_id
      : connection.from_user_id;
  };

  return (
    <div className="min-h-screen relative bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600">Talk to your friends and family</p>
        </div>

        {/* Connected Users */}
        <div className="flex flex-col gap-3 mt-6">
          {connections.map((connection) => {
            const user = getDisplayUser(connection);

            return (
              <div
                className="max-w-xl flex flex-wrap gap-5 p-6 bg-white shadow rounded-md"
                key={user._id}
              >
                <img
                  className="rounded-full size-12 mx-auto"
                  src={user.profile_picture}
                  alt={user.username}
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{user.full_name}</p>
                  <p className="text-slate-500">@{user.username}</p>
                  <p className="text-sm text-gray-600">{user.bio}</p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    className="size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer gap-1"
                    onClick={() => navigate(`/messages/${user._id}`)}
                  >
                    <MessagesSquare className="w-4 h-4" />
                  </button>

                  <button
                    className="size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer"
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Messages;
