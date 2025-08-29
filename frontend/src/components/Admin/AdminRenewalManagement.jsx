import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, Calendar, CreditCard, AlertTriangle, Search, Filter, Mail, Phone, RefreshCw } from 'lucide-react';
import { getRenewalEligibleMembers } from '../../features/auth/authApi';

const AdminRenewalManagement = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiration_date');

  const {
    renewalEligibleMembers,
    renewalEligibleMembersLoading,
    renewalEligibleMembersError
  } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getRenewalEligibleMembers());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getRenewalEligibleMembers());
  };

  const getStatusBadge = (status) => {
    switch (status.status) {
      case 'expired':
        return {
          color: 'bg-red-500',
          textColor: 'text-white',
          icon: <AlertTriangle size={14} />
        };
      case 'expiring_soon':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-black',
          icon: <Calendar size={14} />
        };
      case 'no_plan':
        return {
          color: 'bg-gray-500',
          textColor: 'text-white',
          icon: <AlertTriangle size={14} />
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-white',
          icon: null
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const getPriorityScore = (member) => {
    if (member.membership_status?.status === 'expired') return 1;
    if (member.membership_status?.status === 'expiring_soon') {
      return 2 + (30 - Math.abs(member.days_until_expiration || 0));
    }
    if (member.membership_status?.status === 'no_plan') return 50;
    return 100;
  };

  const filteredAndSortedMembers = (renewalEligibleMembers?.eligible_members || [])
    .filter(member => {
      const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      return matchesSearch && member.membership_status?.status === statusFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return getPriorityScore(a) - getPriorityScore(b);
        case 'expiration_date':
          if (!a.expiration_date && !b.expiration_date) return 0;
          if (!a.expiration_date) return 1;
          if (!b.expiration_date) return -1;
          return new Date(a.expiration_date) - new Date(b.expiration_date);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'plan_value':
          const priceA = a.current_plan ? parseFloat(a.current_plan.price) : 0;
          const priceB = b.current_plan ? parseFloat(b.current_plan.price) : 0;
          return priceB - priceA;
        default:
          return 0;
      }
    });

  const handleContactMember = (member) => {
    // Open email client
    const subject = encodeURIComponent('Membership Renewal Reminder');
    const body = encodeURIComponent(`Dear ${member.name},\n\nYour membership is ${member.membership_status?.message?.toLowerCase()}. Please contact us to renew your membership.\n\nBest regards,\nGym Management Team`);
    window.open(`mailto:${member.email}?subject=${subject}&body=${body}`);
  };

  const handleCallMember = (member) => {
    if (member.phone) {
      window.open(`tel:${member.phone}`);
    }
  };

  const getStatsCards = () => {
    const members = renewalEligibleMembers?.eligible_members || [];
    const stats = members.reduce((acc, member) => {
      switch (member.membership_status?.status) {
        case 'expired':
          acc.expired += 1;
          break;
        case 'expiring_soon':
          acc.expiringSoon += 1;
          break;
        case 'no_plan':
          acc.noPlan += 1;
          break;
      }
      return acc;
    }, { expired: 0, expiringSoon: 0, noPlan: 0 });

    return [
      {
        title: 'Expired Memberships',
        value: stats.expired,
        icon: <AlertTriangle className="text-red-500" size={24} />,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      },
      {
        title: 'Expiring Soon',
        value: stats.expiringSoon,
        icon: <Calendar className="text-yellow-500" size={24} />,
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20'
      },
      {
        title: 'No Plan Selected',
        value: stats.noPlan,
        icon: <Users className="text-gray-500" size={24} />,
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20'
      }
    ];
  };

  if (renewalEligibleMembersLoading && !renewalEligibleMembers) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white">Loading renewal eligible members...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Membership Renewal Management</h1>
              <p className="text-slate-400">Monitor and manage member renewals</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={renewalEligibleMembersLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={renewalEligibleMembersLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {renewalEligibleMembersError && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-6">
            {renewalEligibleMembersError}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {getStatsCards().map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">{stat.title}</p>
                  <p className="text-white text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="expired">Expired</option>
                  <option value="expiring_soon">Expiring Soon</option>
                  <option value="no_plan">No Plan</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none appearance-none"
                >
                  <option value="priority">Sort by Priority</option>
                  <option value="expiration_date">Sort by Expiration</option>
                  <option value="name">Sort by Name</option>
                  <option value="plan_value">Sort by Plan Value</option>
                </select>
              </div>
            </div>

            <div className="text-slate-400 text-sm">
              Showing {filteredAndSortedMembers.length} of {renewalEligibleMembers?.eligible_members?.length || 0} members
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          {renewalEligibleMembersLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">Loading members...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="text-left py-4 px-6 text-slate-300 font-semibold">Member</th>
                      <th className="text-left py-4 px-6 text-slate-300 font-semibold">Status</th>
                      <th className="text-left py-4 px-6 text-slate-300 font-semibold">Current Plan</th>
                      <th className="text-left py-4 px-6 text-slate-300 font-semibold">Expiration</th>
                      <th className="text-left py-4 px-6 text-slate-300 font-semibold">Days</th>
                      <th className="text-left py-4 px-6 text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedMembers.map((member, index) => {
                      const statusBadge = getStatusBadge(member.membership_status || {});
                      return (
                        <tr
                          key={member.id}
                          className={`border-t border-slate-700 hover:bg-slate-700/50 ${
                            index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-white">{member.name || 'N/A'}</div>
                              <div className="text-sm text-slate-400">{member.email || 'N/A'}</div>
                              {member.phone && (
                                <div className="text-sm text-slate-400">{member.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${statusBadge.color} ${statusBadge.textColor}`}>
                              {statusBadge.icon}
                              <span>{member.membership_status?.message || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white">
                              {member.current_plan ? (
                                <>
                                  <div className="font-medium">{member.current_plan.name}</div>
                                  <div className="text-sm text-slate-400">₹{member.current_plan.price}</div>
                                </>
                              ) : (
                                <span className="text-slate-400">No Plan</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-white">
                            {formatDate(member.expiration_date)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`font-semibold ${
                              member.days_until_expiration === null ? 'text-slate-400' :
                              member.days_until_expiration < 0 ? 'text-red-400' :
                              member.days_until_expiration <= 7 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {member.days_until_expiration === null ? 'N/A' : 
                               member.days_until_expiration < 0 ? `${Math.abs(member.days_until_expiration)} overdue` :
                               `${member.days_until_expiration} left`}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleContactMember(member)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                                title="Send Email"
                              >
                                <Mail size={16} />
                              </button>
                              {member.phone && (
                                <button
                                  onClick={() => handleCallMember(member)}
                                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                                  title="Call Member"
                                >
                                  <Phone size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => alert(`View renewal options for ${member.name}`)}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                                title="Renewal Options"
                              >
                                <CreditCard size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAndSortedMembers.length === 0 && !renewalEligibleMembersLoading && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-400 text-lg">No members found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bulk Actions */}
        {filteredAndSortedMembers.length > 0 && (
          <div className="mt-6 bg-slate-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="text-slate-300">
                <span className="font-semibold">{filteredAndSortedMembers.length}</span> members need attention
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const emails = filteredAndSortedMembers.map(m => m.email).filter(Boolean).join(',');
                    if (emails) {
                      const subject = encodeURIComponent('Membership Renewal Reminder');
                      const body = encodeURIComponent('Dear Members,\n\nThis is a friendly reminder about your membership renewal. Please contact us to discuss your options.\n\nBest regards,\nGym Management Team');
                      window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
                    } else {
                      alert('No valid email addresses found');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Mail size={16} />
                  <span>Email All</span>
                </button>
                <button
                  onClick={() => {
                    // Create CSV content
                    const csvHeaders = ['Name', 'Email', 'Phone', 'Status', 'Plan', 'Expiration Date', 'Days Until Expiration'];
                    const csvRows = filteredAndSortedMembers.map(member => [
                      member.name || '',
                      member.email || '',
                      member.phone || '',
                      member.membership_status?.message || '',
                      member.current_plan?.name || 'No Plan',
                      formatDate(member.expiration_date),
                      member.days_until_expiration?.toString() || 'N/A'
                    ]);
                    
                    const csvContent = [csvHeaders, ...csvRows]
                      .map(row => row.map(field => `"${field}"`).join(','))
                      .join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `renewal-eligible-members-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Export List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Information */}
        {renewalEligibleMembers?.summary && (
          <div className="mt-6 bg-slate-800 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Renewal Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-slate-300">
                <div className="font-medium">Total Revenue at Risk</div>
                <div className="text-white text-lg">₹{renewalEligibleMembers.summary.total_revenue_at_risk || 0}</div>
              </div>
              <div className="text-slate-300">
                <div className="font-medium">Average Plan Value</div>
                <div className="text-white text-lg">₹{renewalEligibleMembers.summary.average_plan_value || 0}</div>
              </div>
              <div className="text-slate-300">
                <div className="font-medium">Members This Week</div>
                <div className="text-white text-lg">{renewalEligibleMembers.summary.expiring_this_week || 0}</div>
              </div>
              <div className="text-slate-300">
                <div className="font-medium">Members This Month</div>
                <div className="text-white text-lg">{renewalEligibleMembers.summary.expiring_this_month || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRenewalManagement;