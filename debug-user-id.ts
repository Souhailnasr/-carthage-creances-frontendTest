// Script de débogage pour vérifier l'ID utilisateur
// À exécuter dans la console du navigateur après connexion

console.log('🔍 === DÉBOGAGE ID UTILISATEUR ===');

// 1. Vérifier le localStorage
console.log('📦 Token dans localStorage:', localStorage.getItem('token'));
console.log('📦 User dans localStorage:', localStorage.getItem('user'));

// 2. Vérifier l'objet utilisateur parsé
try {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    console.log('👤 Objet utilisateur parsé:', user);
    console.log('🆔 ID utilisateur:', user.id);
    console.log('📧 Email utilisateur:', user.email);
    console.log('👤 Nom utilisateur:', user.nom);
    console.log('👤 Prénom utilisateur:', user.prenom);
    console.log('🔑 Rôle utilisateur:', user.role);
  }
} catch (error) {
  console.error('❌ Erreur parsing utilisateur:', error);
}

// 3. Vérifier le token JWT
const token = localStorage.getItem('token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🎫 Payload JWT:', payload);
    console.log('🆔 ID dans JWT:', payload.userId || payload.id || payload.user_id || payload.sub);
  } catch (error) {
    console.error('❌ Erreur parsing JWT:', error);
  }
}

console.log('🔍 === FIN DÉBOGAGE ===');


