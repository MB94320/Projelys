# Déploiement Projelys sur Vercel

## 1. Pré-requis
- Repo GitHub connecté à Vercel
- Variables d'environnement configurées sur Vercel
- Base Supabase PostgreSQL accessible via `DATABASE_URL`

## 2. Variables à configurer
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## 3. Déploiement
1. Tester en local :
   - `npm install`
   - `npm run build`
2. Commit :
   - `git add .`
   - `git commit -m "feat: maj loadplan"`
3. Push :
   - `git push origin main`
4. Vérifier le déploiement sur Vercel

## 4. Vérifications après déploiement
- Auth OK
- Page loadplan OK
- Graph charge/capacité OK
- API `/api/loadplan` OK

## 5. Roadmap ensuite
1. Multi-entreprise
2. Gestion des rôles par entreprise
3. Abonnement Stripe par entreprise
4. Webhook Stripe
5. Restrictions de fonctionnalités selon le plan