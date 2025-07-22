# Présentation du projet **RAVE**

Le but de ce projet est de réaliser une application de transfert de timbre en
ReactNative. Le transfert de timbre sera réalisé par un réseau de neurones, le modèle
RAVE développé par Antoine Caillon à l’ircam. 


## **Comment Lancer le Projet ?**
Pour démarrer le projet sur votre machine locale, suivez les étapes ci-dessous :

1. **Clonez le dépôt :**
   ```bash
   git clone https://github.com/votre-utilisateur/nom-du-repo.git
   cd nom-du-repo
   ```

2. **Installez les dépendances nécessaires :**
   ```bash
   npm install
   ```
   Cela installera toutes les bibliothèques nécessaires définies dans le fichier `package.json`.

3. **Lancez l'application en mode développement :**
   ```bash
   npx expo start
   ```
   - Vous verrez un QR code dans la console ou l'interface web d'Expo.
   - Scannez ce QR code avec l'application **Expo Go** (disponible sur iOS et Android) pour lancer l'application sur votre appareil mobile.
   - Ou utilisez un émulateur (Android Studio, Xcode) si vous avez un environnement configuré.

## **Serveur pour la transformation :**

 Puisqu’il est difficile de faire réaliser les calculs du modèle au téléphone directement,
un serveur python sera mis en place pour la partie calcul et renverra les clips audio
transformés. 
**J'ai choisi de réimplémenter le serveur Flask pour mieux comprendre le fonctionnement de l'API et la communication client-serveur.** 

### **RaveScreen.js**
```
const SERVER_IP   = "x"; // Changez avec votre IP locale
const SERVER_PORT = "y"; // Changez avec votre port
```

## Serveur

Le serveur marche avec anaconda prompt
```

(base) C:\Users\>cd "...\rave-main"

(base) C:\Users>conda activate rave_env

(rave_env) C:\Users\rave-main>python server.py

```

## **État actuel du projet**
- enregistrement qui marche (seulement sur mobile)
- on peut écouter les sons (web et mobile) avec le bouton original, le lecteur réaliste ne marche pas sur web, en conséquence le bouton pause non plus ... Par contre sur mobile le lecteur marche et le bouton pause aussi, on peut même choisir un **instant t du son** !
- transformation qui marche (seulment sur pc avec les sons  **chiens, darbouka et voix**, les autres ne fonctionnent pas) en choisissant les assets locaux de l'application (présentés dans cette ordre : Piano, Voix, Chat, Chien et Darkbouka)  puis modele (**MODÈLE NEURAL** avec donc les sons Jazz, Parole, Darbouka, Chats et Chiens) et en cliquant sur **TRANSFORMÉ** pour obtenir le résultat ( Les modèles utilisent l'extension .ts par convention,  mais peuvent être .onnx selon l'implémentation.)

## Conclusion

- J'ai trouvé ce projet complexe mais passionnant, même s'il n'y a que trois transformations de sons qui fonctionnent cela m'a permis de comprendre la difficulté que ce type de projet représente.
- Les différences notables entre la partie web et mobile montrent que je dois encore progresser en React Native et aussi avec les serveurs (avec les différents endpoints) !

  
