# 🎨 Picturaævox (Konva + Socket.IO)

**Picturaævox** est une application de dessin collaboratif en temps réel conçue avec [Konva.js](https://konvajs.org/) et [Socket.IO](https://socket.io/), en pur JavaScript. Elle propose deux interfaces distinctes : une pour les utilisateurs publics, et une pour les administrateurs via `/chantilly`. Développée avec ChatGPT par une grosse noob.

---

## ✨ Fonctionnalités

### Interface utilisateur (publique)
- ✍️ Dessin libre fluide avec pinceau ou pinceau texturé (effet spray)
- 🧽 Gomme
- ✋ Déplacement du canvas (pan)
- 🎨 Sélecteur de couleurs
- 📏 Réglage de l’épaisseur
- ⚙️ Interface mobile-first, épurée, sans zoom

### Interface admin
Accessible via [`/chantilly`](http://localhost:3000/chantilly)
- ❌ Ne peut pas dessiner
- 🗑️ Sélection/suppression d’objets (à venir)
- 🔍 Zoom, déplacement libre
- 🧭 Minimap dynamique
- 🧼 Effacement global du canvas (impacte tout le monde)
- 🖼️ Export du canvas en PNG
- ⚫/⚪ Changement de fond (noir/blanc)
- ↩️ Retour vers l’interface publique

---

## 🧱 Stack technique

- **Frontend** : Vanilla JS + Konva.js
- **Backend** : Node.js + Express + Socket.IO
- **Aucune dépendance frontend** (pas de React, Vue, etc.)

---

## 🚀 Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-utilisateur/live-drawing-app.git
cd live-drawing-app
