# WarLike Networks
Infrastructure de numérotation et routage pour WarLike Telecom et WarLike Chat.
N01/N02 : console et attribution transactionnelle de numéros internes WL-700000001, etc. Ces identifiants ne sont pas E.164 et ne peuvent pas être appelés depuis le réseau public.
Pages Functions + D1 NETWORKS_DB + service binding WARLIKE_SERVER, à configurer avant le déploiement. Appliquer migrations/0001_numbers.sql à une base dédiée. Authentification par session WarLike Server ; pas de compte local ni de secret côté client. L'attribution est réservée au rôle owner, à un utilisateur présent dans le registre après connexion. Les numéros ne sont jamais réattribués après révocation. Les utilisateurs voient seulement leur ligne.
L'authentification inter-domaines nécessite un parcours de connexion dédié : voir /api/login. 
Prochaines phases : résolution interservices authentifiée, WebRTC/TURN, routage, opérateur SIP/PSTN et SMS. Aucun numéro public, appel ou SMS externe à ce stade.
```sh
npm test
```
