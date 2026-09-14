import React, { useState } from 'react';
import { User, Space, Project } from '../../types';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, User as UserIcon, ShieldAlert, ArrowRight } from 'lucide-react';
import { appStorage } from '../../services/storage/localStorageStore';

export interface UserTableProps {
  users: User[];
}

export const UserTable: React.FC<UserTableProps> = ({ users }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'learner' | 'admin'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const spaces = appStorage.get('spaces') || [];
  const projects = appStorage.get('projects') || [];
  const activities = appStorage.get('activities') || [];

  // Filter users based on query and role filter
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-[#F1E8E3] rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-xs text-[#292524] placeholder-[#78716C] focus:outline-none focus:border-[#F8C9B0]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#78716C]" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl text-xs text-[#292524] font-mono focus:outline-none focus:border-[#F8C9B0]"
          >
            <option value="all">All Roles</option>
            <option value="learner">Learner</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="w-full overflow-x-auto border border-[#F1E8E3] rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-xs text-[#292524]">
          <thead className="bg-[#FFF8F5] text-[#78716C] font-mono uppercase text-[10px] border-b border-[#F1E8E3]">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Joined Date</th>
              <th className="px-4 py-3.5 text-center">Spaces</th>
              <th className="px-4 py-3.5 text-center">Projects</th>
              <th className="px-4 py-3.5 text-center">Mastery Progress</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1E8E3]">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-xs text-[#78716C] font-mono">
                  No matching user accounts found.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const userSpaces = spaces.filter((s) => s.userId === u.id);
                const userProjects = projects.filter((p) => p.userId === u.id);
                const avgProgress =
                  userProjects.length > 0
                    ? Math.round(userProjects.reduce((sum, p) => sum + (p.masteryScore || 0), 0) / userProjects.length)
                    : 0;

                return (
                  <tr key={u.id} className="hover:bg-[#FFF0E8]/40 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#FFF0E8] border border-[#F8C9B0] flex items-center justify-center font-semibold text-xs text-[#E9825B] flex-shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            u.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#292524] truncate">{u.name}</p>
                          <p className="text-[11px] text-[#78716C] font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-[#FFF0E8] text-[#E9825B] border-[#F8C9B0]'
                            : 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[#78716C]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-semibold text-[#292524]">
                      {userSpaces.length}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-semibold text-[#292524]">
                      {userProjects.length}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 bg-[#FFF0E8] h-2 rounded-full overflow-hidden border border-[#F8C9B0]/50">
                          <div
                            className="bg-[#F29B73] h-full rounded-full transition-all"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-[#292524]">
                          {avgProgress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#E9825B] hover:text-[#D97348] transition-colors"
                      >
                        Select User <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#F1E8E3] bg-[#FFF8F5] flex items-center justify-between text-xs font-mono text-[#78716C]">
            <span>
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-white border border-[#F1E8E3] disabled:opacity-40 hover:bg-[#FFF0E8] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#292524]" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded bg-white border border-[#F1E8E3] disabled:opacity-40 hover:bg-[#FFF0E8] transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#292524]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
