import "../App.css";
// import writeMaterialData from '../firebase'
// import React, { useEffect, useState } from 'react';
import { useEffect, useState } from "react";
// import { getDatabase } from 'firebase/database';
import { getDatabase, ref, onValue } from "firebase/database";
import { database } from "../../firebase";
import NetworkComponent from "../components/vis";

function Home() {
  // const [count, setCount] = useState(0)
  const [materials, setMaterials] = useState([]);
  const materialsRef = ref(database, "materials/");
  onValue(materialsRef, (snapshot) => {
    const data = snapshot.val();
    console.log(data); // Affiche les données récupérées
  });

  useEffect(() => {
    const db = getDatabase();
    const materialsRef = ref(db, "materials");

    // Écouter les changements dans la référence des matériaux
    onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      const formattedMaterials = [];

      // Formatage des données pour un tableau
      for (let id in data) {
        formattedMaterials.push({
          id,
          ...data[id],
        });
      }

      // Mise à jour de l'état avec les matériaux récupérés
      setMaterials(formattedMaterials);
    });

    // Optionnel : Nettoyage de l'écouteur d'événements lors du démontage du composant
    return () => {
      // Déconnecter l'écouteur si nécessaire
      // Dans ce cas, `onValue` ne nécessite pas de nettoyage, mais il est bon de le savoir pour d'autres types d'écouteurs.
    };
  }, []);

  return (
    <>
      {console.log("test")}
      <div>
        <h1>Materials List !!</h1>
        <NetworkComponent materials={materials} />
        {/* <ul>
        {materials.map((material) => (
          <li key={material.id}>
            <h2>{material.name}</h2>
            <p><a href={material.link} target="_blank" rel="noopener noreferrer">Link</a></p>
            <p>Category: {material.category}</p>
            {material.keywords && (

            <p>Keywords: {material.keywords.join(', ')}</p>
            )}
            <p>Comments: {material.comments}</p>
          </li>
        ))}
      </ul> */}
      </div>
    </>
  );
}

export default Home;
