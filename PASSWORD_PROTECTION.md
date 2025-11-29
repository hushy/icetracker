# 🔒 Protection par Mot de Passe

Ce document explique comment la protection par mot de passe fonctionne pour sécuriser votre clé API Groq.

## ⚠️ Avertissement

Cette protection **n'est PAS une sécurité absolue**. Elle empêche l'usage accidentel ou casual, mais quelqu'un de déterminé avec des connaissances techniques pourrait extraire la clé du code source JavaScript.

**Pour une vraie sécurité**, utilisez un backend (voir `VERCEL_BACKEND.md` pour des instructions).

---

## 🚀 Configuration Initiale

### Étape 1: Chiffrer votre clé API

Exécutez le script d'encryption:

```bash
node scripts/encrypt-key.js
```

Le script va:
1. Lire votre `VITE_GROQ_API_KEY` depuis `.env`
2. Vous demander un mot de passe (ou utiliser celui par défaut)
3. Chiffrer la clé avec AES-256
4. Mettre à jour `src/utils/encryption.js` avec la clé chiffrée

**Mot de passe:** Demandez au propriétaire du projet

### Étape 2: Nettoyer le .env

Une fois la clé chiffrée, **commentez ou supprimez** `VITE_GROQ_API_KEY` de votre `.env`:

```bash
# .env
# VITE_GROQ_API_KEY=gsk_abc123...  ← Commenté!
```

### Étape 3: Testez

```bash
npm run dev
```

Au premier lancement, l'app demandera le mot de passe:

```
🔒 Déverrouillage Requis
Mot de passe: [________]
```


---

## 🎯 Comment ça marche

### Architecture

```
User → Entre mot de passe
  ↓
Déchiffrement AES-256
  ↓
Clé API en mémoire (window.__GROQ_API_KEY__)
  ↓
Utilisée pour appels LLM
```

### Fichiers impliqués

1. **`src/utils/encryption.js`**
   - Contient la clé chiffrée (`ENCRYPTED_API_KEY`)
   - Fonctions de chiffrement/déchiffrement
   - Gestion de la clé en mémoire

2. **`src/components/PasswordPrompt.jsx`**
   - UI du prompt de mot de passe
   - Jolie modal avec feedback

3. **`src/utils/llmInterpreter.js`**
   - Utilise `getApiKey()` au lieu de `import.meta.env.VITE_GROQ_API_KEY`
   - Retourne `needsPassword: true` si la clé n'est pas déverrouillée

4. **`scripts/encrypt-key.js`**
   - Script Node.js pour chiffrer votre clé
   - À exécuter une seule fois lors de la configuration

---

## 🔄 Changer le mot de passe

Pour changer le mot de passe:

1. **Ajoutez temporairement votre clé dans `.env`:**
   ```bash
   VITE_GROQ_API_KEY=gsk_votre_cle_ici
   ```

2. **Relancez le script avec le nouveau mot de passe:**
   ```bash
   node scripts/encrypt-key.js
   # Enter password: nouveau_mot_de_passe
   ```

3. **Supprimez la clé du `.env`**

4. **Commitez le fichier mis à jour:**
   ```bash
   git add src/utils/encryption.js
   git commit -m "Update encrypted API key"
   ```

---

## 🔓 Déverrouillage

### Première utilisation

Au premier chargement de l'app, une modal s'affiche:

```
🔒 Déverrouillage Requis

Entrez le mot de passe pour activer 
les commandes vocales avec l'IA

Mot de passe: [________________]
         [Déverrouiller]
```

### Session

- La clé reste **en mémoire** pendant toute la session
- Si vous rechargez la page → Il faut re-entrer le mot de passe
- La clé n'est **jamais** sauvegardée dans localStorage

---

## 📊 Sécurité

### ✅ Ce qui est protégé

- Usage accidentel par des visiteurs
- Requêtes API non autorisées (casual)
- Exposition immédiate de la clé dans le code source

### ❌ Ce qui n'est PAS protégé

- Quelqu'un qui ouvre DevTools et lit le code
- Extraction de la clé chiffrée + bruteforce du mot de passe
- Interception des requêtes réseau (la clé est visible dans les headers)

### 🔒 Pour une vraie sécurité

Si vous publiez publiquement l'app:

1. **Option 1: Backend Serverless** (Recommandé)
   - Utilisez Vercel Functions (gratuit)
   - La clé reste côté serveur
   - Voir `VERCEL_BACKEND.md`

2. **Option 2: Limites API**
   - Configurez des quotas sur le dashboard Groq
   - Alertes de surconsommation
   - IP whitelisting si disponible

3. **Option 3: Usage privé uniquement**
   - Ne partagez pas l'URL publiquement
   - Hébergez localement ou sur un réseau privé

---

## 🐛 Dépannage

### "Invalid password"

- Vérifiez que vous utilisez le bon mot de passe
- Vérifiez que `ENCRYPTED_API_KEY` dans `encryption.js` est à jour

### "API key not unlocked"

- Entrez le mot de passe au démarrage de l'app
- Si vous rechargez la page, il faut re-entrer le mot de passe

### Le script d'encryption ne trouve pas la clé

```bash
# Ajoutez la clé manuellement au .env:
echo 'VITE_GROQ_API_KEY=gsk_votre_cle' >> .env

# Puis relancez:
node scripts/encrypt-key.js
```

### Permission denied sur le script

```bash
chmod +x scripts/encrypt-key.js
node scripts/encrypt-key.js
```

---

## 📝 Checklist de déploiement

Avant de déployer sur GitHub Pages:

- [ ] Clé API chiffrée dans `encryption.js`
- [ ] `VITE_GROQ_API_KEY` supprimée/commentée dans `.env`
- [ ] `.env` dans `.gitignore` ✅ (déjà fait)
- [ ] Testé le mot de passe localement
- [ ] Script `encrypt-key.js` dans le repo (pour maintenance future)
- [ ] Documentation à jour

---

## 💡 Alternative: Variables d'environnement de build

Si vous hébergez sur Vercel/Netlify, vous pouvez aussi:

1. Garder la clé dans les variables d'environnement de la plateforme
2. Ne pas utiliser le chiffrement
3. Configurer l'accès privé au site (Vercel Pro/Team)

Mais pour GitHub Pages, le chiffrement est nécessaire.

