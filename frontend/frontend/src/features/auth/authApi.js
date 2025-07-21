// src/features/auth/authApi.js
import axios from "axios";
import { loginSuccess, logout } from "./authSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Fix 1: Use a fallback value for API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        
        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
          refresh: refreshToken
        });
        
        const newAccessToken = response.data.access;
        localStorage.setItem("accessToken", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Only clear tokens and redirect if refresh fails
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // For 403, let the thunk handle it instead of redirecting
    return Promise.reject(error);
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const currentRefreshToken = getState().auth.refreshToken || localStorage.getItem("refreshToken");

      if (!currentRefreshToken) throw new Error("Refresh token not found");

      const { data } = await axios.post(`${API_URL}/api/token/refresh/`, {
        refresh: currentRefreshToken,
      });

      const accessToken = data.access;
      const newRefreshToken = data.refresh || currentRefreshToken;

      dispatch(
        loginSuccess({
          user: getState().auth.user,
          access: accessToken,
          refresh: newRefreshToken,
        })
      );

      // Store the new tokens in localStorage
      localStorage.setItem("accessToken", accessToken);
      if (data.refresh) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      console.error("Token refresh failed:", error.response?.data || error);
      dispatch(logout());
      return rejectWithValue("Session expired. Please log in again.");
    }
  }
);



export const createRazorpayOrder = createAsyncThunk(
  'auth/createRazorpayOrder',
  async ({ email, membership_plan_id }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/create-order/`, {
        email,
        membership_plan_id
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create payment order');
    }
  }
);

export const verifyRazorpayPayment = createAsyncThunk(
  'auth/verifyRazorpayPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/verify-payment/`, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to verify payment');
    }
  }
);


export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      console.log("Login attempt with:", { email: credentials.email });
      const response = await axios.post(`${API_URL}/api/login/`, {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      }, {
        headers: { "Content-Type": "application/json" }
      });
      
      console.log("Login successful, raw response:", response.data);

      let user, accessToken, refreshToken;
      if (response.data.user && response.data.tokens) {
        user = response.data.user;
        accessToken = response.data.tokens.access;
        refreshToken = response.data.tokens.refresh;
      } else {
        user = {
          id: response.data.id || response.data.user_id || "unknown",
          email: response.data.email || credentials.email,
          username: response.data.username || response.data.email,
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          user_type: response.data.user_type || "user",
          requires_password_reset: response.data.requires_password_reset || false
        };
        accessToken = response.data.access || response.data.accessToken;
        refreshToken = response.data.refresh || response.data.refreshToken;
      }

      if (!accessToken || !refreshToken || !user.email) {
        throw new Error("Incomplete authentication data received from server");
      }

      // Store tokens and user data
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      console.log("Tokens stored - accessToken:", accessToken, "refreshToken:", refreshToken); // Debug

      dispatch(loginSuccess({ 
        user,
        accessToken,
        refreshToken
      }));
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Login failed. Please try again.");
    }
  }
);

// Add this to your auth initialization
export const initializeAuth = () => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};


export const resetTrainerPassword = createAsyncThunk(
  "auth/resetTrainerPassword",
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const token = auth.accessToken || localStorage.getItem("accessToken");
      
      console.log("Resetting password with token:", token);
      
      // Ensure the data structure matches what the API expects
      const requestData = {
        new_password: passwordData.new_password,
      };
      
      // Add current_password only if it exists in the payload
      if (passwordData.current_password) {
        requestData.current_password = passwordData.current_password;
      }
      
      console.log("Password reset request data:", {
        ...requestData,
        new_password: requestData.new_password ? '[REDACTED]' : undefined,
        current_password: requestData.current_password ? '[REDACTED]' : undefined
      });
      
      const response = await axios.post(
        `${API_URL}/api/admins/reset-password/`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      
      console.log("Password reset successful:", response.data);
      
      // Update the auth state if we received new tokens
      if (response.data.access) {
        localStorage.setItem("accessToken", response.data.access);
        if (response.data.refresh) {
          localStorage.setItem("refreshToken", response.data.refresh);
        }
        
        // Update axios default headers with new token
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }
      
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error.response?.data || error);
      return rejectWithValue(
        error.response?.data?.error || "Failed to reset password"
      );
    }
  }
);

export const checkPasswordResetRequired = createAsyncThunk(
  'auth/checkPasswordReset',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/auth/check-password-reset/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check password reset status.');
    }
  }
);

export const createTrainer = createAsyncThunk(
  "auth/createTrainer",
  async (trainerData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      console.log("Token being sent:", token); // Debug log
      
      if (!token) {
        console.error("No token found in Redux state or localStorage");
        return rejectWithValue("No access token available. Please login again.");
      }

      const response = await axios.post(
        `${API_URL}/api/admins/create_trainer/`,
        trainerData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: false  
        }
      );
      console.log("Create trainer response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create trainer error:", error.response?.data || error.message);
      if (error.response?.status === 403) {
        return rejectWithValue(
          error.response.data?.error || 
          "Permission denied. Only admin users can create trainers."
        );
      }
      return rejectWithValue(
        error.response?.data?.error ||
        "Failed to create trainer. Please try again."
      );
    }
  }
);

export const getTrainers = createAsyncThunk(
  'auth/getTrainers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(`${API_URL}/api/admins/trainer-list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please login again.');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch trainers');
    }
  }
);

// Admin thunk to update any trainer
export const updateTrainer = createAsyncThunk(
  'auth/updateTrainer',
  async ({ trainerId, data }, { getState, rejectWithValue }) => {
      try {
          const token = getState().auth.accessToken || localStorage.getItem("accessToken");
          if (!token) {
              return rejectWithValue('No access token available. Please login again.');
          }
          const response = await axios.put(
              `${API_URL}/api/admins/trainer-edit/${trainerId}/`,
              data,
              { headers: { Authorization: `Bearer ${token}` } }
          );
          return response.data;
      } catch (error) {
          return rejectWithValue(error.response?.data?.error || 'Failed to update trainer');
      }
  }
);

// Trainer thunk to update their own profile
export const updateOwnProfile = createAsyncThunk(
  'auth/updateOwnProfile',
  async (data, { getState, rejectWithValue }) => {
      try {
          const token = getState().auth.accessToken || localStorage.getItem("accessToken");
          if (!token) {
              return rejectWithValue('No access token available. Please login again.');
          }
          const response = await axios.put(
              `${API_URL}/api/trainer/edit-profile/`,
              data,
              { headers: { Authorization: `Bearer ${token}` } }
          );
          return response.data;
      } catch (error) {
          return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
      }
  }
);

export const deleteTrainer = createAsyncThunk(
  'auth/deleteTrainer',
  async (trainerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      await axios.delete(`${API_URL}/api/admins/trainer-delete/${trainerId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return trainerId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete trainer');
    }
  }
);


export const getMembers = createAsyncThunk(
  'auth/getMembers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(`${API_URL}/api/admins/users_list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API response for members:", response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please login again.');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch members');
    }
  }
);


export const changeMembershipPlan = createAsyncThunk(
  'auth/changeMembershipPlan',
  async ({ membership_plan_id }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.post(
        `${API_URL}/api/change_membership_plan/`,
        { membership_plan_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to initiate subscription change');
    }
  }
);

export const verifyChangeMembershipPayment = createAsyncThunk(
  'auth/verifyChangeMembershipPayment',
  async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.post(
        `${API_URL}/api/verify_change_membership_payment/`,
        { razorpay_order_id, razorpay_payment_id, razorpay_signature },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to verify subscription change payment');
    }
  }
);



export const getMembershipPlans = createAsyncThunk(
  'auth/getMembershipPlans',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.get(`${API_URL}/api/admins/list_membership_plans/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please login again.');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch membership plans');
    }
  }
);

export const createMembershipPlan = createAsyncThunk(
  "auth/createMembershipPlan",
  async (planData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token available. Please login again.");
      }
      const response = await axios.post(
        `${API_URL}/api/admins/create_membership_plan/`,
        planData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        return rejectWithValue("Permission denied. Only admin users can create membership plans.");
      }
      return rejectWithValue(error.response?.data?.error || "Failed to create membership plan.");
    }
  }
);

export const updateMembershipPlan = createAsyncThunk(
  'auth/updateMembershipPlan',
  async ({ planId, data }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.put(
        `${API_URL}/api/admins/edit_membership_plan/${planId}/`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update membership plan');
    }
  }
);

export const deleteMembershipPlan = createAsyncThunk(
  'auth/deleteMembershipPlan',
  async (planId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      await axios.delete(`${API_URL}/api/admins/delete_membership_plan/${planId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return planId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete membership plan');
    }
  }
);

export const getPublicMembershipPlans = createAsyncThunk(
  'auth/getPublicMembershipPlans',
  async (_, { rejectWithValue }) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${API_URL}/api/admins/public_membership_plans/`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch public membership plans:", error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch membership plans');
    }
  }
);


export const getCurrentMember = createAsyncThunk(
  'auth/getCurrentMember',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.get(`${API_URL}/api/member/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Current member data:', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch member details');
    }
  }
);



export const getCurrentTrainer = createAsyncThunk(
  'auth/getCurrentTrainer',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.get(`${API_URL}/api/trainer/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Current trainer data:', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch trainer details');
    }
  }
);



// // Assign a trainer to a member
export const assignTrainerToMember = createAsyncThunk(
  'auth/assignTrainerToMember',
  async ({ memberId, trainerId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.post(
        `${API_URL}/api/admins/members/${memberId}/assign-trainer/`,
        { trainer_id: trainerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to assign trainer';
      return rejectWithValue(errorMessage);
    }
  }
);


// Get members assigned to a specific trainer
export const getTrainerMembers = createAsyncThunk(
  'auth/getTrainerMembers',
  async (trainerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(
        `${API_URL}/api/admins/trainers/${trainerId}/members/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch trainer members';
      return rejectWithValue(errorMessage);
    }
  }
);

// Get the trainer assigned to a specific member
export const getMemberTrainer = createAsyncThunk(
  'auth/getMemberTrainer',
  async (memberId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(
        `${API_URL}/api/members/${memberId}/trainer/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch member trainer';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getAssignedMembers = createAsyncThunk(
  'auth/getAssignedMembers',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      const token = auth.accessToken || localStorage.getItem('accessToken'); // Fix: Use 'accessToken'
      console.log('getAssignedMembers Token:', token); // Debug log
      if (!token) {
        dispatch(logout());
        return rejectWithValue('No token found');
      }

      const response = await axios.get(`${API_URL}/api/trainer/assigned-members/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned members:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        dispatch(logout());
        return rejectWithValue('Authentication failed. Please log in again.');
      }
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch assigned members');
    }
  }
);


export const markAttendance = createAsyncThunk(
  'auth/markAttendance',
  async ({ memberId, date, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.post(
        `${API_URL}/api/trainer/mark-attendance/`,
        { member: memberId, date, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to mark attendance');
    }
  }
);

export const getAttendanceHistory = createAsyncThunk(
  'auth/getAttendanceHistory',
  async (memberId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(
        `${API_URL}/api/trainer/members/${memberId}/attendance/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance history:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch attendance history');
    }
  }
);

export const createDefaultDietPlan = createAsyncThunk(
  "auth/createDefaultDietPlan",
  async (dietPlanData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/trainer/default-diet-plans/`, dietPlanData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return response.data;
    } catch (error) {
      console.error('Create Default Diet Plan Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to create default diet plan");
    }
  }
);

export const createDietPlan = createAsyncThunk(
  "auth/createDietPlan",
  async (dietPlanData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/trainer/diet-plan/`, dietPlanData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return response.data;
    } catch (error) {
      console.error('Create Diet Plan Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to create diet plan");
    }
  }
);

export const updateDietPlan = createAsyncThunk(
  "auth/updateDietPlan",
  async ({ dietPlanId, dietPlanData }, { rejectWithValue }) => {
    try {
      console.log('Updating Diet Plan:', { dietPlanId, dietPlanData });
      const response = await axios.put(`${API_URL}/api/trainer/diet-plan/${dietPlanId}/`, dietPlanData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return response.data;
    } catch (error) {
      console.error('Update Diet Plan Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to update diet plan");
    }
  }
);

export const deleteDietPlan = createAsyncThunk(
  "auth/deleteDietPlan",
  async (dietPlanId, { rejectWithValue }) => {
    try {
      console.log('Deleting Diet Plan ID:', dietPlanId);
      const response = await axios.delete(`${API_URL}/api/trainer/diet-plan/${dietPlanId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return { dietPlanId };
    } catch (error) {
      console.error('Delete Diet Plan Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to delete diet plan");
    }
  }
);

export const getDietPlanHistory = createAsyncThunk(
  "auth/getDietPlanHistory",
  async (memberId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/members/${memberId}/diet-plans/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return { memberId, plans: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch diet plan history");
    }
  }
);

export const getCurrentDietPlan = createAsyncThunk(
  "auth/getCurrentDietPlan",
  async (memberId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/members/${memberId}/current-diet-plan/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch current diet plan");
    }
  }
);

export const getDefaultDietPlans = createAsyncThunk(
  "auth/getDefaultDietPlans",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/trainer/default-diet-plans/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch default diet plans");
    }
  }
);

export const assignDietPlan = createAsyncThunk(
  "auth/assignDietPlan",
  async (assignmentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/trainer/assign-diet-plan/`, assignmentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      return response.data;
    } catch (error) {
      console.error('Assign Diet Plan Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || "Failed to assign diet plan");
    }
  }
);

// Create a workout routine
export const createWorkoutRoutine = createAsyncThunk(
  "auth/createWorkoutRoutine",
  async (
    { memberId, title, description, dayNumber, startDate, endDate },
    { getState, rejectWithValue }
  ) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token available. Please login again.");
      }
      const response = await axios.post(
        `${API_URL}/api/trainer/workout-routine/`,
        {
          member: memberId,
          title,
          description,
          day_number: dayNumber,
          start_date: startDate,
          end_date: endDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating workout routine:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to create workout routine");
    }
  }
);

// Get workout routine history for a member
export const getWorkoutRoutineHistory = createAsyncThunk(
  "auth/getWorkoutRoutineHistory",
  async (memberId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token available. Please login again.");
      }
      const response = await axios.get(
        `${API_URL}/api/trainer/members/${memberId}/workout-routines/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { memberId, routines: response.data };
    } catch (error) {
      console.error("Error fetching workout routine history:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch workout routine history");
    }
  }
);

// Get daily workout for a member on a specific date
export const getDailyWorkout = createAsyncThunk(
  "auth/getDailyWorkout",
  async ({ memberId, date }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token available. Please login again.");
      }
      const response = await axios.get(
        `${API_URL}/api/members/${memberId}/daily-workout/${date}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching daily workout:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch daily workout");
    }
  }
);

// Create a weekly workout cycle
export const createWeeklyWorkoutCycle = createAsyncThunk(
  "auth/createWeeklyWorkoutCycle",
  async ({ memberId, startDate }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No access token available. Please login again.");
      }
      const response = await axios.post(
        `${API_URL}/api/trainer/create-weekly-cycle/`,
        { member: memberId, start_date: startDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating weekly workout cycle:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || "Failed to create weekly workout cycle");
    }
  }
);


export const fetchPaidMembers = createAsyncThunk(
  'auth/fetchPaidMembers',
  async (_, { getState, rejectWithValue }) => {
      try {
          const { auth } = getState();
          if (!auth.accessToken) {
              throw new Error('No access token available');
          }
          const response = await axios.get(`${API_URL}/api/admins/paid-members/`, {
              headers: {
                  Authorization: `Bearer ${auth.accessToken}`,
              },
          });
          return response.data;
      } catch (error) {
          return rejectWithValue(error.response?.data?.error || 'Failed to fetch paid members');
      }
  }
);



export const submitTrainerRating = createAsyncThunk(
  'auth/submitTrainerRating',
  async (ratingData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.post(
        `${API_URL}/api/ratings/submit/`,
        ratingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Submit Trainer Rating Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to submit trainer rating');
    }
  }
);

export const updateTrainerRating = createAsyncThunk(
  'auth/updateTrainerRating',
  async (ratingData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      // For updates, we can use the same submit endpoint since your backend handles update_or_create
      const response = await axios.post(
        `${API_URL}/api/ratings/submit/`,
        ratingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Update Trainer Rating Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to update trainer rating');
    }
  }
);

export const getTrainerRatings = createAsyncThunk(
  'auth/getTrainerRatings',
  async (trainerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(
        `${API_URL}/api/trainer/${trainerId}/ratings/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Get Trainer Ratings Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch trainer ratings');
    }
  }
);

export const getMemberRatings = createAsyncThunk(
  'auth/getMemberRatings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(
        `${API_URL}/api/members/ratings/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Get Member Ratings Error:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch member ratings');
    }
  }
);

export const fetchRevenueData = createAsyncThunk(
  'revenue/fetchRevenueData',
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${API_URL}/api/admins/revenue/`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch revenue data');
    }
  }
);


// New fetchSalesReportData
export const fetchSalesReportData = createAsyncThunk(
  'salesReport/fetchSalesReportData',
  async ({ startDate, endDate }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${API_URL}/api/admins/sales-report/`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching sales report data:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch sales report data');
    }
  }
);


export const updateCurrentMember = createAsyncThunk(
  'auth/updateCurrentMember',
  async ({ id, data }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      const response = await axios.put(`${API_URL}/api/users/${id}/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Update member error:', error.response?.data || error);
      return rejectWithValue(error.response?.data?.detail || 'Failed to update profile');
    }
  }
);


export const getTrainerList = createAsyncThunk(
  'auth/getTrainerList',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.get(
        `${API_URL}/api/admins/trainer-list/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching trainer list:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch trainer list');
    }
  }
);
export const getTrainerAttendanceHistory = createAsyncThunk(
  'auth/getTrainerAttendanceHistory',
  async (trainerId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      console.log('Fetching attendance for trainerId:', trainerId);
      
      const response = await axios.get(
        `${API_URL}/api/trainer/attendance/${trainerId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('getTrainerAttendanceHistory response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching trainer attendance history:', error.response?.data || error.message);
      
      if (error.response?.status === 403) {
        return rejectWithValue('You do not have permission to view this attendance data');
      }
      if (error.response?.status === 404) {
        return rejectWithValue('Trainer not found');
      }
      
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'Failed to fetch trainer attendance history'
      );
    }
  }
);

export const markTrainerAttendance = createAsyncThunk(
  'auth/markTrainerAttendance',
  async ({ trainerId, date, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken || localStorage.getItem('accessToken');
      if (!token) {
        return rejectWithValue('No access token available. Please login again.');
      }
      
      const response = await axios.post(
        `${API_URL}/api/admins/mark-attendance/`,
        { trainer: trainerId, date, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('markTrainerAttendance response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error marking trainer attendance:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        return rejectWithValue(error.response.data.error || 'Invalid data provided');
      }
      if (error.response?.status === 403) {
        return rejectWithValue('You do not have permission to mark attendance');
      }
      
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'Failed to mark trainer attendance'
      );
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logout', 
  async (_, { dispatch }) => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch(logout());
    return { success: true };
  }
);