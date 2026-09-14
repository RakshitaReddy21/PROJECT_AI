import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { fetchUsersApi } from '../../api/admin';
import { UserTable } from '../../components/admin/UserTable';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsersApi();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadUsers();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      <div>
        <h1 className="text-xl font-bold text-white">Learner Account Directory</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Manage user accounts, system roles, and inspect individual learning journeys.
        </p>
      </div>

      <UserTable users={users} />
    </div>
  );
};
