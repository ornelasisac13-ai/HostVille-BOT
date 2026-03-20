// ===============================
// utils/permissions.js - FUNÇÕES PARA VERIFICAR PERMISSÕES
// ===============================

function isAdmin(member, adminRoles) {
  if (!member) return false;
  if (!adminRoles || adminRoles.length === 0) return false;
  
  return member.roles.cache.some(role => 
    adminRoles.includes(role.id) || adminRoles.includes(role.name)
  );
}

function isStaff(userId, staffIds) {
  return staffIds.includes(userId);
}

module.exports = {
  isAdmin,
  isStaff
};
