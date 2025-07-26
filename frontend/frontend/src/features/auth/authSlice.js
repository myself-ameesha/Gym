import { createSlice } from "@reduxjs/toolkit";
import { 
  loginUser, 
  resetTrainerPassword, 
  checkPasswordResetRequired, 
  refreshAccessToken,
  getTrainers,
  updateTrainer,
  deleteTrainer,
  getMembers,
  getMembershipPlans, 
  createMembershipPlan,
  updateMembershipPlan, 
  deleteMembershipPlan,
  getPublicMembershipPlans,
  getCurrentMember,
  getCurrentTrainer,
  assignTrainerToMember,
  getTrainerMembers,
  getMemberTrainer,
  getAssignedMembers,
  markAttendance,
  getAttendanceHistory,
  createDietPlan,
  getDefaultDietPlans,
  createWorkoutRoutine,
  getWorkoutRoutineHistory,
  updateDietPlan,
  deleteDietPlan,
  getDietPlanHistory,
  getCurrentDietPlan,
  createDefaultDietPlan,
  assignDietPlan,
  getDailyWorkout, 
  createWeeklyWorkoutCycle,
  createRazorpayOrder, 
  verifyRazorpayPayment,
  fetchPaidMembers,
  updateOwnProfile,
  submitTrainerRating,
  updateTrainerRating,
  getTrainerRatings,
  getMemberRatings,
  fetchRevenueData,
  fetchSalesReportData,
  updateCurrentMember,
  changeMembershipPlan,
  verifyChangeMembershipPayment,
  getTrainerList,
  markTrainerAttendance, 
  getTrainerAttendanceHistory,
  getMembershipHistory
} from "./authApi";


const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  status: "idle",
  error: null,
  trainers: [],
  members: [], 
  currentMember: null,
  currentTrainer: null,
  membershipPlans: [],
  loading: false,
  trainerMembers: [],
  memberTrainer: null,
  assignmentLoading: false,
  assignmentError: null,
  assignedMembers: [],
  attendanceRecords: {}, 
  attendanceLoading: false,
  attendanceError: null,
  dietPlans: {}, 
  currentDietPlan: null,
  defaultDietPlans: [],
  workoutRoutines: {}, 
  dietLoading: false,
  dietError: null,
  workoutLoading: false,
  workoutError: null,
  dailyWorkout: null,
  payment: {
    order: null,
    loading: false,
    error: null
  },
  paidMembers: [],
  trainerRatings: {}, 
  memberRatings: [], 
  ratingLoading: false,
  ratingError: null,
  revenueData: null,
  salesReportData: null,
  trainerAttendanceRecords: {},
  loading: false,
  attendanceLoading: false,
  trainerAttendanceLoading: false,
  trainerListLoading: false,
  membershipHistory: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.status = "succeeded";
      state.error = null;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      state.currentMember = null;
      state.currentTrainer = null;
      state.assignedMembers = [];
      state.defaultDietPlans = [];
      state.dietPlans = {};
      state.currentDietPlan = null;
      state.workoutRoutines = {};
      state.dailyWorkout = null;
      state.revenueData = null;
      state.salesReportData = null;
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAssignmentError: (state) => {
      state.assignmentError = null;
    },
    clearAttendanceError: (state) => {
      state.attendanceError = null;
    },
    clearDietError: (state) => {
      state.dietError = null;
    },
    clearWorkoutError: (state) => {
      state.workoutError = null;
    },
    clearPaymentError: (state) => {
      state.payment.error = null;
    },
    clearRatingError: (state) => {
      state.ratingError = null;
    },
  },
  extraReducers: (builder) => {
    builder

          // Change Membership Plan
      .addCase(changeMembershipPlan.pending, (state) => {
        state.payment.loading = true;
        state.payment.error = null;
      })
      .addCase(changeMembershipPlan.fulfilled, (state, action) => {
        state.payment.loading = false;
        state.payment.order = action.payload;
      })
      .addCase(changeMembershipPlan.rejected, (state, action) => {
        state.payment.loading = false;
        state.payment.error = action.payload;
      })
      // Verify Change Membership Payment
      .addCase(verifyChangeMembershipPayment.pending, (state) => {
        state.payment.loading = true;
        state.payment.error = null;
      })
      .addCase(verifyChangeMembershipPayment.fulfilled, (state, action) => {
        state.payment.loading = false;
        state.payment.order = null;
        if (state.user) {
          state.user.has_paid = true;
          state.user.membership_plan = action.payload.new_plan;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
        if (state.currentMember) {
          state.currentMember.membership_plan = action.payload.new_plan;
        }
      })
      .addCase(verifyChangeMembershipPayment.rejected, (state, action) => {
        state.payment.loading = false;
        state.payment.error = action.payload;
      })

      // Create Razorpay Order
      .addCase(createRazorpayOrder.pending, (state) => {
        state.payment.loading = true;
        state.payment.error = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.payment.loading = false;
        state.payment.order = action.payload;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.payment.loading = false;
        state.payment.error = action.payload;
      })
      // Verify Razorpay Payment
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.payment.loading = true;
        state.payment.error = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state) => {
        state.payment.loading = false;
        state.payment.order = null;
        if (state.user) {
          state.user.has_paid = true;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.payment.loading = false;
        state.payment.error = action.payload;
      })

      // Fetch paid users
      .addCase(fetchPaidMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
    })
    .addCase(fetchPaidMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.paidMembers = action.payload;
    })
    .addCase(fetchPaidMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
    })

      // Login User
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.status = "succeeded";
        state.error = null;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Get trainers
      .addCase(getTrainers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTrainers.fulfilled, (state, action) => {
        state.trainers = action.payload;
        state.loading = false;
      })
      .addCase(getTrainers.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      // Get members
      .addCase(getMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMembers.fulfilled, (state, action) => {
        if (action.payload && action.payload.users) {
          state.members = action.payload.users;
        } else {
          state.members = action.payload || [];
        }
        state.loading = false;
      })
      .addCase(getMembers.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      // Current Member
      .addCase(getCurrentMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentMember.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMember = action.payload;
      })
      .addCase(getCurrentMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Current Trainer
      .addCase(getCurrentTrainer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentTrainer.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTrainer = action.payload;
      })
      .addCase(getCurrentTrainer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    .addCase(updateOwnProfile.fulfilled, (state, action) => {
      const updatedTrainer = action.payload;
      if (state.currentTrainer && state.currentTrainer.id === updatedTrainer.id) {
          state.currentTrainer = updatedTrainer;
      }
      state.trainers = state.trainers.map(trainer => 
          trainer.id === updatedTrainer.id ? updatedTrainer : trainer
      );
  })
  .addCase(updateTrainer.fulfilled, (state, action) => {
      const updatedTrainer = action.payload;
      state.trainers = state.trainers.map(trainer => 
          trainer.id === updatedTrainer.id ? updatedTrainer : trainer
      );
      if (state.currentTrainer && state.currentTrainer.id === updatedTrainer.id) {
          state.currentTrainer = updatedTrainer;
      }
  })
      // Delete trainer
      .addCase(deleteTrainer.fulfilled, (state, action) => {
        const deletedTrainerId = action.payload;
        state.trainers = state.trainers.filter(trainer => trainer.id !== deletedTrainerId);
      })
      .addCase(deleteTrainer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Membership plans (authenticated)
      .addCase(getMembershipPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMembershipPlans.fulfilled, (state, action) => {
        state.membershipPlans = action.payload;
        state.loading = false;
      })
      .addCase(getMembershipPlans.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(createMembershipPlan.fulfilled, (state, action) => {
        state.membershipPlans.push(action.payload.plan);
      })
      .addCase(updateMembershipPlan.fulfilled, (state, action) => {
        const updatedPlan = action.payload;
        state.membershipPlans = state.membershipPlans.map(plan =>
          plan.id === updatedPlan.id ? updatedPlan : plan
        );
      })
      .addCase(deleteMembershipPlan.fulfilled, (state, action) => {
        const deletedPlanId = action.payload;
        state.membershipPlans = state.membershipPlans.filter(plan => plan.id !== deletedPlanId);
      })
      // Public membership plans (unauthenticated)
      .addCase(getPublicMembershipPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPublicMembershipPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.membershipPlans = action.payload;
      })
      .addCase(getPublicMembershipPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Trainer Password
      .addCase(resetTrainerPassword.fulfilled, (state) => {
        if (state.user) {
          state.user.requires_password_reset = false;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(resetTrainerPassword.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Check Password Reset Required
      .addCase(checkPasswordResetRequired.fulfilled, (state, action) => {
        if (state.user) {
          state.user.requires_password_reset = action.payload.requires_password_reset;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(checkPasswordResetRequired.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Assign trainer to member
      .addCase(assignTrainerToMember.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(assignTrainerToMember.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        const updatedMember = action.payload.member;
        state.members = state.members.map(member => 
          member.id === updatedMember.id ? updatedMember : member
        );
        if (state.currentMember && state.currentMember.id === updatedMember.id) {
          state.currentMember = updatedMember;
        }
      })
      .addCase(assignTrainerToMember.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload;
      })
      // Get members assigned to a trainer
      .addCase(getTrainerMembers.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(getTrainerMembers.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        state.trainerMembers = action.payload.assigned_members;
      })
      .addCase(getTrainerMembers.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload;
      })
      // Get trainer assigned to a member
      .addCase(getMemberTrainer.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(getMemberTrainer.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        state.memberTrainer = action.payload.assigned_trainer;
      })
      .addCase(getMemberTrainer.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload;
      })
      // Assigned members cases
      .addCase(getAssignedMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignedMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.assignedMembers = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(getAssignedMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch assigned members';
      })
      // Mark Attendance
      .addCase(markAttendance.pending, (state) => {
        state.attendanceLoading = true;
        state.attendanceError = null;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.attendanceLoading = false;
        console.log('markAttendance response:', action.payload); // Debug log
        const { member, date, status, id, created_at, updated_at, trainer_email, trainer_name } = action.payload.attendance;
        const memberId = member;
        if (!state.attendanceRecords[memberId]) {
          state.attendanceRecords[memberId] = [];
        }
        state.attendanceRecords[memberId].push({ id, member, date, status, created_at, updated_at, trainer_email, trainer_name });
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.attendanceLoading = false;
        state.attendanceError = action.payload;
      })
      // Get Attendance History
      .addCase(getAttendanceHistory.pending, (state) => {
        state.attendanceLoading = true;
        state.attendanceError = null;
      })
      .addCase(getAttendanceHistory.fulfilled, (state, action) => {
        state.attendanceLoading = false;
        const memberId = action.meta.arg;
        state.attendanceRecords[memberId] = action.payload;
        console.log(`Updated attendanceRecords for member ${memberId}:`, action.payload); // Debug log
      })
      .addCase(getAttendanceHistory.rejected, (state, action) => {
        state.attendanceLoading = false;
        state.attendanceError = action.payload?.message || 'Failed to fetch attendance history';
      })
      // Default Diet Plans
      .addCase(getDefaultDietPlans.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(getDefaultDietPlans.fulfilled, (state, action) => {
        state.dietLoading = false;
        state.defaultDietPlans = action.payload;
      })
      .addCase(getDefaultDietPlans.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to fetch default diet plans';
      })
      .addCase(createDefaultDietPlan.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(createDefaultDietPlan.fulfilled, (state, action) => {
        state.dietLoading = false;
        state.defaultDietPlans.push(action.payload.diet_plan);
      })
      .addCase(createDefaultDietPlan.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to create default diet plan';
      })
      .addCase(createDietPlan.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(createDietPlan.fulfilled, (state, action) => {
        state.dietLoading = false;
        const memberId = action.payload.diet_plan.member;
        if (!state.dietPlans[memberId]) {
          state.dietPlans[memberId] = [];
        }
        state.dietPlans[memberId].push(action.payload.diet_plan);
      })
      .addCase(createDietPlan.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to create diet plan';
      })
      .addCase(updateDietPlan.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(updateDietPlan.fulfilled, (state, action) => {
        state.dietLoading = false;
        const memberId = action.payload.diet_plan.member;
        if (state.dietPlans[memberId]) {
          const index = state.dietPlans[memberId].findIndex(plan => plan.id === action.payload.diet_plan.id);
          if (index !== -1) {
            state.dietPlans[memberId][index] = action.payload.diet_plan;
          }
        }
      })
      .addCase(updateDietPlan.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to update diet plan';
      })
      .addCase(deleteDietPlan.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(deleteDietPlan.fulfilled, (state, action) => {
        state.dietLoading = false;
        for (const memberId in state.dietPlans) {
          state.dietPlans[memberId] = state.dietPlans[memberId].filter(plan => plan.id !== action.payload.dietPlanId);
        }
      })
      .addCase(deleteDietPlan.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to delete diet plan';
      })
      .addCase(getDietPlanHistory.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(getDietPlanHistory.fulfilled, (state, action) => {
        state.dietLoading = false;
        state.dietPlans[action.payload.memberId] = action.payload.plans;
      })
      .addCase(getDietPlanHistory.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to fetch diet plan history';
      })
      .addCase(getCurrentDietPlan.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(getCurrentDietPlan.fulfilled, (state, action) => {
        state.dietLoading = false;
        state.currentDietPlan = action.payload;
      })
      .addCase(getCurrentDietPlan.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to fetch current diet plan';
      })
      .addCase(assignDietPlan.pending, (state) => {
        state.dietLoading = true;
      })
      .addCase(assignDietPlan.fulfilled, (state, action) => {
        state.dietLoading = false;
        const memberId = action.payload.assignment.member;
        if (!state.dietPlans[memberId]) {
          state.dietPlans[memberId] = [];
        }
        state.dietPlans[memberId].push(action.payload.assignment.diet_plan);
      })
      .addCase(assignDietPlan.rejected, (state, action) => {
        state.dietLoading = false;
        state.dietError = action.payload || 'Failed to assign diet plan';
      })
      // Adding new cases for workout management
      .addCase(createWorkoutRoutine.pending, (state) => {
        state.workoutLoading = true;
        state.workoutError = null;
      })
      .addCase(createWorkoutRoutine.fulfilled, (state, action) => {
        state.workoutLoading = false;
        const memberId = action.payload.workout_routine.member;
        if (!state.workoutRoutines[memberId]) {
          state.workoutRoutines[memberId] = [];
        }
        state.workoutRoutines[memberId].push(action.payload.workout_routine);
      })
      .addCase(createWorkoutRoutine.rejected, (state, action) => {
        state.workoutLoading = false;
        state.workoutError = action.payload;
      })
      .addCase(getWorkoutRoutineHistory.pending, (state) => {
        state.workoutLoading = true;
        state.workoutError = null;
      })
      .addCase(getWorkoutRoutineHistory.fulfilled, (state, action) => {
        state.workoutLoading = false;
        state.workoutRoutines[action.payload.memberId] = action.payload.routines;
      })
      .addCase(getWorkoutRoutineHistory.rejected, (state, action) => {
        state.workoutLoading = false;
        state.workoutError = action.payload;
      })
      .addCase(getDailyWorkout.pending, (state) => {
        state.workoutLoading = true;
        state.workoutError = null;
      })
      .addCase(getDailyWorkout.fulfilled, (state, action) => {
        state.workoutLoading = false;
        state.dailyWorkout = action.payload;
      })
      .addCase(getDailyWorkout.rejected, (state, action) => {
        state.workoutLoading = false;
        state.workoutError = action.payload;
      })
      .addCase(createWeeklyWorkoutCycle.pending, (state) => {
        state.workoutLoading = true;
        state.workoutError = null;
      })
      .addCase(createWeeklyWorkoutCycle.fulfilled, (state, action) => {
        state.workoutLoading = false;
      })
      .addCase(createWeeklyWorkoutCycle.rejected, (state, action) => {
        state.workoutLoading = false;
        state.workoutError = action.payload;
      })

            // Submit Trainer Rating
      .addCase(submitTrainerRating.pending, (state) => {
        state.ratingLoading = true;
        state.ratingError = null;
      })
      .addCase(submitTrainerRating.fulfilled, (state, action) => {
        state.ratingLoading = false;
        const rating = action.payload.rating;
        const trainerId = rating.trainer;
        if (!state.trainerRatings[trainerId]) {
          state.trainerRatings[trainerId] = [];
        }
        state.trainerRatings[trainerId].push(rating);
        state.memberRatings.push(rating);
      })
      .addCase(submitTrainerRating.rejected, (state, action) => {
        state.ratingLoading = false;
        state.ratingError = action.payload;
      })
      // Update Trainer Rating
      .addCase(updateTrainerRating.pending, (state) => {
        state.ratingLoading = true;
        state.ratingError = null;
      })
      .addCase(updateTrainerRating.fulfilled, (state, action) => {
        state.ratingLoading = false;
        const updatedRating = action.payload.rating;
        const trainerId = updatedRating.trainer;
        if (state.trainerRatings[trainerId]) {
          state.trainerRatings[trainerId] = state.trainerRatings[trainerId].map(r =>
            r.id === updatedRating.id ? updatedRating : r
          );
        }
        state.memberRatings = state.memberRatings.map(r =>
          r.id === updatedRating.id ? updatedRating : r
        );
      })
      .addCase(updateTrainerRating.rejected, (state, action) => {
        state.ratingLoading = false;
        state.ratingError = action.payload;
      })
      // Get Trainer Ratings
      .addCase(getTrainerRatings.pending, (state) => {
        state.ratingLoading = true;
        state.ratingError = null;
      })
      .addCase(getTrainerRatings.fulfilled, (state, action) => {
        state.ratingLoading = false;
        const trainerId = action.meta.arg;
        state.trainerRatings[trainerId] = action.payload;
      })
      .addCase(getTrainerRatings.rejected, (state, action) => {
        state.ratingLoading = false;
        state.ratingError = action.payload;
      })
      // Get Member Ratings
      .addCase(getMemberRatings.pending, (state) => {
        state.ratingLoading = true;
        state.ratingError = null;
      })
      .addCase(getMemberRatings.fulfilled, (state, action) => {
        state.ratingLoading = false;
        state.memberRatings = action.payload;
      })
      .addCase(getMemberRatings.rejected, (state, action) => {
        state.ratingLoading = false;
        state.ratingError = action.payload;
      })
       // Fetch Revenue Data
      .addCase(fetchRevenueData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueData.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueData = action.payload;
      })
      .addCase(fetchRevenueData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSalesReportData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesReportData.fulfilled, (state, action) => {
        state.loading = false;
        state.salesReportData = action.payload;
      })
      .addCase(fetchSalesReportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

            // Update Member Profile
      .addCase(updateCurrentMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrentMember.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMember = action.payload;
      })
      .addCase(updateCurrentMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(markTrainerAttendance.fulfilled, (state, action) => {
        state.error = null;
      })
      .addCase(markTrainerAttendance.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark trainer attendance';
      })

      .addCase(getTrainerAttendanceHistory.pending, (state) => {
        state.trainerAttendanceLoading = true;
        state.error = null;
      })
    .addCase(getTrainerAttendanceHistory.fulfilled, (state, action) => {
      state.trainerAttendanceLoading = false;
      // Ensure trainerAttendanceRecords is initialized as an object
      if (!state.trainerAttendanceRecords) {
        state.trainerAttendanceRecords = {};
      }
      // Store the attendance records with trainerId as key
      // const trainerId = action.meta.arg;
      // state.trainerAttendanceRecords[trainerId] = action.payload;
      // state.error = null;

      // Extract data from the payload
      const { trainerId, data } = action.payload;
      
      // Store the paginated attendance records with trainerId as key
      // The data contains: { count, next, previous, results }
      state.trainerAttendanceRecords[trainerId] = data;
      state.error = null;

    })
      .addCase(getTrainerAttendanceHistory.rejected, (state, action) => {
        state.trainerAttendanceLoading = false;
        state.error = action.payload || 'Failed to fetch trainer attendance history';
      })
      .addCase(getTrainerList.pending, (state) => {
        state.trainerListLoading = true;
        state.error = null;
      })
      .addCase(getTrainerList.fulfilled, (state, action) => {
        state.trainerListLoading = false;
        state.trainers = action.payload;
      })
      .addCase(getTrainerList.rejected, (state, action) => {
        state.trainerListLoading = false;
        state.error = action.payload || 'Failed to fetch trainer list';
      })

      .addCase(getMembershipHistory.pending, (state) => {
        console.log('getMembershipHistory.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(getMembershipHistory.fulfilled, (state, action) => {
        console.log('getMembershipHistory.fulfilled with payload:', action.payload);
        console.log('Payload type:', typeof action.payload);
        console.log('Payload is array:', Array.isArray(action.payload));
        
        // Ensure we store an array
        state.membershipHistory = Array.isArray(action.payload) ? action.payload : [];
        state.loading = false;
        state.error = null;
      })
      .addCase(getMembershipHistory.rejected, (state, action) => {
        console.log('getMembershipHistory.rejected with error:', action.payload);
        state.error = action.payload || 'Failed to fetch membership history';
        state.loading = false;
        state.membershipHistory = []; // Reset to empty array on error
      })

      // Refresh Access Token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        const newAccessToken = action.payload;
        if (newAccessToken) {
          state.accessToken = newAccessToken;
          state.isAuthenticated = true;
          localStorage.setItem("accessToken", newAccessToken);
        }
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        console.error("Refresh token failed:", action.payload);
        state.error = action.payload;
        if (action.payload === "Session expired. Please log in again.") {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.revenueData = null;
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      });
  },
});

export const { loginSuccess, logout, clearError, clearAssignmentError, clearAttendanceError, clearDietError, clearWorkoutError, clearPaymentError, clearRatingError  } = authSlice.actions;
export default authSlice.reducer;




